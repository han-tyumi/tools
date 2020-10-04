import { Command, fmt } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { getJsFn } from '../utils.ts'

interface InstallCommandOptions {
  tool?: string
  filenameFmt?: string
  downloadURLFmt?: string
  installFn?: string
  offline: boolean
}

const installerOptions = await Installer.options()

export const installCommand = new Command()
  .arguments('<version:string>')
  .description('installs the specified tool version')
  .option('--tool <tool:string:tool>', 'name of the tool configuration to use')
  .option('--filenameFmt <filenameFmt:string>', 'filename format to use')
  .option(
    '--downloadURLFmt <downloadURLFmt:string>',
    'download URL format to use'
  )
  .option(
    '--installFn <installFn:string>',
    'path to the install function to be used'
  )
  .option(
    '--offline [offline:boolean]',
    'whether to download a version if not found',
    { default: false }
  )
  .action(
    async (
      {
        tool,
        filenameFmt,
        downloadURLFmt,
        installFn,
        offline,
      }: InstallCommandOptions,
      version: string
    ) => {
      let options = tool ? installerOptions.get(tool) : undefined

      if (!options) {
        if (!(filenameFmt && installFn)) {
          throw new Error('filenameFmt and/or installFn not defined')
        } else {
          options = {
            filename: (version) => fmt.sprintf(filenameFmt, version),
            installFn: await getJsFn(installFn),
          }
        }
      } else {
        if (filenameFmt) {
          options.filename = (version) => fmt.sprintf(filenameFmt, version)
        }

        if (installFn) {
          options.installFn = await getJsFn(installFn)
        }
      }

      if (!offline && downloadURLFmt) {
        options.downloadURL = (version) => fmt.sprintf(downloadURLFmt, version)
      }

      const installer = new Installer(options)

      installer.install(version)
    }
  )
