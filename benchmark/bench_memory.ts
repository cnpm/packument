import path from 'node:path'

import { runMemoryBenchmarks } from './memory_usage.ts'

const runner = process.version.startsWith('v20.') ? 'npx tsx' : 'node'

const getDescriptionScript = path.join(import.meta.dirname, 'get_description.ts')
const getDescriptionScriptBenchmarks = [
  { parser: 'JSONParse', size: '22M', file: 'npm.json' },
  { parser: 'JSONParse', size: '89M', file: '@primer/react.json' },
  { parser: 'SonicJSONParse', size: '22M', file: 'npm.json' },
  { parser: 'SonicJSONParse', size: '89M', file: '@primer/react.json' },
]

// await runMemoryBenchmarks(
//   getDescriptionScriptBenchmarks.map(({ parser, size, file }) => ({
//     name: `${parser} description (${size})`,
//     command: `${runner} ${getDescriptionScript} ${parser} ${file}`,
//     prepare: '',
//   })),
// )

const addVersionScript = path.join(import.meta.dirname, 'add_version.ts')
const addVersionScriptBenchmarks = [
  { parser: 'JSONParse', size: '22M', file: 'npm.json' },
  { parser: 'JSONParse', size: '89M', file: '@primer/react.json' },
  { parser: 'SonicJSONParse', size: '22M', file: 'npm.json' },
  { parser: 'SonicJSONParse', size: '89M', file: '@primer/react.json' },
]
await runMemoryBenchmarks(
  addVersionScriptBenchmarks.map(({ parser, size, file }) => ({
    name: `${parser} add version (${size})`,
    command: `${runner} ${addVersionScript} ${parser} ${file}`,
    prepare: '',
  })),
)
