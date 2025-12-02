import path from 'node:path'
import { test, expect } from 'vitest'

import { JSONBuilder } from '../js/index.js'
import fs from 'node:fs'

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
