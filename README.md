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

## Benchmark

```bash
yarn bench
```

Result:

```bash
┌─────────┬─────────────────────────────────────────┬─────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                               │ Latency avg (ns)    │ Latency med (ns)       │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼─────────────────────────────────────────┼─────────────────────┼────────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data (117KB)'          │ '260858 ± 1.35%'    │ '246125 ± 9666.0'      │ '4009 ± 0.37%'         │ '4063 ± 159'           │ 3834    │
│ 1       │ 'SimdJSONParse small data (117KB)'      │ '101456 ± 0.11%'    │ '100375 ± 2166.0'      │ '9882 ± 0.09%'         │ '9963 ± 215'           │ 9857    │
│ 2       │ 'SonicJSONParse small data (117KB)'     │ '67619 ± 1.70%'     │ '66500 ± 1708.0'       │ '14988 ± 0.10%'        │ '15038 ± 386'          │ 14789   │
│ 3       │ 'JSONParse large data (22MB)'           │ '73234865 ± 4.78%'  │ '63961667 ± 1676771'   │ '14 ± 4.23%'           │ '16 ± 0'               │ 64      │
│ 4       │ 'SimdJSONParse large data (22MB)'       │ '24699112 ± 3.91%'  │ '23670855 ± 2177104'   │ '41 ± 3.34%'           │ '42 ± 4'               │ 64      │
│ 5       │ 'SonicJSONParse large data (22MB)'      │ '19220617 ± 4.71%'  │ '18468229 ± 1520750'   │ '53 ± 3.24%'           │ '54 ± 5'               │ 64      │
│ 6       │ 'JSONParse super large data (89M)'      │ '163726416 ± 2.73%' │ '163460396 ± 14716542' │ '6 ± 2.55%'            │ '6 ± 1'                │ 64      │
│ 7       │ 'SimdJSONParse super large data (89M)'  │ '98982360 ± 2.10%'  │ '98220771 ± 3163479'   │ '10 ± 1.68%'           │ '10 ± 0'               │ 64      │
│ 8       │ 'SonicJSONParse super large data (89M)' │ '66498221 ± 2.03%'  │ '66165562 ± 1438646'   │ '15 ± 1.73%'           │ '15 ± 0'               │ 64      │
└─────────┴─────────────────────────────────────────┴─────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┴─────────┘
```

## Ability

### Build

After `yarn build/npm run build` command, you can see `package-template.[darwin|win32|linux].node` file in project root. This is the native addon built from [lib.rs](./src/lib.rs).

### Test

With [ava](https://github.com/avajs/ava), run `yarn test/npm run test` to testing native addon. You can also switch to another testing framework if you want.

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

git push
```

GitHub actions will do the rest job for you.

> WARN: Don't run `npm publish` manually.

## License

[MIT](LICENSE)

## Contributors

[![Contributors](https://contrib.rocks/image?repo=cnpm/packument)](https://github.com/cnpm/packument/graphs/contributors)

Made with [contributors-img](https://contrib.rocks).
