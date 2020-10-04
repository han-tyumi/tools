import { Command, HelpCommand, CompletionsCommand } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { installCommand } from './install.ts'
import { downloadCommand } from './download.ts'

const installerOptions = await Installer.options()

export const toolsCommand = new Command()
  .name('tools')
  .version('0.2.0')
  .description('CLI for downloading and installing your tools')

  .complete('tool', () => Array.from(installerOptions.keys()))

  .command('install', installCommand)
  .command('download', downloadCommand)

  .command('help', new HelpCommand().global())
  .command('completions', new CompletionsCommand())
