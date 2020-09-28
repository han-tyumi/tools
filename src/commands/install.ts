import { Command, fmt } from '../../deps.ts'
import { getConfig } from '../config.ts'
import { InstallerOptions, Installer } from '../installer.ts'

interface InstallCommandOptions {
  offline: boolean
}

export const installCommand = new Command()
  .arguments('<tool:string:tool> <version:string>')
  .description('installs the specified tool version')
  .option(
    '--offline [offline:boolean]',
    'whether to download a version if not found',
    { default: false }
  )
  .action(
    async (
      { offline }: InstallCommandOptions,
      tool: string,
      version: string
    ) => {
      const toolConfig = (await getConfig())[tool]
      if (!toolConfig) {
        throw new Error(`configuration for ${tool} not found`)
      }

      const { filenameFmt, installFn } = toolConfig
      if (!(filenameFmt && installFn)) {
        throw new Error(`filenameFmt and/or installFn not defined for ${tool}`)
      }

      const install = (await import(installFn)).default
      if (typeof install !== 'function') {
        throw new Error('installFn is not a function')
      }

      const installerOptions: InstallerOptions = {
        filename: (version) => fmt.sprintf(filenameFmt, version),
        cache: !offline,
        installFn: install,
      }

      const downloadURLFmt = toolConfig.downloadURLFmt
      if (!offline && downloadURLFmt) {
        installerOptions.downloadURL = (version) =>
          fmt.sprintf(downloadURLFmt, version)
      }

      const installer = new Installer(installerOptions)

      installer.install(version)
    }
  )
