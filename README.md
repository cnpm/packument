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
┌─────────┬─────────────────────────────────────────┬─────────────────────┬───────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                               │ Latency avg (ns)    │ Latency med (ns)      │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼─────────────────────────────────────────┼─────────────────────┼───────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data (117KB)'          │ '234077 ± 0.93%'    │ '223000 ± 5542.0'     │ '4393 ± 0.30%'         │ '4484 ± 112'           │ 4273    │
│ 1       │ 'SonicJSONParse small data (117KB)'     │ '61699 ± 0.07%'     │ '60917 ± 167.00'      │ '16231 ± 0.05%'        │ '16416 ± 45'           │ 16208   │
│ 2       │ 'JSONParse large data (22MB)'           │ '70623540 ± 5.05%'  │ '61562229 ± 2125354'  │ '15 ± 4.42%'           │ '16 ± 1'               │ 64      │
│ 3       │ 'SonicJSONParse large data (22MB)'      │ '12553824 ± 4.28%'  │ '12177480 ± 196520'   │ '81 ± 1.92%'           │ '82 ± 1'               │ 80      │
│ 4       │ 'JSONParse super large data (89M)'      │ '154712072 ± 2.50%' │ '145670980 ± 7871438' │ '7 ± 2.44%'            │ '7 ± 0'                │ 64      │
│ 5       │ 'SonicJSONParse super large data (89M)' │ '44102241 ± 0.64%'  │ '43674334 ± 81312'    │ '23 ± 0.60%'           │ '23 ± 0'               │ 64      │
└─────────┴─────────────────────────────────────────┴─────────────────────┴───────────────────────┴────────────────────────┴────────────────────────┴─────────┘

┌─────────┬─────────────────────────────────────────┬─────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                               │ Latency avg (ns)    │ Latency med (ns)       │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼─────────────────────────────────────────┼─────────────────────┼────────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data (117KB)'          │ '240212 ± 0.99%'    │ '229667 ± 8374.0'      │ '4297 ± 0.31%'         │ '4354 ± 157'           │ 4163    │
│ 1       │ 'SimdJSONParse small data (117KB)'      │ '99006 ± 0.11%'     │ '98959 ± 2667.0'       │ '10132 ± 0.11%'        │ '10105 ± 273'          │ 10101   │
│ 2       │ 'SonicJSONParse small data (117KB)'     │ '61006 ± 0.09%'     │ '59958 ± 292.00'       │ '16432 ± 0.07%'        │ '16678 ± 81'           │ 16392   │
│ 3       │ 'JSONParse large data (22MB)'           │ '71175486 ± 4.75%'  │ '62085958 ± 1078521'   │ '15 ± 4.21%'           │ '16 ± 0'               │ 64      │
│ 4       │ 'SimdJSONParse large data (22MB)'       │ '21355649 ± 1.27%'  │ '21161958 ± 187917'    │ '47 ± 0.97%'           │ '47 ± 0'               │ 64      │
│ 5       │ 'SonicJSONParse large data (22MB)'      │ '12398512 ± 0.57%'  │ '12425708 ± 176542'    │ '81 ± 0.55%'           │ '80 ± 1'               │ 81      │
│ 6       │ 'JSONParse super large data (89M)'      │ '158460347 ± 2.56%' │ '159199542 ± 14441521' │ '6 ± 2.48%'            │ '6 ± 1'                │ 64      │
│ 7       │ 'SimdJSONParse super large data (89M)'  │ '96796832 ± 2.39%'  │ '95567833 ± 2567291'   │ '10 ± 2.10%'           │ '10 ± 0'               │ 64      │
│ 8       │ 'SonicJSONParse super large data (89M)' │ '44677622 ± 0.65%'  │ '44483041 ± 514895'    │ '22 ± 0.61%'           │ '22 ± 0'               │ 64      │
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
