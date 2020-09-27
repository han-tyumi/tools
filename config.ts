import { parse, path, exists } from './deps.ts'
import { mainDir } from './mod.ts'

interface Config {
  [tool: string]:
    | {
        downloadURLFmt?: string
        filenameFmt?: string
      }
    | undefined
}

const filename = '.install'
const exts = ['yml', 'yaml']

export async function getConfig() {
  for (const ext of exts) {
    const configPath = path.join(mainDir, `${filename}.${ext}`)
    if (await exists(configPath)) {
      const yaml = await Deno.readTextFile(configPath)
      return (await parse(yaml)) as Config
    }
  }
}
