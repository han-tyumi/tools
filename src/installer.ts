import { existsSync, fmt, parse, path } from '../deps.ts'
import { escapeRegex, getJsFn, homeDir } from './utils.ts'

export interface InstallerOptions {
  /**
   * The filename to be used for downloaded tool versions.
   * If a string is used, `%s` will be replaced with the downloaded tool's version.
   */
  filename?: ((version: string) => string) | string

  /** Returns the version for a given filename. */
  version?: (filename: string) => string | undefined

  /**
   * The URL to download a tool from when given a version.
   * If a string is used, `%s` will be replaced with the tool's version.
   */
  downloadURL?: ((version: string) => string) | string

  /**
   * Strict format for tool versions where `#`s denote version numbers.
   * This allows URLs and filenames to be formatted consistently as missing
   * version numbers will be replaced with 0s.
   */
  versionFmt?: string

  /**
   * The directory to store downloaded tool versions.
   * This can be absolute or relative to the current working directory.
   */
  downloadDir?: string

  /** Whether or not to reuse already downloaded tools (defaults to true). */
  cache?: boolean

  /** Function called with the path to the downloaded tool file to install. */
  installFn?: ((filepath: string) => void) | string
}

export interface InstallerConfig extends InstallerOptions {
  /**
   * The filename to be used for downloading tool versions.
   * The first `%s` token will be replaced with the the downloaded tool's version.
   */
  filename?: string

  /**
   * The URL to download a tool from when given a version.
   * The first `%s` token will be replaced with the tool's version.
   */
  downloadURL?: string

  /**
   * Path to the function to be called with the path to the downloaded tool file to install.
   * This function can either be a default export or a named export specified after a `#` at the end of the path.
   */
  installFn?: string
}

type InstallerConfigExt = 'yml' | 'yaml' | 'ts' | 'js'

/**
 * Helps with the download and installation of tool versions.
 */
export class Installer implements InstallerOptions {
  private static _basename = 'toolsrc'
  private static _exts: InstallerConfigExt[] = ['yml', 'yaml', 'ts', 'js']
  private static _cache?: Promise<Map<string, InstallerOptions>>

  readonly filename: (version: string) => string
  readonly version?: (filename: string) => string | undefined
  readonly downloadURL?: (version: string) => string
  readonly downloadDir: string
  readonly cache: boolean

  /** Path to a downloaded tool version. */
  readonly downloadedFile: (version: string) => string

  #installFn?: Promise<(filepath: string) => void>

  constructor({
    filename = '%s',
    version,
    downloadURL,
    versionFmt,
    downloadDir = '',
    cache = true,
    installFn,
  }: InstallerOptions) {
    if (typeof filename === 'string') {
      this.filename = (version) => fmt.sprintf(filename, version)

      if (!version) {
        const escaped = escapeRegex(filename)
        const [prefix, suffix] = escaped.split('%s')
        const regex = new RegExp(`(?<=${prefix})(.*)(?=${suffix})`)
        this.version = (filename) => {
          const matches = regex.exec(filename)
          if (matches) {
            return matches[1]
          }
        }
      } else {
        this.version = version
      }
    } else {
      this.filename = filename
      this.version = version
    }

    this.downloadURL =
      typeof downloadURL === 'string'
        ? (version) => fmt.sprintf(downloadURL, version)
        : downloadURL

    if (versionFmt) {
      const tokens = versionFmt.split('#')
      const regex = Installer._versionRegex(versionFmt)

      const formatVersion = (version: string) => {
        const matches = regex.exec(version)
        if (!matches) {
          return version
        }

        let formatted = `${tokens[0]}${matches[1]}`

        let i = 1
        for (; i < tokens.length - 1; i++) {
          const token = tokens[i]
          formatted += `${token}${matches[i + 1] || 0}`
        }
        formatted += `${tokens[i]}`

        return formatted
      }

      const filename = this.filename
      this.filename = (version) => {
        version = formatVersion(version)
        return filename(version)
      }

      if (this.downloadURL) {
        const downloadURL = this.downloadURL
        this.downloadURL = (version) => {
          version = formatVersion(version)
          return downloadURL(version)
        }
      }
    }

    this.downloadDir = path.resolve(downloadDir)

    this.downloadedFile = (version) =>
      path.resolve(path.join(this.downloadDir, this.filename(version)))

    this.cache = cache

    this.#installFn =
      typeof installFn === 'string'
        ? getJsFn(installFn)
        : Promise.resolve(installFn)
  }

  /**
   * @param tool Name of the tool configuration to use.
   * @param overrides Configuration overrides.
   * @param cache Whether to use a cached tool configuration.
   *
   * @returns Installer using the given tool configuration and overrides.
   */
  static async get(tool?: string, overrides?: InstallerConfig, cache = true) {
    if (!(tool && overrides)) {
      throw new Error('tool and/or overrides not defined')
    }

    let options: InstallerOptions | undefined
    if (tool) {
      if (cache && this._cache) {
        options = (await this._cache).get(tool)
      } else {
        options = (await this.options(cache))?.get(tool)
      }
    }

    if (overrides) {
      const overrideOptions = await this._optionsFromConfig(overrides)
      options = Object.assign({}, options ?? {}, overrideOptions)
    }

    if (!options) {
      throw new Error(`could not get installer options for ${tool}`)
    }

    return new Installer(options)
  }

