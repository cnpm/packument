import fs from 'node:fs'
import path from 'node:path'

import { Package } from '../index.js'

const method = process.argv[2] || 'JSONParse'
const filename = process.argv[3] || '@primer/react.json'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures')
const largeData = fs.readFileSync(path.join(fixtures, filename))

function JSONParse(data: Buffer): string {
  // @ts-expect-error ignore the type error
  return JSON.parse(data).description
}

function SonicJSONParse(data: Buffer): string {
  return new Package(data).description!
}

const parse = method === 'SonicJSONParse' ? SonicJSONParse : JSONParse

console.log(`${method} description (${filename}): %o`, parse(largeData))
for (let i = 0; i < 5; i++) {
  parse(largeData)
}
