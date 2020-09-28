import { Command, HelpCommand, CompletionsCommand } from '../../deps.ts'
import { getConfig } from '../config.ts'
import { installCommand } from './install.ts'
import { downloadCommand } from './download.ts'

const config = (await getConfig()) || {}

export const toolsCommand = new Command()
  .name('tools')
  .version('0.2.0')
  .description('CLI for downloading and installing your tools')

  .complete('tool', () => Object.keys(config))

  .command('install', installCommand)
  .command('download', downloadCommand)

  .command('help', new HelpCommand().global())
  .command('completions', new CompletionsCommand())
