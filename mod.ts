import { getColorEnabled } from 'https://deno.land/std@0.69.0/fmt/colors.ts'
import { Command, HelpCommand, CompletionsCommand, path, fmt } from './deps.ts'
import { Installer } from './installer.ts'
import { getConfig } from './config.ts'

export const mainDir = path.dirname(path.fromFileUrl(Deno.mainModule))

const config = (await getConfig()) || {}

await new Command()
  .name('install')
  .version('0.1.0')
  .description('CLI for downloading and installing your tools')

  .complete('tool', () => Object.keys(config))
  .command(
    'download <tool:string:tool> <version:string>',
    'downloads the specified tool version'
  )
  .option(
    '--cache [cache:boolean]',
    'Whether to use already downloaded files',
    { default: true }
  )
  .action(
    async ({ cache }: { cache: boolean }, tool: string, version: string) => {
      const toolConfig = config[tool]
      if (!toolConfig) {
        throw new Error(`Configuration for ${tool} not found!`)
      }

      const { downloadURLFmt, filenameFmt } = toolConfig
      if (!(downloadURLFmt && filenameFmt)) {
        throw new Error(
          `downloadURLFmt and/or filenameFmt not defined for ${tool}!`
        )
      }

      const installer = new Installer({
        downloadURL: (version) => fmt.sprintf(downloadURLFmt, version),
        filename: (version) => fmt.sprintf(filenameFmt, version),
        cache,
      })

      installer.download(version)
    }
  )

  .command('help', new HelpCommand().global())
  .command('completions', new CompletionsCommand())

  .parse(Deno.args)
