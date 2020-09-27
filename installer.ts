import { exists, fmt, path } from './deps.ts'
import { mainDir } from './mod.ts'

export interface InstallerOptions {
  downloadURL: (version: string) => string
  downloadDirectory?: string
  filename: (version: string) => string
  cache?: boolean
}

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
    this.downloadDirectory = path.isAbsolute(downloadDirectory)
      ? downloadDirectory
      : path.join(mainDir, downloadDirectory)
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
