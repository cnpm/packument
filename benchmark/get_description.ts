import fs from 'node:fs'
import path from 'node:path'

import { Package } from '../index.js'

const method = process.argv[2] || 'v8'
const filename = process.argv[3] || '@primer/react.json'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures')
const largeData = fs.readFileSync(path.join(fixtures, filename))

function JSONParseDescription(data: Buffer): string {
  // @ts-expect-error ignore the type error
  return JSON.parse(data).description
}

function SonicJSONParseDescription(data: Buffer): string {
  return new Package(data).description!
}

// console.log(
//   'npm package description: %o, %o',
//   JSONParseDescription(largeData),
//   SonicJSONParseDescription(largeData),
// )
if (method === 'sonic') {
  console.log('SonicJSONParseDescription: %o', SonicJSONParseDescription(largeData))
  for (let i = 0; i < 20; i++) {
    SonicJSONParseDescription(largeData)
  }
} else {
  console.log('JSONParseDescription: %o', JSONParseDescription(largeData))
  for (let i = 0; i < 20; i++) {
    JSONParseDescription(largeData)
  }
}
