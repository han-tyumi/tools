import { Command, fmt } from '../../deps.ts'
import { getConfig } from '../config.ts'
import { InstallerOptions, Installer } from '../installer.ts'

interface InstallCommandOptions {
  offline: boolean
}

const config = (await getConfig()) || {}

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
      const toolConfig = config[tool]
      if (!toolConfig) {
        throw new Error(`configuration for ${tool} not found`)
      }

      const { filenameFmt, installFn } = toolConfig
      if (!(filenameFmt && installFn)) {
        throw new Error(`filenameFmt and/or installFn not defined for ${tool}`)
      }

      const [file, name = 'default'] = installFn.split('#')
      const install = (await import(file))[name]
      const installType = typeof install
      if (installType !== 'function') {
        throw new Error(`${file} ${name} export is ${installType}`)
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
