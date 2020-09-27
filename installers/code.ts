import { exists, fmt, move, path } from '../deps.ts'
import { Installer } from '../installer.ts'
import { untar } from '../utils.ts'

const installDir = '/home/sketches/vscode'
const dataDir = path.join(installDir, 'data')

export const codeInstaller = new Installer({
  downloadURL: (version) =>
    `https://update.code.visualstudio.com/${version}/linux-x64/stable`,
  filename: (version) => `code-${version}.tar.gz`,
  installFn: async (filepath) => {
    let tempDir: string | undefined
    if (await exists(installDir)) {
      tempDir = await Deno.makeTempDir()
      fmt.printf(`moving ${installDir} to ${tempDir} ...`)
      await move(installDir, tempDir, { overwrite: true })
      fmt.printf(' done\n')
    } else {
      fmt.printf('existing vscode directory not found\ninstalling fresh\n')
    }

    fmt.printf(`making ${installDir} ...`)
    await Deno.mkdir(dataDir, { recursive: true })
    fmt.printf(' done\n')

    fmt.printf(`untaring ${filepath} to ${installDir} ...`)
    await untar(filepath, installDir, { compression: 'z', level: 1 })
    fmt.printf(' done\n')

    if (tempDir) {
      const tempData = path.join(tempDir, 'data')
      fmt.printf(`moving ${tempData} to ${dataDir} ...`)
      await move(tempData, dataDir, { overwrite: true })
      fmt.printf(' done\n')

      fmt.printf(`removing ${tempDir} ...`)
      await Deno.remove(tempDir, { recursive: true })
      fmt.printf(' done\n')
    }
  },
})
