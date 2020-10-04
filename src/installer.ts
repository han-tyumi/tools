import { existsSync, fmt, parse, path } from '../deps.ts'
import { escapeRegex, getJsFn, homeDir, mainDir } from './utils.ts'

export interface InstallerOptions {
  /** The filename to be used for downloaded tool versions. */
  filename?: (version: string) => string

  /** Returns the version for a given filename. */
  version?: (filename: string) => string | undefined

  /** The URL to download a tool from when given a version. */
  downloadURL?: (version: string) => string

  /**
   * The directory to store downloaded tool versions.
   * This can be absolute or relative to the current working directory.
   */
  downloadDir?: string

  /** Whether or not to reuse already downloaded tools (defaults to true). */
  cache?: boolean

  /** Function called with the path to the downloaded tool file to install. */
  installFn?: (filepath: string) => void
}

export interface InstallerConfig {
  /**
   * The filename to be used for downloading tool versions.
   * The first `%s` token will be replaced with the the downloaded tool's version.
   */
  filenameFmt?: string

  /**
   * The URL to download a tool from when given a version.
   * The first `%s` token will be replaced with the tool's version.
   */
  downloadURLFmt?: string

  /**
   * The directory to store downloaded tool versions.
   * This can be absolute or relative to the current working directory.
   */
  downloadDir?: string

  /** Whether or not to reuse already downloaded tools. */
  cache?: boolean

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
  readonly version: (filename: string) => string | undefined
  readonly downloadURL?: (version: string) => string
  readonly downloadDir: string
  readonly cache: boolean

  /** Path to a downloaded tool version. */
  readonly downloadedFile: (version: string) => string

  #installFn?: (filepath: string) => void

  constructor({
    filename = (version) => version,
    version = (filename) => filename,
    downloadURL,
    downloadDir = '',
    cache = true,
    installFn,
  }: InstallerOptions) {
    this.filename = filename
    this.version = version
    this.downloadURL = downloadURL
    this.downloadDir = path.resolve(downloadDir)
    this.downloadedFile = (version) =>
      path.resolve(path.join(this.downloadDir, this.filename(version)))
    this.cache = cache
    this.#installFn = installFn
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
        options = (await this.options(cache)).get(tool)
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
      throw new Error(`could not find ${this._basename} configuration file`)
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
    dirs.push(mainDir)

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
    const mod = await import(file)
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
    {
      filenameFmt,
      downloadURLFmt,
      downloadDir,
      cache,
      installFn,
    }: InstallerConfig,
    dir?: string
  ) {
    const options: InstallerOptions = {}
    if (filenameFmt !== undefined) {
      options.filename = (version) => fmt.sprintf(filenameFmt, version)
      options.version = (filename) => {
        const escaped = escapeRegex(filenameFmt)
        const [prefix, suffix] = escaped.split('%s')
        const matches = new RegExp(`(?<=${prefix})(.*)(?=${suffix})`).exec(
          filename
        )
        if (matches) {
          return matches[1]
        }
      }
    }
    if (downloadURLFmt !== undefined) {
      options.downloadURL = (version: string) =>
        fmt.sprintf(downloadURLFmt, version)
    }
    if (downloadDir !== undefined) {
      options.downloadDir = downloadDir
    }
    if (cache !== undefined) {
      options.cache = cache
    }
    if (installFn !== undefined) {
      options.installFn = await getJsFn(installFn, dir)
    }
    return options
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
    fmt.printf('previously downloaded? ...')
    if (this.cache && existsSync(file)) {
      fmt.printf(' yes\n')
      return file
    }
    fmt.printf(' no\n')

    if (!this.downloadURL) {
      throw new Error('downloadURL not defined')
    }

    const url = this.downloadURL(version)
    fmt.printf(`downloading ${url} ...`)
    const response = await fetch(url)
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
   *
   * @param version The tool version to install.
   * @param download Whether to download the tool version if not downloaded.
   */
  async install(version: string, download = true) {
    if (!this.#installFn) {
      throw new Error('installFn undefined')
    }

    const previousFile = this.downloadedFile(version)
    if (existsSync(previousFile)) {
      return this.#installFn(previousFile)
    } else if (!download) {
      throw new Error(`${version} could not be found`)
    }

    const downloadedFile = await this.download(version)
    if (downloadedFile) {
      return this.#installFn(downloadedFile)
    }

    throw new Error(`could not download and install ${version}`)
  }

  /**
   * @returns Array of downloaded tool versions.
   */
  downloaded() {
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
}
