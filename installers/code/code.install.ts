import { existsSync, fmt, moveSync, path } from '../../deps.ts'
import { untar } from '../../src/utils.ts'

const installDir = '/home/sketches/vscode'
const dataDir = path.join(installDir, 'data')

export async function install(filepath: string) {
  let tempDir: string | undefined
  if (existsSync(installDir)) {
    tempDir = Deno.makeTempDirSync()
    fmt.printf(`moving ${installDir} to ${tempDir} ...`)
    moveSync(installDir, tempDir, { overwrite: true })
    fmt.printf(' done\n')
  } else {
    fmt.printf('existing vscode directory not found\ninstalling fresh\n')
  }

  fmt.printf(`making ${installDir} ...`)
  Deno.mkdirSync(dataDir, { recursive: true })
  fmt.printf(' done\n')

  fmt.printf(`untaring ${filepath} to ${installDir} ...`)
  await untar(filepath, installDir, { compression: 'z', level: 1 })
  fmt.printf(' done\n')

  if (tempDir) {
    const tempData = path.join(tempDir, 'data')
    fmt.printf(`moving ${tempData} to ${dataDir} ...`)
    moveSync(tempData, dataDir, { overwrite: true })
    fmt.printf(' done\n')

    fmt.printf(`removing ${tempDir} ...`)
    Deno.removeSync(tempDir, { recursive: true })
    fmt.printf(' done\n')
  }
}
