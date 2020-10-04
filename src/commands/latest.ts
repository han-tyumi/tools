import { Command } from '../../deps.ts'
import { Installer } from '../installer.ts'
import { GlobalCommandOptions } from './tools.ts'

interface LatestCommandOptions extends GlobalCommandOptions {}

export const latestCommand = new Command()
  .description('lists the latest tool version downloaded')
  .action(async ({ tool, ...config }: LatestCommandOptions) => {
    const installer = await Installer.get(tool, config)
    const latest = installer.latest()
    console.log(latest ? latest : 'no versions downloaded')
  })
