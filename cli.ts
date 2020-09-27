import { Command, HelpCommand, CompletionsCommand, fmt } from './deps.ts'
import { Installer, InstallerOptions } from './src/installer.ts'
import { getConfig } from './src/config.ts'

if (import.meta.main) {
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
      'whether to use already downloaded files',
      { default: true }
    )
    .action(
      async ({ cache }: { cache: boolean }, tool: string, version: string) => {
        const toolConfig = config[tool]
        if (!toolConfig) {
          throw new Error(`configuration for ${tool} not found`)
        }

        const { downloadURLFmt, filenameFmt } = toolConfig
        if (!(downloadURLFmt && filenameFmt)) {
          throw new Error(
            `downloadURLFmt and/or filenameFmt not defined for ${tool}`
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

    .command(
      'install <tool:string:tool> <version:string>',
      'installs the specified tool version'
    )
    .option(
      '--offline [offline:boolean]',
      'whether to download a version if not found',
      { default: false }
    )
    .action(
      async (
        { offline }: { offline: boolean },
        tool: string,
        version: string
      ) => {
        const toolConfig = config[tool]
        if (!toolConfig) {
          throw new Error(`configuration for ${tool} not found`)
        }

        const { filenameFmt, installFn } = toolConfig
        if (!(filenameFmt && installFn)) {
          throw new Error(
            `filenameFmt and/or installFn not defined for ${tool}`
          )
        }

        const install = (await import(installFn)).default
        if (typeof install !== 'function') {
          throw new Error('installFn is not a function')
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

    .command('help', new HelpCommand().global())
    .command('completions', new CompletionsCommand())

    .parse(Deno.args)
}
