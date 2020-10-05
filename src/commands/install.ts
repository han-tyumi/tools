import { Command } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { GlobalCommandOptions } from './tools.ts'

interface InstallCommandOptions extends GlobalCommandOptions {
  offline?: boolean
}

export const installCommand = new Command()
  .arguments('[version:string]')
  .description('installs the specified tool version')
  .option(
    '--offline [offline:boolean]',
    "whether to skip downloading a tool version if it isn't found"
  )
  .action(
    async (
      { tool, offline, ...config }: InstallCommandOptions,
      version?: string
    ) => {
      const installer = await Installer.get(tool, config)
      installer.install(version, !offline)
    }
  )
