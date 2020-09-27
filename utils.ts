import { path } from './deps.ts'

export const mainDir = path.dirname(path.fromFileUrl(Deno.mainModule))
