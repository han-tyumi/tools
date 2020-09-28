import { Command, fmt } from '../../deps.ts'
import { getConfig } from '../config.ts'
import { Installer, InstallerOptions } from '../installer.ts'

interface DownloadCommandOptions {
  tool?: string
  downloadURLFmt?: string
  filenameFmt?: string
  cache: boolean
}

const config = (await getConfig()) || {}

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
      let installerOptions: InstallerOptions | undefined

      const toolConfig = tool && config[tool]
      if (toolConfig) {
        if (toolConfig.options) {
          installerOptions = toolConfig.options
        } else {
          const { downloadURLFmt, filenameFmt } = toolConfig
          if (downloadURLFmt && filenameFmt) {
            installerOptions = {
              downloadURL: (version) => fmt.sprintf(downloadURLFmt, version),
              filename: (version) => fmt.sprintf(filenameFmt, version),
              cache,
            }
          }
        }
      }

      if (!installerOptions) {
        if (!(downloadURLFmt && filenameFmt)) {
          throw new Error('downloadURLFmt and/or filenameFmt not defined')
        } else {
          installerOptions = {
            downloadURL: (version) => fmt.sprintf(downloadURLFmt, version),
            filename: (version) => fmt.sprintf(filenameFmt, version),
          }
        }
      } else {
        if (downloadURLFmt) {
          installerOptions.downloadURL = (version) =>
            fmt.sprintf(downloadURLFmt, version)
        }

        if (filenameFmt) {
          installerOptions.filename = (version) =>
            fmt.sprintf(filenameFmt, version)
        }
      }

      const installer = new Installer(installerOptions)

      installer.download(version)
    }
  )
