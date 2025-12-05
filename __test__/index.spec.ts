import fs from 'node:fs'
import path from 'node:path'

import { test, expect } from 'vitest'

import { Package } from '../js/index.js'

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

test('should detect unpublished package', () => {
  const data = fs.readFileSync(path.join(fixtures, 'unpublished.json'))
  let pkg = new Package(data)
  expect(pkg.isUnpublished).toBe(true)
  pkg = new Package(Buffer.from('{}'))
  expect(pkg.isUnpublished).toBe(false)
  pkg = new Package(Buffer.from('{"time": {}}'))
  expect(pkg.isUnpublished).toBe(false)
  pkg = new Package(Buffer.from('{"time": {"unpublished": "2022-01-14T12:34:23.941Z"}}'))
  expect(pkg.isUnpublished).toBe(true)
  pkg = new Package(
    Buffer.from('{"time": {"unpublished": {"time": "2022-01-14T12:34:23.941Z", "versions": ["0.0.1"]}}}'),
  )
  expect(pkg.isUnpublished).toBe(true)
  pkg = new Package(Buffer.from('{"time": {"unpublished": null}}'))
  expect(pkg.isUnpublished).toBe(false)
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

test('should get dist-tags', () => {
  const data = fs.readFileSync(path.join(fixtures, 'obug.json'))
  const pkg = new Package(data)
  expect(pkg.distTags).matchSnapshot()
})

test('should get dist-tags with invalid data', () => {
  let pkg = new Package(Buffer.from('{}'))
  expect(pkg.distTags).toBeNull()
  pkg = new Package(Buffer.from('{"dist-tags": null}'))
  expect(pkg.distTags).toBeNull()
  pkg = new Package(Buffer.from('{"dist-tags": {}}'))
  expect(pkg.distTags).toEqual({})
  pkg = new Package(Buffer.from('{"dist-tags": []}'))
  expect(pkg.distTags).toEqual({})
})

test('should get maintainers', () => {
  const data = fs.readFileSync(path.join(fixtures, 'obug.json'))
  const pkg = new Package(data)
  expect(pkg.maintainers).matchSnapshot()
})

test('should get maintainers with invalid data', () => {
  let pkg = new Package(Buffer.from('{}'))
  expect(pkg.maintainers).toBeNull()
  pkg = new Package(Buffer.from('{"maintainers": null}'))
  expect(pkg.maintainers).toBeNull()
  pkg = new Package(Buffer.from('{"maintainers": {"name": "test"}}'))
  expect(pkg.maintainers).toEqual([])
  pkg = new Package(Buffer.from('{"maintainers": {}}'))
  expect(pkg.maintainers).toEqual([])
  pkg = new Package(Buffer.from('{"maintainers": []}'))
  expect(pkg.maintainers).toEqual([])
})

test('should get repository from fixture', () => {
  const data = fs.readFileSync(path.join(fixtures, 'obug.json'))
  const pkg = new Package(data)
  expect(pkg.repository).matchSnapshot()
})

test('should get repository from string', () => {
  const pkg = new Package(Buffer.from('{"repository": "https://github.com/sxzz/obug.git"}'))
  expect(pkg.repository).matchSnapshot()
})

test('should get repository from object', () => {
  const pkg = new Package(Buffer.from('{"repository": {"type": "git", "url": "https://github.com/sxzz/obug.git"}}'))
  expect(pkg.repository).matchSnapshot()
})

test('should get repository with invalid data', () => {
  let pkg = new Package(Buffer.from('{}'))
  expect(pkg.repository).toBeNull()
  pkg = new Package(Buffer.from('{"repository": null}'))
  expect(pkg.repository).toBeNull()
  pkg = new Package(Buffer.from('{"repository": {}}'))
  expect(pkg.repository).toEqual({})
  pkg = new Package(Buffer.from('{"repository": []}'))
  expect(pkg.repository).toBeNull()
  pkg = new Package(Buffer.from('{"repository": 1}'))
  expect(pkg.repository).toBeNull()
})

test('should getIn work correctly', () => {
  const data = fs.readFileSync(path.join(fixtures, 'obug.json'))
  const pkg = new Package(data)
  expect(pkg.getIn(['versions', '1.0.0', 'name'])).toEqual('obug')
  expect(pkg.getIn(['versions', '1.0.0'])).toMatchSnapshot()
})

test('should throw error when get in with invalid paths', () => {
  expect(() => new Package(Buffer.from('{}')).getIn([])).toThrow(/paths should not be empty array/)
})
