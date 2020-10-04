import { Command } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { GlobalCommandOptions } from './tools.ts'

interface ListCommandOptions extends GlobalCommandOptions {}

export const listCommand = new Command()
  .description('lists the downloaded tool versions')
  .action(async ({ tool, ...config }: ListCommandOptions) => {
    const installer = await Installer.get(tool, config)
    const versions = installer.downloaded()
    console.log(versions.join('\n'))
  })
