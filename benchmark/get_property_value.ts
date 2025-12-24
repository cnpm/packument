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

function JSONParse(data: Buffer) {
  // @ts-expect-error ignore the type error
  const pkg = JSON.parse(data)
  return pkg.name
}

function SonicJSONParse(data: Buffer) {
  const builder = new JSONBuilder(data)
  return builder.getIn<string>(['name'])
}

const parse = method === 'SonicJSONParse' ? SonicJSONParse : JSONParse

const name = parse(largeData)
console.log(`${method} get name of ${filename}: %o`, name)

for (let i = 0; i < 5; i++) {
  const startTime = performance.now()
  parse(largeData)
  const endTime = performance.now()
  console.log(`${method} get property value (${filename}) #${i + 1} time: ${(endTime - startTime).toFixed(0)}ms`)
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
