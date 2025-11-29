# `@cnpmjs/packument`

[![CI](https://github.com/cnpm/packument/actions/workflows/CI.yml/badge.svg)](https://github.com/cnpm/packument/actions/workflows/CI.yml)
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

### Node.js v24.11.1 Result

```bash
┌─────────┬──────────────────────────────────────────────────────────────────────┬─────────────────────┬───────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                                            │ Latency avg (ns)    │ Latency med (ns)      │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────────────────────────────────────────────────┼─────────────────────┼───────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data readme string (117KB)'                         │ '266169 ± 1.79%'    │ '256167 ± 6458.0'     │ '3880 ± 0.22%'         │ '3904 ± 98'            │ 3758    │
│ 1       │ 'sonic-rs small data readme string (117KB)'                          │ '96116 ± 0.18%'     │ '93959 ± 3334.0'      │ '10449 ± 0.11%'        │ '10643 ± 392'          │ 10405   │
│ 2       │ 'sonic-rs small data readme string with position (117KB)'            │ '104260 ± 0.18%'    │ '101875 ± 3541.0'     │ '9636 ± 0.12%'         │ '9816 ± 349'           │ 9592    │
│ 3       │ 'sonic-rs small data readme JSON buffer with position (117KB)'       │ '80798 ± 0.10%'     │ '78125 ± 1250.0'      │ '12415 ± 0.09%'        │ '12800 ± 202'          │ 12377   │
│ 4       │ 'JSONParse large data readme string (22MB)'                          │ '61213649 ± 0.46%'  │ '60913854 ± 457520'   │ '16 ± 0.46%'           │ '16 ± 0'               │ 64      │
│ 5       │ 'sonic-rs large data readme string (22MB)'                           │ '14408984 ± 0.77%'  │ '14446271 ± 314188'   │ '69 ± 0.77%'           │ '69 ± 2'               │ 70      │
│ 6       │ 'sonic-rs large data readme string with position (22MB)'             │ '14422542 ± 0.82%'  │ '14286833 ± 445437'   │ '69 ± 0.81%'           │ '70 ± 2'               │ 70      │
│ 7       │ 'sonic-rs large data readme JSON buffer with position (22MB)'        │ '14601161 ± 0.90%'  │ '14690709 ± 292041'   │ '69 ± 0.90%'           │ '68 ± 1'               │ 69      │
│ 8       │ 'JSONParse super large data readme string (89M)'                     │ '156435868 ± 1.25%' │ '152015667 ± 2226000' │ '6 ± 1.21%'            │ '7 ± 0'                │ 64      │
│ 9       │ 'sonic-rs super large data readme string (89M)'                      │ '52196231 ± 0.78%'  │ '51696729 ± 991125'   │ '19 ± 0.77%'           │ '19 ± 0'               │ 64      │
│ 10      │ 'sonic-rs super large data readme string with position (89M)'        │ '52017035 ± 0.87%'  │ '51689855 ± 1427041'  │ '19 ± 0.86%'           │ '19 ± 1'               │ 64      │
│ 11      │ 'sonic-rs super large data readme JSON buffer with position (89M)'   │ '52177505 ± 0.85%'  │ '51624876 ± 1226542'  │ '19 ± 0.83%'           │ '19 ± 0'               │ 64      │
│ 12      │ 'JSONParse big readme string (229KB, 64KB readme)'                   │ '335244 ± 1.66%'    │ '323958 ± 6624.0'     │ '3071 ± 0.26%'         │ '3087 ± 63'            │ 2983    │
│ 13      │ 'sonic-rs big readme string (229KB, 64KB readme)'                    │ '146211 ± 0.21%'    │ '147375 ± 4500.0'     │ '6867 ± 0.13%'         │ '6785 ± 209'           │ 6840    │
│ 14      │ 'sonic-rs big readme string with position (229KB, 64KB readme)'      │ '173274 ± 0.19%'    │ '173729 ± 5771.0'     │ '5791 ± 0.14%'         │ '5756 ± 192'           │ 5772    │
│ 15      │ 'sonic-rs big readme JSON buffer with position (229KB, 64KB readme)' │ '126633 ± 0.13%'    │ '127208 ± 5292.0'     │ '7922 ± 0.12%'         │ '7861 ± 331'           │ 7897    │
└─────────┴──────────────────────────────────────────────────────────────────────┴─────────────────────┴───────────────────────┴────────────────────────┴────────────────────────┴─────────┘

Memory Usage:
  JSONParse description (22M): 478.1 MB (min: 477.9 MB, max: 478.5 MB)
  JSONParse description (89M): 792.1 MB (min: 791.5 MB, max: 792.9 MB)
  SonicJSONParse description (22M): 91.4 MB (min: 91.2 MB, max: 91.6 MB)
  SonicJSONParse description (89M): 158.5 MB (min: 158.3 MB, max: 158.6 MB)
```

### Node.js v22.21.1 Result

```bash
┌─────────┬──────────────────────────────────────────────────────────────────────┬─────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                                            │ Latency avg (ns)    │ Latency med (ns)       │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────────────────────────────────────────────────┼─────────────────────┼────────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data readme string (117KB)'                         │ '248949 ± 0.99%'    │ '238125 ± 8542.0'      │ '4146 ± 0.33%'         │ '4199 ± 151'           │ 4017    │
│ 1       │ 'sonic-rs small data readme string (117KB)'                          │ '96073 ± 0.29%'     │ '91542 ± 1167.0'       │ '10498 ± 0.14%'        │ '10924 ± 141'          │ 10409   │
│ 2       │ 'sonic-rs small data readme string with position (117KB)'            │ '106362 ± 0.33%'    │ '101667 ± 3125.0'      │ '9514 ± 0.17%'         │ '9836 ± 312'           │ 9402    │
│ 3       │ 'sonic-rs small data readme JSON buffer with position (117KB)'       │ '80189 ± 0.11%'     │ '77417 ± 500.00'       │ '12514 ± 0.10%'        │ '12917 ± 84'           │ 12471   │
│ 4       │ 'JSONParse large data readme string (22MB)'                          │ '74725439 ± 5.11%'  │ '65167479 ± 2361458'   │ '14 ± 4.53%'           │ '15 ± 1'               │ 64      │
│ 5       │ 'sonic-rs large data readme string (22MB)'                           │ '14298166 ± 0.70%'  │ '14189291 ± 172062'    │ '70 ± 0.66%'           │ '70 ± 1'               │ 70      │
│ 6       │ 'sonic-rs large data readme string with position (22MB)'             │ '14494829 ± 1.09%'  │ '14322083 ± 302250'    │ '69 ± 1.01%'           │ '70 ± 1'               │ 70      │
│ 7       │ 'sonic-rs large data readme JSON buffer with position (22MB)'        │ '14345457 ± 0.73%'  │ '14255708 ± 186354'    │ '70 ± 0.70%'           │ '70 ± 1'               │ 70      │
│ 8       │ 'JSONParse super large data readme string (89M)'                     │ '161558691 ± 2.89%' │ '168895375 ± 15843625' │ '6 ± 2.65%'            │ '6 ± 1'                │ 64      │
│ 9       │ 'sonic-rs super large data readme string (89M)'                      │ '51225944 ± 0.52%'  │ '51134480 ± 577354'    │ '20 ± 0.50%'           │ '20 ± 0'               │ 64      │
│ 10      │ 'sonic-rs super large data readme string with position (89M)'        │ '50900172 ± 0.48%'  │ '50671208 ± 589959'    │ '20 ± 0.47%'           │ '20 ± 0'               │ 64      │
│ 11      │ 'sonic-rs super large data readme JSON buffer with position (89M)'   │ '51286851 ± 0.50%'  │ '51228125 ± 562354'    │ '20 ± 0.49%'           │ '20 ± 0'               │ 64      │
│ 12      │ 'JSONParse big readme string (229KB, 64KB readme)'                   │ '320480 ± 0.93%'    │ '308959 ± 9709.0'      │ '3201 ± 0.36%'         │ '3237 ± 102'           │ 3121    │
│ 13      │ 'sonic-rs big readme string (229KB, 64KB readme)'                    │ '147998 ± 0.26%'    │ '148125 ± 5292.0'      │ '6799 ± 0.15%'         │ '6751 ± 244'           │ 6757    │
│ 14      │ 'sonic-rs big readme string with position (229KB, 64KB readme)'      │ '172298 ± 0.29%'    │ '169063 ± 8354.5'      │ '5849 ± 0.19%'         │ '5915 ± 294'           │ 5804    │
│ 15      │ 'sonic-rs big readme JSON buffer with position (229KB, 64KB readme)' │ '125021 ± 0.14%'    │ '124000 ± 6459.0'      │ '8027 ± 0.13%'         │ '8065 ± 422'           │ 7999    │
└─────────┴──────────────────────────────────────────────────────────────────────┴─────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┴─────────┘

Memory Usage:
  JSONParse description (22M): 397.4 MB (min: 397.2 MB, max: 397.9 MB)
  JSONParse description (89M): 583.3 MB (min: 582.6 MB, max: 584.2 MB)
  SonicJSONParse description (22M): 88.4 MB (min: 88.2 MB, max: 88.9 MB)
  SonicJSONParse description (89M): 155.4 MB (min: 155.2 MB, max: 155.5 MB)
```

### Node.js 20.19.5 Result

```bash
$ npx tsx benchmark/bench.ts

┌─────────┬──────────────────────────────────────────────────────────────────────┬─────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                                            │ Latency avg (ns)    │ Latency med (ns)       │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────────────────────────────────────────────────┼─────────────────────┼────────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data readme string (117KB)'                         │ '282642 ± 0.87%'    │ '272875 ± 8667.0'      │ '3626 ± 0.33%'         │ '3665 ± 115'           │ 3539    │
│ 1       │ 'sonic-rs small data readme string (117KB)'                          │ '97086 ± 0.17%'     │ '96416 ± 5042.0'       │ '10353 ± 0.12%'        │ '10372 ± 537'          │ 10301   │
│ 2       │ 'sonic-rs small data readme string with position (117KB)'            │ '106532 ± 0.49%'    │ '105209 ± 5584.0'      │ '9486 ± 0.15%'         │ '9505 ± 509'           │ 9387    │
│ 3       │ 'sonic-rs small data readme JSON buffer with position (117KB)'       │ '81501 ± 0.11%'     │ '79625 ± 2708.0'       │ '12312 ± 0.10%'        │ '12559 ± 442'          │ 12270   │
│ 4       │ 'JSONParse large data readme string (22MB)'                          │ '81700227 ± 3.67%'  │ '74035333 ± 1724355'   │ '12 ± 3.35%'           │ '14 ± 0'               │ 64      │
│ 5       │ 'sonic-rs large data readme string (22MB)'                           │ '14406041 ± 0.58%'  │ '14339813 ± 245083'    │ '69 ± 0.57%'           │ '70 ± 1'               │ 70      │
│ 6       │ 'sonic-rs large data readme string with position (22MB)'             │ '14373543 ± 0.47%'  │ '14350042 ± 98937'     │ '70 ± 0.46%'           │ '70 ± 0'               │ 70      │
│ 7       │ 'sonic-rs large data readme JSON buffer with position (22MB)'        │ '14372198 ± 0.52%'  │ '14351229 ± 96354'     │ '70 ± 0.52%'           │ '70 ± 0'               │ 70      │
│ 8       │ 'JSONParse super large data readme string (89M)'                     │ '192673340 ± 1.78%' │ '201564354 ± 19275396' │ '5 ± 1.75%'            │ '5 ± 1'                │ 64      │
│ 9       │ 'sonic-rs super large data readme string (89M)'                      │ '51303309 ± 0.60%'  │ '51097167 ± 809375'    │ '20 ± 0.59%'           │ '20 ± 0'               │ 64      │
│ 10      │ 'sonic-rs super large data readme string with position (89M)'        │ '51120106 ± 0.44%'  │ '50995396 ± 506500'    │ '20 ± 0.43%'           │ '20 ± 0'               │ 64      │
│ 11      │ 'sonic-rs super large data readme JSON buffer with position (89M)'   │ '51319434 ± 0.44%'  │ '51296937 ± 428146'    │ '19 ± 0.43%'           │ '19 ± 0'               │ 64      │
│ 12      │ 'JSONParse big readme string (229KB, 64KB readme)'                   │ '339916 ± 0.59%'    │ '331250 ± 6375.0'      │ '2985 ± 0.33%'         │ '3019 ± 58'            │ 2942    │
│ 13      │ 'sonic-rs big readme string (229KB, 64KB readme)'                    │ '145951 ± 0.21%'    │ '147000 ± 4167.0'      │ '6881 ± 0.14%'         │ '6803 ± 193'           │ 6852    │
│ 14      │ 'sonic-rs big readme string with position (229KB, 64KB readme)'      │ '171549 ± 0.22%'    │ '170541 ± 7417.0'      │ '5858 ± 0.16%'         │ '5864 ± 248'           │ 5830    │
│ 15      │ 'sonic-rs big readme JSON buffer with position (229KB, 64KB readme)' │ '125563 ± 0.19%'    │ '125875 ± 5500.0'      │ '7994 ± 0.12%'         │ '7944 ± 345'           │ 7965    │
└─────────┴──────────────────────────────────────────────────────────────────────┴─────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┴─────────┘

Memory Usage:
  JSONParse description (22M): 406.0 MB (min: 392.1 MB, max: 498.3 MB)
  JSONParse description (89M): 659.6 MB (min: 594.5 MB, max: 987.7 MB)
  SonicJSONParse description (22M): 179.7 MB (min: 177.0 MB, max: 181.3 MB)
  SonicJSONParse description (89M): 179.3 MB (min: 175.2 MB, max: 181.8 MB)
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
