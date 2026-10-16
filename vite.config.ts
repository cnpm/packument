import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['js/index.ts', 'js/package.ts', 'js/builder.ts'],
    outDir: 'js',
    // Sources and emitted files share this directory; only remove build output.
    clean: ['js/*.js', 'js/*.d.ts'],
    unbundle: true,
    format: 'esm',
    fixedExtension: false,
    target: 'es2022',
    dts: true,
    // napi owns the native loader and its declarations.
    deps: { neverBundle: ['../index.js'] },
    inputOptions: {
      resolve: { extensionAlias: { '.js': ['.ts', '.js'] } },
    },
  },
  lint: {
    // Keep the existing lint scope: the handwritten library wrapper.
    ignorePatterns: ['__test__/**', 'benchmark/**', 'index.js', 'index.d.ts', 'wasi-*.mjs'],
    jsPlugins: ['@e18e/eslint-plugin', { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'e18e/prefer-array-at': 'error',
      'e18e/prefer-array-fill': 'error',
      'e18e/prefer-includes': 'error',
      'e18e/prefer-nullish-coalescing': 'error',
      'e18e/prefer-object-has-own': 'error',
      'e18e/prefer-url-canparse': 'error',
      'e18e/prefer-array-from-map': 'error',
      'e18e/prefer-timer-args': 'error',
      'e18e/prefer-date-now': 'error',
      'e18e/prefer-regex-test': 'error',
      'e18e/prefer-array-some': 'error',
      'e18e/prefer-static-regex': 'error',
      'e18e/prefer-string-fromcharcode': 'error',
    },
    overrides: [
      {
        files: ['**/*.spec.ts'],
        rules: {
          'e18e/prefer-static-regex': 'off',
        },
      },
    ],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    printWidth: 120,
    semi: false,
    trailingComma: 'all',
    singleQuote: true,
    arrowParens: 'always',
    sortPackageJson: false,
    ignorePatterns: [
      // Preserve fixture bytes; Rust and TOML use cargo fmt and Taplo.
      '__test__/fixtures/**',
      '**/*.toml',
      'target',
      '.yarn',
      'index.js',
      'index.d.ts',
      'package-template.wasi-browser.js',
      'package-template.wasi.cjs',
      'wasi-worker-browser.mjs',
      'wasi-worker.mjs',
      '.yarnrc.yml',
    ],
  },
  staged: {
    '*.@(js|ts|tsx)': 'vp lint --fix',
    '*.@(js|ts|tsx|yml|yaml|md|json)': 'vp fmt',
    '*.toml': 'taplo format',
    '*.rs': 'cargo fmt --',
  },
})
