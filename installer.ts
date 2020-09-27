import { exists, fmt, path } from './deps.ts'

export interface InstallerOptions {
  /** The URL to download a tool from when given a version. */
  downloadURL: (version: string) => string

  /**
   * The directory to store downloaded tool versions.
   * This can absolute or relative to the current working directory.
   */
  downloadDirectory?: string

  /** The filename to be used for downloaded tool versions. */
  filename: (version: string) => string

  /** Whether or not to reuse already downloaded tools (defaults to true). */
  cache?: boolean
}

/**
 * Installer helps with the download and installation of tools.
 */
export class Installer implements InstallerOptions {
  readonly downloadURL: (version: string) => string
  readonly downloadDirectory: string
  readonly filename: (version: string) => string
  readonly downloadedFile: (version: string) => string
  readonly cache: boolean

  constructor({
    downloadURL,
    downloadDirectory = '',
    filename,
    cache = true,
  }: InstallerOptions) {
    this.downloadURL = downloadURL
    this.downloadDirectory = downloadDirectory
    this.filename = filename
    this.downloadedFile = (version) =>
      path.join(this.downloadDirectory, this.filename(version))
    this.cache = cache
  }

  async download(version: string) {
    const file = this.downloadedFile(version)
    fmt.printf('Previously downloaded?...')
    if (this.cache && (await exists(file))) {
      fmt.printf(' yes\n')
      return file
    }
    fmt.printf(' no\n')

    const url = this.downloadURL(version)
    fmt.printf(`Downloading ${url}...`)
    try {
      const response = await fetch(url)
      fmt.printf(' done\n')
      fmt.printf(`Writing to ${file}...`)
      const buf = await response.arrayBuffer()
      const data = new Uint8Array(buf)
      await Deno.writeFile(file, data)
      fmt.printf(' done\n')
      return file
    } catch (error) {
      console.log(error)
    }
  }
}
