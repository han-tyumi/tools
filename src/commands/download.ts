import { Command, fmt } from '../../deps.ts'
import { Installer } from '../installer.ts'

interface DownloadCommandOptions {
  tool?: string
  downloadURLFmt?: string
  filenameFmt?: string
  cache: boolean
}

const installerOptions = await Installer.options()

export const downloadCommand = new Command()
  .arguments('<version:string>')
  .description('downloads the specified tool version')
  .option('--tool <tool:string:tool>', 'name of the tool configuration to use')
  .option(
    '--downloadURLFmt <downloadURLFmt:string>',
    'download URL format to use'
  )
  .option('--filenameFmt <filenameFmt:string>', 'filename format to use')
  .option(
    '--cache [cache:boolean]',
    'whether to use already downloaded files',
    { default: true }
  )
  .action(
    async (
      { tool, downloadURLFmt, filenameFmt, cache }: DownloadCommandOptions,
      version: string
    ) => {
      let options = tool ? installerOptions.get(tool) : undefined

      if (!options) {
        if (!(downloadURLFmt && filenameFmt)) {
          throw new Error('downloadURLFmt and/or filenameFmt not defined')
        } else {
          options = {
            downloadURL: (version) => fmt.sprintf(downloadURLFmt, version),
            filename: (version) => fmt.sprintf(filenameFmt, version),
            cache,
          }
        }
      } else {
        if (downloadURLFmt) {
          options.downloadURL = (version) =>
            fmt.sprintf(downloadURLFmt, version)
        }

        if (filenameFmt) {
          options.filename = (version) => fmt.sprintf(filenameFmt, version)
        }

        if (cache !== undefined) {
          options.cache = cache
        }
      }

      const installer = new Installer(options)

      installer.download(version)
    }
  )
