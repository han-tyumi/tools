import { Installer } from '../installer.ts'

import installFn from './code.install.ts'

export const codeInstaller = new Installer({
  downloadURL: (version) =>
    `https://update.code.visualstudio.com/${version}/linux-x64/stable`,
  filename: (version) => `code-${version}.tar.gz`,
  installFn,
})
