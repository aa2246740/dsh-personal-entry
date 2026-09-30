/** Build against existing public Harness artifacts without compiling the Host. */
import { readFile, readdir, mkdir, lstat, realpath, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const task = process.argv[2]
if (!['prepare', 'build', 'typecheck', 'test'].includes(task)) throw new Error('Expected prepare, build, typecheck or test')
const requested = process.env.DSHX_HARNESS?.trim() || (await readFile(join(homedir(), '.config/dshx/harness'), 'utf8')).trim()
const harness = await realpath(requested)
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const target = JSON.parse(await readFile(join(harness, 'package.json'), 'utf8'))
const helper = join(harness, 'tools/dshx/src/client-build.js')
await lstat(helper)
process.env.DSHX_HARNESS = harness
process.chdir(root)

const packages = new Map()
for (const group of await readdir(join(harness, 'packages'), { withFileTypes: true })) {
  if (!group.isDirectory()) continue
  for (const entry of await readdir(join(harness, 'packages', group.name), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const directory = join(harness, 'packages', group.name, entry.name)
    let data
    try { data = await readFile(join(directory, 'package.json'), 'utf8') }
    catch (error) { if (error.code === 'ENOENT') continue; throw error }
    packages.set(JSON.parse(data).name, directory)
  }
}
const hostRequire = createRequire(join(harness, 'packages/host/webserver/package.json'))
packages.set('@deepseek-ai/cordis', dirname(hostRequire.resolve('@deepseek-ai/cordis/package.json')))
for (const name of Object.keys(manifest.peerDependencies)) {
  if (name === '@deepseek-ai/dsh') continue
  const directory = packages.get(name)
  if (!directory) throw new Error(`Target Harness has no public dependency ${name}`)
  const link = join(root, 'node_modules', name)
  await mkdir(dirname(link), { recursive: true })
  let existing
  try { existing = await lstat(link) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (existing) {
    if (!existing.isSymbolicLink() || await realpath(link) !== await realpath(directory)) {
      throw new Error(`Dependency belongs to another target: ${link}. Review this plugin-local entry before switching Harness.`)
    }
  } else await symlink(directory, link, 'junction')
}

const ours = createRequire(join(root, 'package.json'))
const runNode = (args) => execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
if (task === 'typecheck' || task === 'build') {
  runNode([ours.resolve('typescript/bin/tsc'), '-p', task === 'build' ? 'tsconfig.emit.json' : 'tsconfig.json'])
}
if (task === 'test') {
  const tests = (await readdir(join(root, 'tests'))).filter(name => name.endsWith('.test.ts')).sort()
  runNode(['--experimental-strip-types', '--test', ...tests.map(name => join('tests', name))])
}
if (task === 'build') {
  const targetRequire = createRequire(join(harness, 'package.json'))
  const { build } = await import(pathToFileURL(targetRequire.resolve('tsdown')).href)
  const { externalClientBundle } = await import(pathToFileURL(helper).href)
  const configurations = externalClientBundle(manifest.name, ['src/index.ts'], { packageRoot: root, clientEntry: 'src/client/index.tsx' })
  configurations[1].sourcemap = false
  for (const configuration of configurations) await build({ ...configuration, config: false })
  // Bundler region comments name absolute source paths; keep this machine out of the package.
  const client = join(root, 'lib/client.js')
  const bundled = await readFile(client, 'utf8')
  await writeFile(client, bundled.replaceAll(`${root}/`, ''))
}
await mkdir(join(root, '.local'), { recursive: true })
await writeFile(join(root, '.local/harness.json'), JSON.stringify({ task, harness, harnessVersion: target.version, pluginVersion: manifest.version, checkedAt: new Date().toISOString() }, null, 2) + '\n')
console.log(`${task}: ${manifest.name}@${manifest.version}, Harness ${target.version}`)
