import { Command, fmt } from '../../deps.ts'
import { getJsFn } from '../utils.ts'
import { getConfig } from '../config.ts'
import { InstallerOptions, Installer } from '../installer.ts'

interface InstallCommandOptions {
  tool?: string
  filenameFmt?: string
  downloadURLFmt?: string
  installFn?: string
  offline: boolean
}

const config = (await getConfig()) || {}

export const installCommand = new Command()
  .arguments('<version:string>')
  .description('installs the specified tool version')
  .option('--tool <tool:string:tool>', 'name of the tool configuration to use')
  .option('--filenameFmt <filenameFmt:string>', 'filename format to use')
  .option(
    '--downloadURLFmt <downloadURLFmt:string>',
    'download URL format to use'
  )
  .option(
    '--installFn <installFn:string>',
    'path to the install function to be used'
  )
  .option(
    '--offline [offline:boolean]',
    'whether to download a version if not found',
    { default: false }
  )
  .action(
    async (
      {
        tool,
        filenameFmt,
        downloadURLFmt,
        installFn,
        offline,
      }: InstallCommandOptions,
      version: string
    ) => {
      let installerOptions: InstallerOptions | undefined

      const toolConfig = tool && config[tool]
      if (toolConfig) {
        if (toolConfig.options) {
          installerOptions = toolConfig.options
        } else {
          const { filenameFmt, installFn } = toolConfig
          if (filenameFmt && installFn) {
            const install = await getJsFn(installFn)

            installerOptions = {
              filename: (version) => fmt.sprintf(filenameFmt, version),
              cache: !offline,
              installFn: install,
            }

            const downloadURLFmt = toolConfig.downloadURLFmt
            if (!offline && downloadURLFmt) {
              installerOptions.downloadURL = (version) =>
                fmt.sprintf(downloadURLFmt, version)
            }
          }
        }
      }

      if (!installerOptions) {
        if (!(filenameFmt && installFn)) {
          throw new Error('filenameFmt and/or installFn not defined')
        } else {
          installerOptions = {
            filename: (version) => fmt.sprintf(filenameFmt, version),
            installFn: await getJsFn(installFn),
          }
        }
      } else {
        if (filenameFmt) {
          installerOptions.filename = (version) =>
            fmt.sprintf(filenameFmt, version)
        }

        if (installFn) {
          installerOptions.installFn = await getJsFn(installFn)
        }
      }

      if (!offline && downloadURLFmt) {
        installerOptions.downloadURL = (version) =>
          fmt.sprintf(downloadURLFmt, version)
      }

      const installer = new Installer(installerOptions)

      installer.install(version)
    }
  )
