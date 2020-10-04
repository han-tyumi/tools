import { Command } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { GlobalCommandOptions } from './tools.ts'

interface DownloadCommandOptions extends GlobalCommandOptions {}

export const downloadCommand = new Command()
  .arguments('<versions...:string>')
  .description('downloads the specified tool version')
  .action(
    async ({ tool, ...config }: DownloadCommandOptions, versions: string[]) => {
      const installer = await Installer.get(tool, config)
      for (const version of versions) {
        console.log()

        try {
          await installer.download(version)
        } catch (error) {
          console.error(`\n${error}`)
        }
      }
    }
  )
