import path from 'node:path'
import fs from 'node:fs'

import { test, expect } from 'vitest'

import { JSONBuilder } from '../js/index.js'

const fixtures = path.join(import.meta.dirname, 'fixtures')

test('should update existing property', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  builder.setIn(['name'], 'Jane')
  expect(builder.build().toString()).toBe('{"name": "Jane", "age": 30, "address": { "city": "New York" }}')

  builder.setIn(['age'], 31)
  expect(builder.build().toString()).toBe('{"name": "Jane", "age": 31, "address": { "city": "New York" }}')

  builder.setIn(['address', 'city'], 'Los Angeles')
  expect(builder.build().toString()).toBe('{"name": "Jane", "age": 31, "address": { "city": "Los Angeles" }}')

  builder.setIn(['address'], { country: 'United States', no: 101 })
  expect(builder.build().toString()).toBe(
    '{"name": "Jane", "age": 31, "address": {"country":"United States","no":101}}',
  )
})

test('should add new property when parent exists', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  builder.setIn(['email'], 'john@example.com')
  expect(builder.build().toString()).toBe(
    '{"name": "John", "age": 30, "address": { "city": "New York" },"email":"john@example.com"}',
  )

  builder.setIn(['address', 'no'], 101)
  expect(builder.build().toString()).toBe(
    '{"name": "John", "age": 30, "address": { "city": "New York" ,"no":101},"email":"john@example.com"}',
  )
})

test('should add new property when parent not exists', () => {
  const raw = `{"name": "John", "age": 30, "address": { "city": "New York" }
  
\t
\t\t

    }`
  const data = Buffer.from(raw)
  const builder = new JSONBuilder(data)
  builder.setIn(['info', 'email'], 'john@example.com')
  const buf = builder.build()
  expect(buf.toString()).toBe(`${raw.substring(0, raw.length - 1)},"info":{"email":"john@example.com"}}`)
  expect(JSON.parse(buf.toString())).toEqual({
    name: 'John',
    age: 30,
    address: { city: 'New York' },
    info: { email: 'john@example.com' },
  })
})

test('should throw error when parent is not an object', () => {
  let data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  let builder = new JSONBuilder(data)
  expect(() => builder.setIn(['age', 'no'], 101)).toThrow(
    'invalid type: integer `30`, expected a JSON object at line 1 column 26',
  )

  data = Buffer.from('{"address": [1, 2, 3] }')
  builder = new JSONBuilder(data)
  expect(() => builder.setIn(['address', 'no'], 101)).toThrow(
    'invalid type: sequence, expected a JSON object at line 1 column 21',
  )
})

test('should set value work with string, number, boolean, date, object', () => {
  const data = Buffer.from('{}')
  const builder = new JSONBuilder(data)
  builder.setIn(['info', 'email'], 'john@example.com')
  expect(builder.build().toString()).toBe('{"info":{"email":"john@example.com"}}')

  builder.setIn(['info', 'age'], 31)
  expect(builder.build().toString()).toBe('{"info":{"email":"john@example.com","age":31}}')

  builder.setIn(['info', 'isAdmin'], true)
  expect(builder.build().toString()).toBe('{"info":{"email":"john@example.com","age":31,"isAdmin":true}}')

  builder.setIn(['info', 'isAdmin'], false)
  expect(builder.build().toString()).toBe('{"info":{"email":"john@example.com","age":31,"isAdmin":false}}')

  builder.setIn(['info', 'createdAt'], new Date('2025-01-01'))
  expect(builder.build().toString()).toBe(
    '{"info":{"email":"john@example.com","age":31,"isAdmin":false,"createdAt":"2025-01-01T00:00:00.000Z"}}',
  )

  builder.setIn(['info', 'address'], { city: 'New York', no: 101 })
  expect(builder.build().toString()).toBe(
    '{"info":{"email":"john@example.com","age":31,"isAdmin":false,"createdAt":"2025-01-01T00:00:00.000Z","address":{"city":"New York","no":101}}}',
  )

  // @ts-expect-error - JSON.parse can work with Uint8Array
  expect(JSON.parse(builder.build())).toEqual({
    info: {
      email: 'john@example.com',
      age: 31,
      isAdmin: false,
      createdAt: '2025-01-01T00:00:00.000Z',
      address: { city: 'New York', no: 101 },
    },
  })
})

test('should work with emoji', () => {
  const data = Buffer.from('{}')
  const builder = new JSONBuilder(data)
  builder.setIn(['info', 'name'], '👨‍👩‍👧‍👦')
  expect(builder.build().toString()).toBe('{"info":{"name":"👨‍👩‍👧‍👦"}}')
  builder.setIn(['😄'], true)
  expect(builder.build().toString()).toBe('{"info":{"name":"👨‍👩‍👧‍👦"},"😄":true}')
  expect(JSON.parse(builder.build().toString())).toEqual({
    info: { name: '👨‍👩‍👧‍👦' },
    '😄': true,
  })

  // update emoji key
  builder.setIn(['😄'], '😄')
  expect(builder.build().toString()).toBe('{"info":{"name":"👨‍👩‍👧‍👦"},"😄":"😄"}')
  expect(JSON.parse(builder.build().toString())).toEqual({
    info: { name: '👨‍👩‍👧‍👦' },
    '😄': '😄',
  })
})

