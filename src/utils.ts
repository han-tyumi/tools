import { path } from '../deps.ts'

export const mainDir = path.dirname(path.fromFileUrl(Deno.mainModule))
export const homeDir =
  Deno.env.get(Deno.build.os === 'windows' ? 'USERPROFILE' : 'HOME') || ''

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
