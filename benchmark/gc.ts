import { PerformanceObserver, constants } from 'perf_hooks'

const gcStats = {
  totalGCDuration: 0, // ms
  count: 0,
  byKind: {
    scavenge: 0, // minor GC
    markSweepCompact: 0, // major GC
    incremental: 0,
    weakc: 0,
    unknown: 0,
  },
}

// kind meaning: https://nodejs.org/api/perf_hooks.html#performancegc_kind
// 1: scavenge
// 2: mark-sweep-compact
// 4: incremental
// 8: weak callbacks
function kindToString(kind: number) {
  switch (kind) {
    case constants.NODE_PERFORMANCE_GC_MAJOR:
      return 'markSweepCompact'
    case constants.NODE_PERFORMANCE_GC_MINOR:
      return 'scavenge'
    case constants.NODE_PERFORMANCE_GC_INCREMENTAL:
      return 'incremental'
    case constants.NODE_PERFORMANCE_GC_WEAKCB:
      return 'weakc'
    default:
      return 'unknown'
  }
}

const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries()
  for (const entry of entries) {
    gcStats.totalGCDuration += entry.duration
    gcStats.count += 1

    const kind = kindToString(entry.kind)
    if (!gcStats.byKind[kind]) gcStats.byKind[kind] = 0
    gcStats.byKind[kind] += entry.duration
  }
})

obs.observe({ entryTypes: ['gc'] })

// for other modules to use
export function getGCStats() {
  return {
    totalGCDuration: gcStats.totalGCDuration,
    count: gcStats.count,
    avgDuration: gcStats.count ? gcStats.totalGCDuration / gcStats.count : 0,
    byKind: { ...gcStats.byKind },
  }
}