test('should work with double and single quotes', () => {
  const data = Buffer.from('{}')
  const builder = new JSONBuilder(data)
  builder.setIn(['info', 'name'], '"John"')
  expect(builder.build().toString()).toBe('{"info":{"name":"\\"John\\""}}')
  expect(JSON.parse(builder.build().toString())).toEqual({
    info: { name: '"John"' },
  })
  builder.setIn(['info', '"foo"'], 'bar')
  expect(builder.build().toString()).toBe('{"info":{"name":"\\"John\\"","\\"foo\\"":"bar"}}')
  expect(JSON.parse(builder.build().toString())).toEqual({
    info: { name: '"John"', '"foo"': 'bar' },
  })

  // update double quotes key
  builder.setIn(['info', '"foo"'], 'bar2 👌')
  expect(builder.build().toString()).toBe('{"info":{"name":"\\"John\\"","\\"foo\\"":"bar2 👌"}}')
  expect(JSON.parse(builder.build().toString())).toEqual({
    info: { name: '"John"', '"foo"': 'bar2 👌' },
  })

  builder.setIn(['info', "foo'bar"], 'baz')
  expect(builder.build().toString()).toBe('{"info":{"name":"\\"John\\"","\\"foo\\"":"bar2 👌","foo\'bar":"baz"}}')
  expect(JSON.parse(builder.build().toString())).toEqual({
    info: { name: '"John"', '"foo"': 'bar2 👌', "foo'bar": 'baz' },
  })
})

test('should work with large json', () => {
  const data = fs.readFileSync(path.join(fixtures, '@primer/react.json'))
  const builder = new JSONBuilder(data)
  const version = {
    name: '@primer/react',
    version: '10000000.0.0',
    dist: {
      shasum: '1234567890',
      tarball: 'https://registry.npmjs.org/@primer/react/-/react-10000000.0.0.tgz',
      fileCount: 100,
      integrity: 'sha512-1234567890',
      signatures: [
        {
          sig: '1234567890',
          keyid: '1234567890',
        },
      ],
      attestations: {
        url: 'https://registry.npmjs.org/-/npm/v1/attestations/@primer/react@10000000.0.0',
        provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
      },
      unpackedSize: 10000000,
    },
  }
  builder.setIn(['versions', '10000000.0.0'], version)
  const pkg = JSON.parse(builder.build().toString())
  expect(pkg.versions['10000000.0.0']).toEqual(version)
  expect(pkg.name).toBe('@primer/react')
  // latest version still exists
  expect(pkg.versions[pkg['dist-tags'].latest]).toMatchSnapshot()
})

test('should delete property', () => {
  const data = Buffer.from(`{"a":"b","name": "foo"  , "description": "foo"   ,   "age":1}`)
  const builder = new JSONBuilder(data)
  builder.deleteIn(['description'])
  expect(builder.build().toString()).toBe(`{"a":"b","name": "foo"   ,   "age":1}`)
  builder.deleteIn(['age'])
  expect(builder.build().toString()).toBe(`{"a":"b","name": "foo"}`)
  expect(JSON.parse(builder.build().toString())).toEqual({ a: 'b', name: 'foo' })
  builder.deleteIn(['a'])
  expect(builder.build().toString()).toBe(`{"name": "foo"}`)
  builder.deleteIn(['name'])
  expect(builder.build().toString()).toBe(`{}`)
})

test('should delete property in the middle of the object', () => {
  ;[
    ['{ "prev": "prev", "middle": "middle", "next": "next" }', '{ "prev": "prev", "next": "next" }'],
    ['{"prev": "prev"      \t\t\t\t\t,     "middle": "middle", "next": "next" }', '{"prev": "prev", "next": "next" }'],
    ['{ "prev": "prev"\t, "middle": "middle", "next": "next" }', '{ "prev": "prev", "next": "next" }'],
    ['{ "prev": \t"prev","middle": "middle", "next": "next" }', '{ "prev": \t"prev", "next": "next" }'],
    ['{ "prev": 1 , "middle": "middle" , "next": "next" }', '{ "prev": 1 , "next": "next" }'],
    ['{ "prev": null , "middle": "middle" \t, "next": "next" }', '{ "prev": null \t, "next": "next" }'],
    ['{ "prev": {}, "middle": "middle", "next": "next" }', '{ "prev": {}, "next": "next" }'],
  ].forEach(([input, output]) => {
    const data = Buffer.from(input)
    const builder = new JSONBuilder(data)
    builder.deleteIn(['middle'])
    expect(builder.build().toString()).toBe(output)
  })
})

