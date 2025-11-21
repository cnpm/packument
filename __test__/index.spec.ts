import fs from 'node:fs'
import path from 'node:path'

import { test, expect } from 'vitest'

import { Package } from '../index'

const fixtures = path.join(import.meta.dirname, 'fixtures')

test('create package metadata instance from buffer', () => {
  const data = fs.readFileSync(path.join(fixtures, 'a.json'))
  const pkg = new Package(data)
  // console.log(pkg);
  expect(pkg.name).toBe('a')
  expect(pkg.description).toBe('Mocking framework')
  // t.is(pkg.readme, 'Mocking framework');
  // console.log(pkg.readme);
  expect(pkg.readme).toBeTruthy()
  expect(pkg.readme).toMatch(/The mocking framework can be used in any JavaScript testing framework/)
  const readmePosition = pkg.readmePosition
  // console.log(readmePosition);
  const readme = JSON.parse(data.subarray(readmePosition![0], readmePosition![1]).toString())
  expect(readme).toBe(pkg.readme)
  expect(readmePosition).toEqual([100992, 119796])
  expect(pkg.time).toBeTruthy()
  // console.log(pkg.time);
  expect(pkg.time?.modified).toBe('2025-07-31T11:36:55.508Z')
  expect(pkg.isUnpublished).toBe(false)

  // console.log(pkg.versions);
  expect(pkg.getLatestVersion()).matchSnapshot()
})

test('should throw error when data is not a valid package metadata', () => {
  expect(() => {
    new Package(Buffer.from('invalid'))
  }).toThrow(/Invalid JSON value at line 1 column 1/)
})
