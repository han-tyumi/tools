import { Command } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { GlobalCommandOptions } from './tools.ts'

interface InstallCommandOptions extends GlobalCommandOptions {}

export const installCommand = new Command()
  .arguments('<version:string>')
  .description('installs the specified tool version')
  .action(
    async ({ tool, ...config }: InstallCommandOptions, version: string) => {
      const installer = await Installer.get(tool, config)
      installer.install(version)
    }
  )