test('should delete property in the end of the object', () => {
  ;[
    ['{ "prev": "prev", "middle": "middle", "next": "next" }', '{ "prev": "prev", "middle": "middle" }'],
    [
      '{ "prev": "prev"      \t\t\t\t\t,     "middle": "middle", "next": "next" }',
      '{ "prev": "prev"      \t\t\t\t\t,     "middle": "middle" }',
    ],
    ['{ "prev": "prev"\t, "middle": "middle", "next": "next" }', '{ "prev": "prev"\t, "middle": "middle" }'],
    ['{ "prev": \t"prev","middle": "middle", "next": "next" }', '{ "prev": \t"prev","middle": "middle" }'],
    ['{ "prev": 1 , "middle": "middle" , "next": "next" }', '{ "prev": 1 , "middle": "middle" }'],
    ['{ "prev": null , "middle": "middle" \t, "next": "next" }', '{ "prev": null , "middle": "middle" }'],
    ['{ "prev": {}, "middle": "middle", "next": "next" }', '{ "prev": {}, "middle": "middle" }'],
  ].forEach(([input, output]) => {
    const data = Buffer.from(input)
    const builder = new JSONBuilder(data)
    builder.deleteIn(['next'])
    expect(builder.build().toString()).toBe(output)
  })
})

test('should delete property in the start of the object', () => {
  ;[
    ['{ "prev": "prev", "middle": "middle", "next": "next" }', '{ "middle": "middle", "next": "next" }'],
    ['  { "prev": "prev"      , "middle": "middle", "next": "next" }', '  { "middle": "middle", "next": "next" }'],
    [
      '{ "prev": "prev 😄"      \t\t\t\t\t,     "middle": "middle", "next": "next" }',
      '{     "middle": "middle", "next": "next" }',
    ],
    ['{ "prev": "prev"\t, "middle": "middle", "next": "next" }', '{ "middle": "middle", "next": "next" }'],
    ['{ "prev": \t"prev","middle": "middle", "next": "next" }', '{"middle": "middle", "next": "next" }'],
    ['{ "prev": 1 , "middle": "middle" , "next": "next" }', '{ "middle": "middle" , "next": "next" }'],
    ['{ "prev": null , "middle": "middle" \t, "next": "next" }', '{ "middle": "middle" \t, "next": "next" }'],
    ['{ "prev": {}, "middle": "middle", "next": "next" }', '{ "middle": "middle", "next": "next" }'],
  ].forEach(([input, output]) => {
    const data = Buffer.from(input)
    const builder = new JSONBuilder(data)
    builder.deleteIn(['prev'])
    expect(builder.build().toString()).toBe(output)
  })
})

test('should delete emoji property', () => {
  const data = Buffer.from(JSON.stringify({ '😄': '😄', '😄2': '😄2' }))
  const builder = new JSONBuilder(data)
  builder.deleteIn(['😄'])
  expect(builder.build().toString()).toBe(`{"😄2":"😄2"}`)
  builder.deleteIn(['😄2'])
  expect(builder.build().toString()).toBe(`{}`)
})

test('should delete property with autoDeleteParentIfEmpty option', () => {
  const data = Buffer.from(JSON.stringify({ versions: { '1.0.0': { name: 'foo' } } }))
  const builder = new JSONBuilder(data)
  builder.deleteIn(['versions', '1.0.0'], { autoDeleteParentIfEmpty: true })
  expect(builder.build().toString()).toBe(`{}`)

  const data2 = Buffer.from(
    JSON.stringify({
      'dist-tags': { latest: '1.0.1' },
      versions: { '1.0.0': { name: 'foo' }, '1.0.1': { name: 'bar' } },
    }),
  )
  const builder2 = new JSONBuilder(data2)
  builder2.deleteIn(['versions', '1.0.0'], { autoDeleteParentIfEmpty: true })
  expect(JSON.parse(builder2.build().toString())).toEqual({
    'dist-tags': { latest: '1.0.1' },
    versions: { '1.0.1': { name: 'bar' } },
  })
  builder2.deleteIn(['versions', '1.0.1'], { autoDeleteParentIfEmpty: true })
  expect(JSON.parse(builder2.build().toString())).toEqual({ 'dist-tags': { latest: '1.0.1' } })
  builder2.deleteIn(['dist-tags', 'latest'], { autoDeleteParentIfEmpty: true })
  expect(JSON.parse(builder2.build().toString())).toEqual({})

  const data3 = Buffer.from(
    JSON.stringify({
      'dist-tags': { latest: '1.0.1' },
      versions: { '1.0.0': { name: 'foo' }, '1.0.1': { name: 'bar' } },
    }),
  )
  const builder3 = new JSONBuilder(data3)
  builder3.deleteIn(['versions'], { autoDeleteParentIfEmpty: true })
  expect(JSON.parse(builder3.build().toString())).toEqual({
    'dist-tags': { latest: '1.0.1' },
  })

  const data4 = Buffer.from(
    JSON.stringify({
      'dist-tags': { latest: '1.0.1' },
      versions: { '1.0.0': { name: 'foo' }, '1.0.1': { name: 'bar' } },
    }),
  )
  const builder4 = new JSONBuilder(data4)
  builder4.deleteIn(['dist-tags', 'latest'], { autoDeleteParentIfEmpty: false })
  expect(JSON.parse(builder4.build().toString())).toEqual({
    'dist-tags': {},
    versions: { '1.0.0': { name: 'foo' }, '1.0.1': { name: 'bar' } },
  })
})
