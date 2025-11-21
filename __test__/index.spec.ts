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

test('should get latest version', () => {
  const data = fs.readFileSync(path.join(fixtures, 'npm.json'))
  const pkg = new Package(data)
  expect(pkg.getLatestVersion()).matchSnapshot()
})

test('should get dist.attestations and dist.provenance', () => {
  const data = fs.readFileSync(path.join(fixtures, 'obug.json'))
  const pkg = new Package(data)
  expect(pkg.getLatestVersion()!.dist).matchSnapshot()
})

test('should get diff versions', () => {
  const data = fs.readFileSync(path.join(fixtures, 'obug.json'))
  const pkg = new Package(data)
  const diff = pkg.diff(['1.0.0', '1.0.1', '10000000.222.111'])
  // sort the diff by version, make sure snapshot is stable
  diff.addedVersions.sort((a, b) => a[0].localeCompare(b[0]))
  diff.removedVersions.sort()
  expect(diff).matchSnapshot()
  const [version, position] = diff.addedVersions[0]
  const firstVersionData = JSON.parse(data.subarray(position[0], position[1]).toString())
  expect(version).toBe(firstVersionData.version)
  expect(firstVersionData).matchSnapshot()
})
