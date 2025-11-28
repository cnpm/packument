// Reference from https://github.com/oxc-project/bench-formatter/blob/main/benchmark.mjs

import { execSync } from 'node:child_process'

// Constants
const KB_TO_MB = 1024
const MEMORY_BENCHMARK_RUNS = 10

// Detect GNU time binary
let gnuTimeBinary = ''
try {
  execSync('gtime --version', { stdio: 'ignore' })
  gnuTimeBinary = 'gtime'
} catch {
  try {
    execSync('/usr/bin/time --version', { stdio: 'ignore' })
    gnuTimeBinary = '/usr/bin/time'
  } catch {
    // GNU time not available, will be checked in main()
  }
}

// Memory measurement function
// Uses GNU time (gtime on macOS, /usr/bin/time on Linux) to measure peak RSS memory.
// gnuTimeBinary is set at module load time from a controlled check.
// Formatter command strings are controlled by us (not user input).
async function measureMemory(name: string, command: string, prepareCmd: string, runs = MEMORY_BENCHMARK_RUNS) {
  const measurements = []

  for (let i = 0; i < runs; i++) {
    // Run prepare command if provided
    if (prepareCmd) {
      try {
        execSync(prepareCmd, { stdio: 'ignore' })
      } catch {
        // Ignore prepare errors
      }
    }

    // Run the command with GNU time to measure memory
    try {
      if (!gnuTimeBinary) {
        // Skip if GNU time is not available
        return null
      }
      const escapedCommand = command.replace(/'/g, "'\\''")
      const output = execSync(`${gnuTimeBinary} -f '%M' sh -c '${escapedCommand}' 2>&1 | tail -1`, {
        encoding: 'utf8',
        stdio: 'pipe',
      })
      const memKB = Number.parseInt(output.trim(), 10)
      if (!isNaN(memKB)) {
        measurements.push(memKB)
      }
    } catch (e) {
      // Continue on error
      console.error(`Error running command: ${command}`)
      console.error(e)
    }
  }

  if (measurements.length === 0) {
    return null
  }

  // Calculate statistics
  measurements.sort((a, b) => a - b)
  const mean = measurements.reduce((a, b) => a + b, 0) / measurements.length
  const min = measurements[0]
  const max = measurements[measurements.length - 1]

  return {
    name,
    mean: (mean / KB_TO_MB).toFixed(1), // Convert to MB
    min: (min / KB_TO_MB).toFixed(1),
    max: (max / KB_TO_MB).toFixed(1),
  }
}

interface Benchmark {
  name: string
  command: string
  prepare: string
}

// Run memory benchmarks
export async function runMemoryBenchmarks(benchmarks: Benchmark[]) {
  // Check if GNU time is available
  if (!gnuTimeBinary) {
    console.warn('Warning: GNU time not found. Memory benchmarking will be skipped.')
    console.warn('Install GNU time to enable memory benchmarking:')
    console.warn('  macOS: brew install gnu-time (installs as gtime)')
    console.warn('  Linux: apt install time or yum install time')
    return []
  }

  console.log('')
  console.log('Memory Usage:')

  const results = []
  for (const bench of benchmarks) {
    const result = await measureMemory(bench.name, bench.command, bench.prepare, MEMORY_BENCHMARK_RUNS)
    if (result) {
      results.push(result)
    }
  }

  // Print results
  for (const result of results) {
    console.log(
      `  ${result.name}: ${result.mean} MB (min: ${result.min} MB, max: ${result.max} MB, mean: ${result.mean} MB)`,
    )
  }

  return results
}
