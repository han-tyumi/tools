import { Installer } from './installer.ts'

Deno.test('Download to default directory.', async () => {
  const installer = new Installer({
    downloadURL: (version) =>
      `https://update.code.visualstudio.com/${version}/linux-x64/stable`,
    filename: (version) => `code-${version}.tar.gz`,
  })

  await installer.download('1.49')
})
