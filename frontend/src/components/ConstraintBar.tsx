import React, { useMemo } from 'react'
import { Constraint } from '../lib/types'

export default function ConstraintBar({
  constraint,
  current,
  capacity,
  admitted,
}: {
  constraint: Constraint
  current: number
  capacity: number
  admitted: number
}) {
  const pct = useMemo(() => {
    if (!constraint.minCount) return 1
    return Math.min(1, current / constraint.minCount)
  }, [constraint.minCount, current])
  const remaining = Math.max(0, capacity - admitted)
  const deficit = Math.max(0, constraint.minCount - current)
  const tightness = remaining > 0 ? deficit / Math.max(1, remaining) : 0
  const warn = remaining < deficit

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-mono">{constraint.attribute}</span>
          <span className="text-gray-400"> min {constraint.minCount}</span>
        </div>
        <div className="text-gray-400">
          {current}/{constraint.minCount} {warn ? <span className="text-amber-400">(infeasible)</span> : null}
        </div>
      </div>
      <div className="h-2 bg-gray-800 rounded overflow-hidden mt-1">
        <div
          className="h-2 bg-emerald-600"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">tightness: {tightness.toFixed(3)}</div>
    </div>
  )
}

