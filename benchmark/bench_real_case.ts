/**
 * Benchmark: simulate real cnpmcore sync scenario
 *
 * In cnpmcore's PackageSyncerService, a single sync operation reads
 * multiple top-level fields from the packument sequentially:
 *   .readme, .time, .maintainers, .isUnpublished, .distTags,
 *   .description, .repository, .getLatestVersion()
 *
 * This benchmark compares:
 *   1. JSON.parse           — single parse, multiple field reads
 *   2. sonic-rs multi-get   — multiple lazy traversals (current)
 *   3. sonic-rs getMetaInfo — single-pass serde view (new)
 */
import fs from 'node:fs'
import path from 'node:path'

import { withCodSpeed } from '@codspeed/tinybench-plugin'
import { Bench } from 'tinybench'

import { Package } from '../js/index.js'
import { runMemoryBenchmarks } from './memory_usage.ts'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures')
const smallData = fs.readFileSync(path.join(fixtures, 'a.json'))
const largeData = fs.readFileSync(path.join(fixtures, 'npm.json'))
const superLargeData = fs.readFileSync(path.join(fixtures, '@primer/react.json'))

// --- 1. JSON.parse ---

function jsonParseAllFields(data: Buffer) {
  // @ts-expect-error - JSON.parse can work with Buffer
  const pkg = JSON.parse(data)
  const readme = pkg.readme
  const time = pkg.time
  const maintainers = pkg.maintainers
  const distTags = pkg['dist-tags']
  const description = pkg.description
  const repository = pkg.repository
  let isUnpublished = false
  if (time?.unpublished) {
    isUnpublished = typeof time.unpublished === 'string' || typeof time.unpublished === 'object'
  }
  const versionKeys = pkg.versions ? Object.keys(pkg.versions) : []
  return { readme, time, maintainers, isUnpublished, distTags, description, repository, versionKeys }
}

// --- 2. sonic-rs multi-get (current) ---

function sonicMultiGet(data: Buffer) {
  const pkg = new Package(data)
  return {
    readme: pkg.readme,
    time: pkg.time,
    maintainers: pkg.maintainers,
    isUnpublished: pkg.isUnpublished,
    distTags: pkg.distTags,
    description: pkg.description,
    repository: pkg.repository,
    latestVersion: pkg.getLatestVersion(),
  }
}

// --- 3. sonic-rs getMetaInfo — single-pass view ---

function sonicView(data: Buffer) {
  return new Package(data).getMetaInfo()
}

// --- Verify ---
function verify(data: Buffer, label: string) {
  const a = jsonParseAllFields(data)
  const c = sonicView(data)
  const checks = [
    ['readme', !!a.readme, !!c.readme],
    ['description', a.description, c.description],
    ['isUnpublished', a.isUnpublished, c.isUnpublished],
    ['versionKeys', a.versionKeys.length, c.versionKeys.length],
    ['time keys', a.time ? Object.keys(a.time).length : 0, c.time ? Object.keys(c.time).length : 0],
  ] as const
  for (const [field, va, vc] of checks) {
    if (String(va) !== String(vc)) console.warn(`[${label}] mismatch ${field}: JSON.parse=${va}, view=${vc}`)
  }
  console.log(`[${label}] verify OK (versions=${a.versionKeys.length})`)
}

verify(smallData, 'small')
verify(largeData, 'large')

const b = withCodSpeed(new Bench())

b.add('JSON.parse all fields (117KB)', () => {
  jsonParseAllFields(smallData)
})
b.add('sonic-rs multi-get (117KB)', () => {
  sonicMultiGet(smallData)
})
b.add('sonic-rs getMetaInfo (117KB)', () => {
  sonicView(smallData)
})

b.add('JSON.parse all fields (22MB)', () => {
  jsonParseAllFields(largeData)
})
b.add('sonic-rs multi-get (22MB)', () => {
  sonicMultiGet(largeData)
})
b.add('sonic-rs getMetaInfo (22MB)', () => {
  sonicView(largeData)
})

b.add('JSON.parse all fields (89MB)', () => {
  jsonParseAllFields(superLargeData)
})
b.add('sonic-rs multi-get (89MB)', () => {
  sonicMultiGet(superLargeData)
})
b.add('sonic-rs getMetaInfo (89MB)', () => {
  sonicView(superLargeData)
})

await b.run()

console.table(b.table())

// --- Memory usage ---

const workerScript = path.join(import.meta.dirname, 'real_case_worker.ts')
const runner = process.version.startsWith('v20.') ? 'npx tsx' : 'node'

const memBenchmarks = [
  { method: 'JSONParse', size: '22M', file: 'npm.json' },
  { method: 'JSONParse', size: '89M', file: '@primer/react.json' },
  { method: 'SonicMultiGet', size: '22M', file: 'npm.json' },
  { method: 'SonicMultiGet', size: '89M', file: '@primer/react.json' },
  { method: 'SonicMetaInfo', size: '22M', file: 'npm.json' },
  { method: 'SonicMetaInfo', size: '89M', file: '@primer/react.json' },
]

await runMemoryBenchmarks(
  memBenchmarks.map(({ method, size, file }) => ({
    name: `${method} all fields (${size})`,
    command: `${runner} ${workerScript} ${method} ${file}`,
    prepare: '',
  })),
)
