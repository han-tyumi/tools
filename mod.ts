import { toolsCommand } from './src/commands/tools.ts'

export { Installer } from './src/installer.ts'
export { untar } from './src/utils.ts'

if (import.meta.main) {
  await toolsCommand.parse(Deno.args)
}
