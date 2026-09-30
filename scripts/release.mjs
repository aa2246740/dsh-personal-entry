/** Publish under the available npm name without changing existing plugin consumers. */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = join(root, '.local', 'release')
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
if (manifest.name !== 'dsh-personal' || manifest.private !== true) {
  throw new Error('The canonical package must retain the private dsh-personal identity')
}
await mkdir(output, { recursive: true })
const stage = await mkdtemp(join(output, 'npm-stage-'))
const pack = cwd => JSON.parse(execFileSync('npm', [
  'pack', '--ignore-scripts', '--json', '--pack-destination', output,
], { cwd, encoding: 'utf8' }))[0]
const desktop = pack(root)
execFileSync('tar', ['-xzf', join(output, desktop.filename), '-C', stage, '--strip-components=1'])
const published = {
  ...manifest,
  name: 'dsh-personal-entry',
  private: false,
  publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
}
// Development scripts require a local Harness; registry consumers get built artifacts.
delete published.scripts
delete published.devDependencies
await writeFile(join(stage, 'package.json'), JSON.stringify(published, null, 2) + '\n')
const npm = pack(stage)
const checksums = []
for (const archive of [desktop, npm]) {
  const bytes = await readFile(join(output, archive.filename))
  checksums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${archive.filename}`)
}
await writeFile(join(output, 'SHA256SUMS'), checksums.join('\n') + '\n')
console.log(JSON.stringify({ desktop: desktop.filename, npm: npm.filename, output }, null, 2))
