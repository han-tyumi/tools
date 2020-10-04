import { Command } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { GlobalCommandOptions } from './tools.ts'

interface DownloadCommandOptions extends GlobalCommandOptions {}

export const downloadCommand = new Command()
  .arguments('<version:string>')
  .description('downloads the specified tool version')
  .action(
    async ({ tool, ...config }: DownloadCommandOptions, version: string) => {
      const installer = await Installer.get(tool, config)
      installer.download(version)
    }
  )
