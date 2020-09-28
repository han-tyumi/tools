import { Installer } from '../../src/installer.ts'
import { install } from './code.install.ts'

export const codeInstaller = new Installer({
  downloadURL: (version) =>
    `https://update.code.visualstudio.com/${version}/linux-x64/stable`,
  filename: (version) => `code-${version}.tar.gz`,
  installFn: install,
})
