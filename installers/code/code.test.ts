import { codeInstaller } from './code.ts'

Deno.test('download and install', async () => {
  await codeInstaller.download('1.49.2')
})
