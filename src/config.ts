import { parse, path, existsSync } from '../deps.ts'
import { homeDir, mainDir } from './utils.ts'

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
const dirs = [Deno.cwd()]
homeDir && dirs.push(homeDir)
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
      const file = path.join(dir, filename)
      if (!existsSync(file)) {
        continue
      }

      const yaml = Deno.readTextFileSync(file)
      const parsedConfig = (await parse(yaml)) as Config

      config = {}
      for (const [tool, toolConfig] of Object.entries(parsedConfig)) {
        const { downloadURLFmt, filenameFmt, installFn } = toolConfig!
        config[tool] = {
          downloadURLFmt,
          filenameFmt,
          installFn:
            installFn &&
            (path.isAbsolute(installFn)
              ? installFn
              : path.join(dir, installFn)),
        }
      }
      return config
    }
  }
}
