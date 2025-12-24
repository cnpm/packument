import fs from 'node:fs'
import path from 'node:path'

import { JSONBuilder } from '../js/index.js'

import { getGCStats } from './gc.js'

const method = process.argv[2] || 'JSONParse'
const filename = process.argv[3] || '@primer/react.json'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures')
const largeData = fs.readFileSync(path.join(fixtures, filename))
console.log('')
console.log('## Benchmarking %s with %s', method, filename)
console.log('- Data size: %sMB', (largeData.length / 1024 / 1024).toFixed(0))
console.log('- GC: %s', process.env.GC ? 'enabled' : 'disabled')
console.log('')

const version = {
  name: '@primer/react',
  version: '10000000.0.0',
  dist: {
    shasum: '1234567890',
    tarball: 'https://registry.npmjs.org/@primer/react/-/react-10000000.0.0.tgz',
    fileCount: 100,
    integrity: 'sha512-1234567890',
  },
  attestations: {
    url: 'https://registry.npmjs.org/-/npm/v1/attestations/@primer/react@10000000.0.0',
    provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
  },
  unpackedSize: 10000000,
  signatures: [
    {
      sig: '1234567890',
      keyid: '1234567890',
    },
  ],
}

function JSONParse(data: Buffer): Uint8Array {
  // @ts-expect-error ignore the type error
  const pkg = JSON.parse(data)
  pkg.versions['10000000.0.0'] = version
  return Buffer.from(JSON.stringify(pkg))
}

function SonicJSONParse(data: Buffer): Uint8Array {
  const builder = new JSONBuilder(data)
  builder.setIn(['versions', '10000000.0.0'], version)
  return builder.build()
}

const parse = method === 'SonicJSONParse' ? SonicJSONParse : JSONParse

// const addVersion = JSON.parse(parse(largeData).toString()).versions['10000000.0.0']
// console.log(`${method} add version (@primer/react@10000000.0.0): %o`, addVersion)
for (let i = 0; i < 5; i++) {
  const startTime = performance.now()
  parse(largeData)
  const endTime = performance.now()
  console.log(`${method} add version (${filename}) #${i + 1} time: ${(endTime - startTime).toFixed(0)}ms`)
}

// only print GC stats if the GC environment variable is set
if (process.env.GC) {
  setTimeout(() => {
    const stats = getGCStats()
    console.log('')
    console.log(
      '[GC]',
      'total(ms)=',
      stats.totalGCDuration.toFixed(2),
      'count=',
      stats.count,
      'avg(ms)=',
      stats.avgDuration.toFixed(2),
      'byKind=',
      stats.byKind,
    )
  }, 2000)
}

// JSONParse GC
// [GC] total(ms)= 194.04 count= 69 avg(ms)= 2.81 byKind= {
//   scavenge: 168.37695503234863,
//   markSweepCompact: 24.3637912273407,
//   incremental: 1.2962088584899902,
//   weakc: 0,
//   unknown: 0
// }
// SonicJSONParse GC
// [GC] total(ms)= 1.90 count= 9 avg(ms)= 0.21 byKind= {
//   scavenge: 0.543499231338501,
//   markSweepCompact: 1.1680009365081787,
//   incremental: 0.18370866775512695,
//   weakc: 0,
//   unknown: 0
// }
