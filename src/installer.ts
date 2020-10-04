import { existsSync, fmt, parse, path } from '../deps.ts'
import { getJsFn, homeDir, mainDir } from './utils.ts'

export interface InstallerOptions {
  /** The filename to be used for downloaded tool versions. */
  filename: (version: string) => string

  /** The URL to download a tool from when given a version. */
  downloadURL?: (version: string) => string

  /**
   * The directory to store downloaded tool versions.
   * This can absolute or relative to the current working directory.
   */
  downloadDir?: string

  /** Whether or not to reuse already downloaded tools (defaults to true). */
  cache?: boolean

  /** Function called with the path to the downloaded tool file to install. */
  installFn?: (filepath: string) => void
}

export interface InstallerConfig {
  filenameFmt: string
  downloadURLFmt?: string
  downloadDir?: string
  cache?: boolean
  installFn?: string
}

type InstallerConfigExt = 'yml' | 'yaml' | 'ts' | 'js'

/**
 * Installer helps with the download and installation of tools.
 */
export class Installer implements InstallerOptions {
  readonly downloadURL?: (version: string) => string
  readonly downloadDir: string
  readonly filename: (version: string) => string
  readonly downloadedFile: (version: string) => string
  readonly cache: boolean

  #installFn?: (filepath: string) => void

  private static _basename = 'toolsrc'
  private static _exts: InstallerConfigExt[] = ['yml', 'yaml', 'ts', 'js']
  private static _cache?: Promise<Map<string, InstallerOptions>>

  constructor({
    downloadURL,
    downloadDir = '',
    filename,
    cache = true,
    installFn,
  }: InstallerOptions) {
    this.downloadURL = downloadURL
    this.downloadDir = downloadDir
    this.filename = filename
    this.downloadedFile = (version) =>
      path.resolve(path.join(this.downloadDir, this.filename(version)))
    this.cache = cache
    this.#installFn = installFn
  }

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
    return {
      filename: (version) => fmt.sprintf(filenameFmt, version),
      downloadURL: downloadURLFmt
        ? (version) => fmt.sprintf(downloadURLFmt, version)
        : undefined,
      downloadDir,
      cache,
      installFn: installFn ? await getJsFn(installFn, dir) : undefined,
    } as InstallerOptions
  }

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
}
