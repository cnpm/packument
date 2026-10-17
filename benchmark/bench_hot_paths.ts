/**
 * Compare native builds with identical inputs and operations, including Package
 * construction in cold cases. Keep the input Buffer alive in warm cases.
 *
 * node benchmark/bench_hot_paths.ts [results.json]
 * NAPI_RS_NATIVE_LIBRARY_PATH=/absolute/path/baseline.node node benchmark/bench_hot_paths.ts [baseline.json]
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { withCodSpeed } from '@codspeed/tinybench-plugin'
import { Bench } from 'tinybench'

import { JSONBuilder, Package } from '../js/index.js'

const bench = withCodSpeed(new Bench({ time: 500, iterations: 16, warmupTime: 100, warmupIterations: 2 }))
const fixtures = path.join(import.meta.dirname, '../__test__/fixtures')
const inputs = []

for (const file of ['a.json', 'npm.json', '@primer/react.json']) {
  const data = fs.readFileSync(path.join(fixtures, file))
  const parsed = JSON.parse(data.toString())
  const versionKeys = Object.keys(parsed.versions)
  const localVersions = versionKeys.slice(0, -1)
  const latest = parsed['dist-tags'].latest
  const pkg = new Package(data)
  const addedVersion = { name: parsed.name, version: '9999999.0.0' }
  const add = () => new JSONBuilder(data).setIn(['versions', addedVersion.version], addedVersion).build()
  const remove = () => new JSONBuilder(data).deleteIn(['versions', latest]).build()

  // Check complete manifests and positions outside the timed region.
  assert.equal(pkg.getLatestVersion()?.version, parsed.versions[latest].version)
  const diff = pkg.diff(localVersions)
  assert.deepEqual(diff.removedVersions, [])
  assert.equal(diff.addedVersions.length, 1)
  const [addedKey, [start, end]] = diff.addedVersions[0]
  assert.equal(addedKey, versionKeys.at(-1))
  assert.deepEqual(JSON.parse(data.subarray(start, end).toString()), parsed.versions[addedKey])
  assert.deepEqual(JSON.parse(add().toString()), {
    ...parsed,
    versions: { ...parsed.versions, [addedVersion.version]: addedVersion },
  })
  const remainingVersions = { ...parsed.versions }
  delete remainingVersions[latest]
  assert.deepEqual(JSON.parse(remove().toString()), { ...parsed, versions: remainingVersions })

  inputs.push({ file, bytes: data.length, versions: versionKeys.length })
  bench
    .add(`${file}: construct`, () => new Package(data))
    .add(`${file}: readme (cold)`, () => new Package(data).readme)
    .add(`${file}: getMetaInfo (cold)`, () => new Package(data).getMetaInfo())
    .add(`${file}: getLatestVersion (cold)`, () => new Package(data).getLatestVersion())
    .add(`${file}: getLatestVersion (warm)`, () => pkg.getLatestVersion())
    .add(`${file}: diff (cold)`, () => new Package(data).diff(localVersions))
    .add(`${file}: diff (warm)`, () => pkg.diff(localVersions))
    .add(`${file}: sync fields (cold)`, () => {
      const current = new Package(data)
      return {
        readme: current.readme,
        time: current.time,
        maintainers: current.maintainers,
        isUnpublished: current.isUnpublished,
        distTags: current.distTags,
        description: current.description,
        repository: current.repository,
        latestVersion: current.getLatestVersion(),
      }
    })
    .add(`${file}: add version`, add)
    .add(`${file}: delete latest version`, remove)
}

await bench.run()
const results = bench.tasks.flatMap((task) => {
  const result = task.result
  if (result.state === 'errored') throw result.error
  // CodSpeed simulation invokes the functions directly and reports its own results.
  if (result.state === 'not-started') return []
  if (result.state !== 'completed') throw new Error(`Benchmark did not complete: ${task.name}`)
  return [
    {
      name: task.name,
      meanMs: result.latency.mean,
      medianMs: result.latency.p50,
      rme: result.latency.rme,
      samples: result.latency.samplesCount,
    },
  ]
})
console.table(bench.table())

if (process.argv[2]) {
  fs.writeFileSync(
    process.argv[2],
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cpu: os.cpus()[0]?.model,
        binding: process.env.NAPI_RS_NATIVE_LIBRARY_PATH ?? 'current build',
        inputs,
        results,
      },
      null,
      2,
    ) + '\n',
  )
}
