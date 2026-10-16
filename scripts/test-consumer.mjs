import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { JSONBuilder, Package, getIn, hasIn } from '@cnpmjs/packument'

const data = readFileSync(new URL('../__test__/fixtures/a.json', import.meta.url))
const pkg = new Package(data)
assert.equal(pkg.name, 'a')
assert.equal(pkg.getIn(['name']), 'a')
assert.equal(pkg.getMetaInfo().versionKeys.length, 69)
assert.equal(pkg.getLatestVersion().name, 'a')
assert.equal(hasIn(data, ['name']), true)
const position = getIn(data, ['name'])
assert.equal(data.subarray(position.start, position.end).toString(), '"a"')

const builder = new JSONBuilder(data)
builder.setIn(['description'], 'consumer check')
builder.setIn(['custom'], { enabled: true })
assert.equal(builder.getIn(['description']), 'consumer check')
assert.deepEqual(builder.getIn(['custom']), { enabled: true })
builder.deleteIn(['custom'])
assert.equal(builder.hasIn(['custom']), false)
assert.equal(new Package(builder.build()).description, 'consumer check')
assert.throws(() => new Package(Buffer.from('invalid')), /Invalid JSON/)

console.log(`Package consumer passed on ${process.version}`)
