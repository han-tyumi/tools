import { parse, path, existsSync } from '../deps.ts'
import type { InstallerOptions } from './installer.ts'
import { homeDir, mainDir } from './utils.ts'

interface Config {
  [tool: string]:
    | {
        options?: InstallerOptions
        downloadURLFmt?: string
        filenameFmt?: string
        installFn?: string
      }
    | undefined
}

type Exts = 'yml' | 'yaml' | 'ts' | 'js'

let config: Promise<Config> | undefined

// construct array of directories to search
const dirs = [Deno.cwd()]
homeDir && dirs.push(homeDir)
dirs.push(mainDir)

const basename = 'toolsrc'
const exts: Exts[] = ['yml', 'yaml', 'ts', 'js']

/**
 * @param cache Whether to use the last configuration retrieved.
 * @returns The tools configuration file object if found.
 */
export function getConfig(cache = true) {
  if (cache && config) {
    return config
  }

  for (const dir of dirs) {
    for (const ext of exts) {
      const file = path.join(dir, `${basename}.${ext}`)
      if (!existsSync(file)) {
        continue
      }

      if (ext === 'yml' || ext === 'yaml') {
        config = parseYaml({ dir, file })
      } else {
        config = parseJs({ dir, file })
      }

      return config
    }
  }

  return Promise.resolve(undefined)
}

interface ParserOptions {
  dir: string
  file: string
}

async function parseYaml({ dir, file }: ParserOptions) {
  const yaml = Deno.readTextFileSync(file)
  const parsedConfig = (await parse(yaml)) as Config

  const config: Config = {}
  for (const [tool, toolConfig] of Object.entries(parsedConfig)) {
    const { downloadURLFmt, filenameFmt, installFn } = toolConfig!
    config[tool] = {
      downloadURLFmt,
      filenameFmt,
      installFn:
        installFn &&
        (path.isAbsolute(installFn) ? installFn : path.join(dir, installFn)),
    }
  }

  return config
}

async function parseJs({ file }: ParserOptions) {
  const mod = await import(file)
  const parsedOptions: Record<string, InstallerOptions> = mod.default
    ? mod.default
    : mod

  const config: Config = {}
  for (const [tool, options] of Object.entries(parsedOptions)) {
    config[tool] = {
      options,
    }
  }

  return config
}
