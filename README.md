# `@cnpmjs/packument`

![https://github.com/cnpm/packument/actions](https://github.com/cnpm/packument/workflows/CI/badge.svg)
[![Node.js Version](https://img.shields.io/node/v/@cnpmjs/packument.svg?style=flat)](https://nodejs.org/en/download/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/cnpm/packument)
[![NPM Version](https://img.shields.io/npm/v/@cnpmjs/packument)](https://www.npmjs.com/package/@cnpmjs/packument)
[![NPM Downloads](https://img.shields.io/npm/dm/@cnpmjs/packument)](https://www.npmjs.com/package/@cnpmjs/packument)
[![NPM License](https://img.shields.io/npm/l/@cnpmjs/packument)](https://github.com/cnpm/packument/blob/master/LICENSE)

## Install

```bash
yarn add @cnpmjs/packument
```

## Usage

### Basic Usage

```javascript
import { Package } from '@cnpmjs/packument'
import { readFileSync } from 'fs'

// Load package metadata from buffer
const buffer = readFileSync('path/to/package.json')
const pkg = new Package(buffer)

// Get package information
console.log(pkg.name) // Package name
console.log(pkg.description) // Package description
console.log(pkg.readme) // Package readme

// Get latest version
const latestVersion = pkg.getLatestVersion()
console.log(latestVersion)

// Get all versions
const versions = pkg.versions
console.log(versions)
```

### Diff Versions Between Local and Remote

The `diff` method helps you find the difference between local package versions and remote package versions. This is useful for package synchronization scenarios.

```javascript
import { Package } from '@cnpmjs/packument'
import { readFileSync } from 'fs'

// Prepare local and remote package data
const localVersions = ['1.0.0', '1.0.1', '1.0.2']
const remoteBuffer = readFileSync('path/to/remote-package.json')

// Create remote package instance
const remotePkg = new Package(remoteBuffer)

// Find the diff
const diff = remotePkg.diff(localVersions)

console.log(diff.addedVersions) // Versions in remote but not in local
console.log(diff.removedVersions) // Versions in local but not in remote

// Example output:
// {
//   addedVersions: [
//     ['1.1.0', [100992, 119796]],  // [version, [startPos, endPos]]
//     ['1.2.0', [119797, 138592]],
//   ],
//   removedVersions: [
//     '1.0.1',  // This version exists in local but not in remote
//   ]
// }
```

### Extract Version Metadata Using Position

The `addedVersions` array includes position information `(startPos, endPos)` which allows you to extract the raw JSON metadata for each version directly from the buffer without parsing the entire package:

```javascript
const diff = remotePkg.diff(localVersions)

// Extract version metadata from buffer using position
for (const [version, [start, end]] of diff.addedVersions) {
  const versionMetadata = remoteBuffer.subarray(start, end)
  const versionData = JSON.parse(versionMetadata)

  console.log(`Version ${version}:`, versionData)
  // versionData contains: name, version, dist, dependencies, etc.
}
```

This approach is much more efficient than parsing the entire package JSON when you only need specific version metadata.

## Benchmark

```bash
npm run bench
```

Result:

```bash
┌─────────┬──────────────────────────────────────────────────────────────────────┬─────────────────────┬───────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                                            │ Latency avg (ns)    │ Latency med (ns)      │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────────────────────────────────────────────────┼─────────────────────┼───────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data readme string (117KB)'                         │ '239983 ± 0.90%'    │ '229708 ± 7334.0'     │ '4287 ± 0.30%'         │ '4353 ± 141'           │ 4167    │
│ 1       │ 'sonic-rs small data readme string (117KB)'                          │ '91962 ± 0.15%'     │ '91000 ± 333.00'      │ '10904 ± 0.07%'        │ '10989 ± 40'           │ 10875   │
│ 2       │ 'sonic-rs small data readme string with position (117KB)'            │ '100489 ± 0.20%'    │ '99083 ± 334.00'      │ '9994 ± 0.09%'         │ '10093 ± 34'           │ 9952    │
│ 3       │ 'sonic-rs small data readme JSON buffer with position (117KB)'       │ '77909 ± 0.04%'     │ '77333 ± 251.00'      │ '12843 ± 0.04%'        │ '12931 ± 42'           │ 12836   │
│ 4       │ 'JSONParse large data readme string (22MB)'                          │ '73062542 ± 5.30%'  │ '62544063 ± 1231980'  │ '14 ± 4.66%'           │ '16 ± 0'               │ 64      │
│ 5       │ 'sonic-rs large data readme string (22MB)'                           │ '13559412 ± 0.39%'  │ '13531125 ± 124438'   │ '74 ± 0.38%'           │ '74 ± 1'               │ 74      │
│ 6       │ 'sonic-rs large data readme string with position (22MB)'             │ '13704525 ± 0.42%'  │ '13665167 ± 121500'   │ '73 ± 0.42%'           │ '73 ± 1'               │ 73      │
│ 7       │ 'sonic-rs large data readme JSON buffer with position (22MB)'        │ '13794191 ± 0.38%'  │ '13796167 ± 68374'    │ '73 ± 0.38%'           │ '72 ± 0'               │ 73      │
│ 8       │ 'JSONParse super large data readme string (89M)'                     │ '154877875 ± 2.49%' │ '145676145 ± 6952812' │ '7 ± 2.43%'            │ '7 ± 0'                │ 64      │
│ 9       │ 'sonic-rs super large data readme string (89M)'                      │ '49542118 ± 0.37%'  │ '49603208 ± 517938'   │ '20 ± 0.37%'           │ '20 ± 0'               │ 64      │
│ 10      │ 'sonic-rs super large data readme string with position (89M)'        │ '49208003 ± 0.41%'  │ '48979667 ± 421416'   │ '20 ± 0.40%'           │ '20 ± 0'               │ 64      │
│ 11      │ 'sonic-rs super large data readme JSON buffer with position (89M)'   │ '49418123 ± 0.29%'  │ '49411667 ± 383459'   │ '20 ± 0.29%'           │ '20 ± 0'               │ 64      │
│ 12      │ 'JSONParse big readme string (229KB, 64KB readme)'                   │ '308030 ± 0.80%'    │ '299583 ± 8458.0'     │ '3317 ± 0.33%'         │ '3338 ± 94'            │ 3247    │
│ 13      │ 'sonic-rs big readme string (229KB, 64KB readme)'                    │ '141525 ± 0.19%'    │ '137708 ± 3166.5'     │ '7095 ± 0.13%'         │ '7262 ± 171'           │ 7066    │
│ 14      │ 'sonic-rs big readme string with position (229KB, 64KB readme)'      │ '167679 ± 0.20%'    │ '162875 ± 2875.0'     │ '5990 ± 0.15%'         │ '6140 ± 110'           │ 5964    │
│ 15      │ 'sonic-rs big readme JSON buffer with position (229KB, 64KB readme)' │ '122125 ± 0.11%'    │ '118666 ± 1541.0'     │ '8207 ± 0.10%'         │ '8427 ± 111'           │ 8189    │
└─────────┴──────────────────────────────────────────────────────────────────────┴─────────────────────┴───────────────────────┴────────────────────────┴────────────────────────┴─────────┘

Memory Usage:
  JSONParse description (22M): 398.8 MB (min: 398.5 MB, max: 399.0 MB)
  JSONParse description (89M): 583.9 MB (min: 583.2 MB, max: 584.8 MB)
  SonicJSONParse description (22M): 88.4 MB (min: 88.2 MB, max: 88.7 MB)
  SonicJSONParse description (89M): 155.5 MB (min: 155.2 MB, max: 155.6 MB)
```

## Ability

### Build

After `npm run build` command, you can see `packument.[darwin|win32|linux].node` file in project root. This is the native addon built from [lib.rs](./src/lib.rs).

### Test

With [vitest](https://vitest.dev/), run `npm test` to testing native addon.

### CI

With GitHub Actions, each commit and pull request will be built and tested automatically in [`node@20`, `@node22`] x [`macOS`, `Linux`, `Windows`] matrix. You will never be afraid of the native addon broken in these platforms.

### Release

Release native package is very difficult in old days. Native packages may ask developers who use it to install `build toolchain` like `gcc/llvm`, `node-gyp` or something more.

With `GitHub actions`, we can easily prebuild a `binary` for major platforms. And with `N-API`, we should never be afraid of **ABI Compatible**.

The other problem is how to deliver prebuild `binary` to users. Downloading it in `postinstall` script is a common way that most packages do it right now. The problem with this solution is it introduced many other packages to download binary that has not been used by `runtime codes`. The other problem is some users may not easily download the binary from `GitHub/CDN` if they are behind a private network (But in most cases, they have a private NPM mirror).

In this package, we choose a better way to solve this problem. We release different `npm packages` for different platforms. And add it to `optionalDependencies` before releasing the `Major` package to npm.

`NPM` will choose which native package should download from `registry` automatically. You can see [npm](./npm) dir for details. And you can also run `yarn add @napi-rs/package-template` to see how it works.

## Develop requirements

- Install the latest `Rust`
- Install `Node.js@10+` which fully supported `Node-API`
- Install `yarn@1.x`

## Test in local

- yarn
- yarn build
- yarn test

## Release package

Ensure you have set your **NPM_TOKEN** in the `GitHub` project setting.

In `Settings -> Secrets`, add **NPM_TOKEN** into it.

When you want to release the package:

```bash
npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease [--preid=<prerelease-id>] | from-git]

git push origin master --tags
```

GitHub actions will do the rest job for you.

> WARN: Don't run `npm publish` manually.

## License

[MIT](LICENSE)

## Contributors

[![Contributors](https://contrib.rocks/image?repo=cnpm/packument)](https://github.com/cnpm/packument/graphs/contributors)

Made with [contributors-img](https://contrib.rocks).
