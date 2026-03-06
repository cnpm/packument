/**
 * Worker script for real-case memory benchmark.
 *
 * Usage: node real_case_worker.ts <method> [filename]
 *   method: JSONParse | SonicMultiGet | SonicMetaInfo
 *   filename: fixture file name (default: @primer/react.json)
 */
import fs from 'node:fs'
import path from 'node:path'

import { Package } from '../js/index.js'

const method = process.argv[2] || 'JSONParse'
const filename = process.argv[3] || '@primer/react.json'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures')
const data = fs.readFileSync(path.join(fixtures, filename))

function jsonParseAllFields(buf: Buffer) {
  // @ts-expect-error - JSON.parse can work with Buffer
  const pkg = JSON.parse(buf)
  return {
    readme: pkg.readme,
    time: pkg.time,
    maintainers: pkg.maintainers,
    distTags: pkg['dist-tags'],
    description: pkg.description,
    repository: pkg.repository,
    isUnpublished: !!pkg.time?.unpublished,
    versionKeys: pkg.versions ? Object.keys(pkg.versions) : [],
  }
}

function sonicMultiGet(buf: Buffer) {
  const pkg = new Package(buf)
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

function sonicMetaInfo(buf: Buffer) {
  return new Package(buf).getMetaInfo()
}

const fns: Record<string, (buf: Buffer) => unknown> = {
  JSONParse: jsonParseAllFields,
  SonicMultiGet: sonicMultiGet,
  SonicMetaInfo: sonicMetaInfo,
}

const fn = fns[method]
if (!fn) {
  console.error(`Unknown method: ${method}`)
  process.exit(1)
}

for (let i = 0; i < 5; i++) {
  fn(data)
}
