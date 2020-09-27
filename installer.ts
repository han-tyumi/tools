import { existsSync, fmt, path } from './deps.ts'

export interface InstallerOptions {
  /** The filename to be used for downloaded tool versions. */
  filename: (version: string) => string

  /** The URL to download a tool from when given a version. */
  downloadURL?: (version: string) => string

  /**
   * The directory to store downloaded tool versions.
   * This can absolute or relative to the current working directory.
   */
  downloadDirectory?: string

  /** Whether or not to reuse already downloaded tools (defaults to true). */
  cache?: boolean

  /** Function called with the path to the downloaded tool file to install. */
  installFn?: (filepath: string) => void
}

/**
 * Installer helps with the download and installation of tools.
 */
export class Installer implements InstallerOptions {
  readonly downloadURL?: (version: string) => string
  readonly downloadDirectory: string
  readonly filename: (version: string) => string
  readonly downloadedFile: (version: string) => string
  readonly cache: boolean
  #installFn?: (filepath: string) => void

  constructor({
    downloadURL,
    downloadDirectory = '',
    filename,
    cache = true,
    installFn,
  }: InstallerOptions) {
    this.downloadURL = downloadURL
    this.downloadDirectory = downloadDirectory
    this.filename = filename
    this.downloadedFile = (version) =>
      path.resolve(path.join(this.downloadDirectory, this.filename(version)))
    this.cache = cache
    this.#installFn = installFn
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
