import { Command, fmt } from '../../deps.ts'
import { getConfig } from '../config.ts'
import { Installer, InstallerOptions } from '../installer.ts'

interface DownloadCommandOptions {
  cache: boolean
}

const config = (await getConfig()) || {}

export const downloadCommand = new Command()
  .arguments('<tool:string:tool> <version:string>')
  .description('downloads the specified tool version')
  .option(
    '--cache [cache:boolean]',
    'whether to use already downloaded files',
    { default: true }
  )
  .action(
    async (
      { cache }: DownloadCommandOptions,
      tool: string,
      version: string
    ) => {
      const toolConfig = config[tool]
      if (!toolConfig) {
        throw new Error(`configuration for ${tool} not found`)
      }

      let installerOptions: InstallerOptions
      if (toolConfig.options) {
        installerOptions = toolConfig.options
      } else {
        const { downloadURLFmt, filenameFmt } = toolConfig
        if (!(downloadURLFmt && filenameFmt)) {
          throw new Error(
            `downloadURLFmt and/or filenameFmt not defined for ${tool}`
          )
        }

        installerOptions = {
          downloadURL: (version) => fmt.sprintf(downloadURLFmt, version),
          filename: (version) => fmt.sprintf(filenameFmt, version),
          cache,
        }
      }

      const installer = new Installer(installerOptions)

      installer.download(version)
    }
  )
