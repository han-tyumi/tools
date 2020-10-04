import { Command, HelpCommand, CompletionsCommand } from '../../deps.ts'
import { Installer, InstallerConfig } from '../installer.ts'
import { installCommand } from './install.ts'
import { downloadCommand } from './download.ts'
import { listCommand } from './list.ts'

export interface GlobalCommandOptions extends InstallerConfig {
  tool?: string
}

const installerOptions = await Installer.options()

export const toolsCommand = new Command()
  .name('tools')
  .version('0.2.0')
  .description('CLI for downloading and installing your tools')

  .complete('tool', () => Array.from(installerOptions.keys()))

  .option(
    '--tool <tool:string:tool>',
    'name of the tool configuration to use',
    { global: true }
  )
  .option('--filenameFmt <filenameFmt:string>', 'filename format to use', {
    global: true,
  })
  .option('--versionRegex <versionRegex:string>', 'version regex to use', {
    global: true,
  })
  .option(
    '--downloadURLFmt <downloadURLFmt:string>',
    'download URL format to use',
    { global: true }
  )
  .option(
    '--downloadDir <downloadDir:string>',
    'where to store downloaded tool versions',
    { global: true }
  )
  .option(
    '--cache [cache:boolean]',
    'whether to use already downloaded files',
    { global: true }
  )
  .option(
    '--installFn <installFn:string>',
    'path to the install function to be used',
    { global: true }
  )

  .command('install', installCommand)
  .command('download', downloadCommand)
  .command('list', listCommand)

  .command('help', new HelpCommand().global())
  .command('completions', new CompletionsCommand())
