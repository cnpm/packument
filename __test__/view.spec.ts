import fs from 'node:fs'
import path from 'node:path'

import { test, expect, describe } from 'vitest'

import { Package } from '../js/package.js'

const fixtures = path.join(import.meta.dirname, 'fixtures')

describe('getMetaInfo', () => {
  test('should extract all fields from a.json', () => {
    const data = fs.readFileSync(path.join(fixtures, 'a.json'))
    const pkg = new Package(data)
    const meta = pkg.getMetaInfo()

    expect(meta.name).toBe('a')
    expect(meta.description).toBe('Mocking framework')
    expect(meta.readme).toBeTruthy()
    expect(meta.readme).toMatch(/The mocking framework/)
    expect(meta.isUnpublished).toBe(false)
    expect(meta.time).toBeTruthy()
    expect(meta.time?.modified).toBe('2025-07-31T11:36:55.508Z')
    expect(meta.versionKeys).toBeInstanceOf(Array)
    expect(meta.versionKeys.length).toBe(69)
    expect(meta.versionKeys).toContain('0.0.1')
  })

  test('should match individual field accessors', () => {
    const data = fs.readFileSync(path.join(fixtures, 'a.json'))
    const pkg = new Package(data)
    const meta = pkg.getMetaInfo()

    expect(meta.name).toBe(pkg.name)
    expect(meta.description).toBe(pkg.description)
    expect(meta.readme).toBe(pkg.readme)
    expect(meta.isUnpublished).toBe(pkg.isUnpublished)
    expect(meta.maintainers?.length).toBe(pkg.maintainers?.length)

    // time keys should match (order may differ)
    const metaTimeKeys = Object.keys(meta.time ?? {}).sort()
    const pkgTimeKeys = Object.keys(pkg.time ?? {}).sort()
    expect(metaTimeKeys).toEqual(pkgTimeKeys)

    // distTags values should match (order may differ)
    const metaDistTags = meta.distTags ?? {}
    const pkgDistTags = pkg.distTags ?? {}
    for (const [key, val] of Object.entries(pkgDistTags)) {
      expect(metaDistTags[key]).toBe(val)
    }
  })

  test('should detect unpublished package', () => {
    const data = fs.readFileSync(path.join(fixtures, 'unpublished.json'))
    const meta = new Package(data).getMetaInfo()
    expect(meta.isUnpublished).toBe(true)
    expect(meta.time).toBeTruthy()
    expect(meta.time?.created).toBe('2021-10-29T08:21:56.032Z')
  })

  test('should handle unpublished edge cases', () => {
    let meta = new Package(Buffer.from('{}')).getMetaInfo()
    expect(meta.isUnpublished).toBe(false)

    meta = new Package(Buffer.from('{"time": {}}')).getMetaInfo()
    expect(meta.isUnpublished).toBe(false)

    meta = new Package(Buffer.from('{"time": {"unpublished": "2022-01-14T12:34:23.941Z"}}')).getMetaInfo()
    expect(meta.isUnpublished).toBe(true)

    meta = new Package(
      Buffer.from('{"time": {"unpublished": {"time": "2022-01-14T12:34:23.941Z", "versions": ["0.0.1"]}}}'),
    ).getMetaInfo()
    expect(meta.isUnpublished).toBe(true)
  })

  test('should handle repository as string', () => {
    const meta = new Package(Buffer.from('{"repository": "https://github.com/foo/bar"}')).getMetaInfo()
    expect(meta.repository).toBe('https://github.com/foo/bar')
  })

  test('should handle repository as object', () => {
    const meta = new Package(
      Buffer.from('{"repository": {"type": "git", "url": "https://github.com/foo/bar.git"}}'),
    ).getMetaInfo()
    expect(meta.repository).toEqual({ type: 'git', url: 'https://github.com/foo/bar.git' })
  })

  test('should handle repository with invalid data', () => {
    let meta = new Package(Buffer.from('{}')).getMetaInfo()
    expect(meta.repository).toBeUndefined()

    meta = new Package(Buffer.from('{"repository": null}')).getMetaInfo()
    expect(meta.repository).toBeUndefined()

    meta = new Package(Buffer.from('{"repository": 123}')).getMetaInfo()
    expect(meta.repository).toBeUndefined()

    meta = new Package(Buffer.from('{"repository": []}')).getMetaInfo()
    expect(meta.repository).toBeUndefined()
  })

  test('should extract versionKeys from npm.json', () => {
    const data = fs.readFileSync(path.join(fixtures, 'npm.json'))
    const pkg = new Package(data)
    const meta = pkg.getMetaInfo()

    const expectedVersions = Object.keys(pkg.versions)
    expect(meta.versionKeys.length).toBe(expectedVersions.length)
    // Every version key should be present
    for (const ver of expectedVersions) {
      expect(meta.versionKeys).toContain(ver)
    }
  })

  test('should handle empty package', () => {
    const meta = new Package(Buffer.from('{}')).getMetaInfo()
    expect(meta.name).toBeUndefined()
    expect(meta.description).toBeUndefined()
    expect(meta.readme).toBeUndefined()
    expect(meta.repository).toBeUndefined()
    expect(meta.maintainers).toBeUndefined()
    expect(meta.distTags).toBeUndefined()
    expect(meta.time).toBeUndefined()
    expect(meta.isUnpublished).toBe(false)
    expect(meta.versionKeys).toEqual([])
  })

  test('should handle maintainers correctly', () => {
    const meta = new Package(
      Buffer.from('{"maintainers": [{"name": "alice", "email": "alice@example.com"}]}'),
    ).getMetaInfo()
    expect(meta.maintainers).toEqual([{ name: 'alice', email: 'alice@example.com' }])
  })

  test('should handle null maintainers', () => {
    const meta = new Package(Buffer.from('{"maintainers": null}')).getMetaInfo()
    expect(meta.maintainers).toBeUndefined()
  })
})