  /**
   * @param cache Whether to use a cached tool configuration.
   *
   * @returns Map of installer options for each tool configuration.
   */
  static options(cache = true) {
    if (cache && this._cache) {
      return this._cache
    }

    const config = this._findConfig()
    if (!config) {
      return
    }

    const { dir, ext, file } = config
    if (ext === 'ts' || ext === 'js') {
      this._cache = this._parseJsFile(file)
    } else {
      this._cache = this._parseYamlFile(dir, file)
    }

    return this._cache
  }

  private static _findConfig() {
    const dirs = [Deno.cwd()]
    homeDir && dirs.push(homeDir)

    for (const dir of dirs) {
      for (const ext of this._exts) {
        const file = path.join(dir, `${this._basename}.${ext}`)
        if (!existsSync(file)) {
          continue
        }
        return { dir, ext, file }
      }
    }
  }

  private static async _parseJsFile(file: string) {
    const mod = await import(`file://${file}`)
    const toolOptions = (mod.default ? mod.default : mod) as Record<
      string,
      InstallerOptions
    >
    return new Map(Object.entries(toolOptions))
  }

  private static async _parseYamlFile(dir: string, file: string) {
    const yaml = Deno.readTextFileSync(file)
    const parsedConfig = (await parse(yaml)) as Record<string, InstallerConfig>

    const options = new Map<string, InstallerOptions>()
    for (const [tool, config] of Object.entries(parsedConfig)) {
      options.set(tool, await this._optionsFromConfig(config, dir))
    }

    return options
  }

  private static async _optionsFromConfig(
    config: InstallerConfig,
    dir?: string
  ) {
    const options: InstallerOptions = { ...config }
    if (typeof options.installFn === 'string') {
      options.installFn = await getJsFn(options.installFn, dir)
    }
    return options
  }

  private static _versionRegex(versionFmt: string) {
    const escaped = escapeRegex(versionFmt)
    const tokens = escaped.split('#')

    let regexString = `^(?:${tokens[0]})?(\\d+)`

    let i = 1
    for (; i < tokens.length - 1; i++) {
      const token = tokens[i]
      if (token) {
        regexString += `(?:${token}(\\d+))?`
      } else {
        regexString += '(\\d+)?'
      }
    }

    if (tokens[i]) {
      regexString += `(?:${tokens[i]})?`
    }

    regexString += '$'

    return new RegExp(regexString)
  }

  /**
   * Downloads the specified tool version.
   *
   * @param version The tool version to download.
   *
   * @returns The path to the downloaded tool file.
   */
  async download(version: string) {
    const file = this.downloadedFile(version)
    if (this.cache) {
      fmt.printf(`${version} previously downloaded? ...`)
      if (existsSync(file)) {
        fmt.printf(' yes\n')
        return file
      }
      fmt.printf(' no\n')
    }

    if (!this.downloadURL) {
      throw new Error('downloadURL not defined')
    }

    const url = this.downloadURL(version)
    fmt.printf(`downloading ${url} ...`)
    const response = await fetch(url)
    if (response.status !== 200) {
      throw new Error(
        `${url} ${response.statusText.toLowerCase()} (${response.status})`
      )
    }
    fmt.printf(' done\n')
    fmt.printf(`writing to ${file} ...`)
    const buffer = await response.arrayBuffer()
    const data = new Uint8Array(buffer)
    Deno.writeFileSync(file, data)
    fmt.printf(' done\n')
    return file
  }

  /**
   * Installs the specified tool version.
   * Defaults to the latest downloaded version if unspecified.
   *
   * @param version The tool version to install.
   * @param download Whether to download the tool version if not downloaded.
   */
  async install(version?: string, download = true) {
    if (!this.#installFn) {
      throw new Error('installFn undefined')
    }

    if (!version) {
      version = this.latest()
      if (!version) {
        throw new Error('no versions downloaded')
      }
    }

    const previousFile = this.downloadedFile(version)
    if (existsSync(previousFile)) {
      return (await this.#installFn)(previousFile)
    } else if (!download) {
      throw new Error(`${version} could not be found`)
    }

    const downloadedFile = await this.download(version)
    if (downloadedFile) {
      return (await this.#installFn)(downloadedFile)
    }

    throw new Error(`could not download and install ${version}`)
  }

  /**
   * @returns Array of downloaded tool versions.
   */
  downloaded() {
    if (!this.version) {
      return []
    }

    const versions: string[] = []
    for (const { name, isFile } of Deno.readDirSync(this.downloadDir)) {
      if (!isFile) {
        continue
      }

      const version = this.version(name)
      if (!version) {
        continue
      }

      versions.push(version)
    }
    return versions
  }

  /**
   * @returns The latest downloaded tool version.
   */
  latest() {
    const versions = this.downloaded()
    return versions.length ? versions[versions.length - 1] : undefined
  }
}
