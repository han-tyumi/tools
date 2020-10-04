import { existsSync, path } from '../deps.ts'

export const mainDir = path.dirname(path.fromFileUrl(Deno.mainModule))
export const homeDir =
  Deno.env.get(Deno.build.os === 'windows' ? 'USERPROFILE' : 'HOME') || ''

export function escapeRegex(input: string) {
  return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export async function getJsFn(identifier: string, dir = Deno.cwd()) {
  let [file, name = 'default'] = identifier.split('#')

  if (!existsSync(file)) {
    throw new Error(`${file} does not exist`)
  }

  if (!path.isAbsolute(file)) {
    file = path.join(dir, file)
  }

  const install = (await import(file))[name]
  const installType = typeof install
  if (installType !== 'function') {
    throw new Error(`${file} ${name} export is ${installType}`)
  }
  return install
}

export interface UntarOptions extends Omit<Deno.RunOptions, 'cmd'> {
  compression?: 'a' | 'j' | 'J' | 'z' | 'Z'
  level?: number
  verbose?: boolean
}

export async function untar(
  src: string,
  dest: string,
  { compression = 'a', level = 0, verbose = false, ...runOptions }: UntarOptions
) {
  const cmd = ['tar']
  if (level > 0) {
    cmd.push(`--strip-components=${level}`)
  }
  cmd.push(`-x${compression}${verbose ? 'v' : ''}f`, src, '-C', dest)
  const process = await Deno.run({ cmd, ...runOptions })
  const status = await process.status()
  process.close()
  return status
}
