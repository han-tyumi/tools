import { parse, path, existsSync } from '../deps.ts'
import { mainDir } from './utils.ts'

interface Config {
  [tool: string]:
    | {
        downloadURLFmt?: string
        filenameFmt?: string
        installFn?: string
      }
    | undefined
}

let config: Config | undefined

// construct array of directories to search
const home = Deno.env.get(Deno.build.os === 'windows' ? 'USERPROFILE' : 'HOME')
const dirs = [Deno.cwd()]
home && dirs.push(home)
dirs.push(mainDir)

const basename = 'tools'
const exts = ['yml', 'yaml']
const filenames = exts.map((ext) => `${basename}.${ext}`)

/**
 * @param cache Whether to use the last configuration retrieved.
 * @returns The tools configuration file object if found.
 */
export async function getConfig(cache = true) {
  if (cache && config) {
    return config
  }

  for (const dir of dirs) {
    for (const filename of filenames) {
      const configPath = path.join(dir, filename)
      if (existsSync(configPath)) {
        const yaml = Deno.readTextFileSync(configPath)
        config = (await parse(yaml)) as Config
        return config
      }
    }
  }

  return {}
}
