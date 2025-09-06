import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Constraint } from '../types'

interface FeasibilityBannerProps {
  constraints: Constraint[]
  admittedByAttribute: Record<string, number>
  admittedCount: number
  capacityRequired: number
  onDismiss: () => void
  isDismissed: boolean
}

export default function FeasibilityBanner({
  constraints,
  admittedByAttribute,
  admittedCount,
  capacityRequired,
  onDismiss,
  isDismissed
}: FeasibilityBannerProps) {
  if (isDismissed) return null

  const remainingSlots = Math.max(0, capacityRequired - admittedCount)
  
  // Check if any constraint is infeasible
  const infeasibleConstraints = constraints.filter(constraint => {
    const current = admittedByAttribute[constraint.attribute] || 0
    const deficit = Math.max(0, constraint.minCount - current)
    return deficit > remainingSlots
  })

  const shouldShow = infeasibleConstraints.length > 0

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h4 className="text-red-100 font-semibold">Infeasible Constraints</h4>
              </div>
              <div className="text-red-200 text-sm">
                The following constraints cannot be satisfied with {remainingSlots} remaining slots:
              </div>
              <ul className="mt-2 space-y-1">
                {infeasibleConstraints.map(constraint => {
                  const current = admittedByAttribute[constraint.attribute] || 0
                  const deficit = constraint.minCount - current
                  return (
                    <li key={constraint.attribute} className="text-red-200 text-sm">
                      • <span className="font-mono">{constraint.attribute}</span>: needs {deficit} more, but only {remainingSlots} slots remain
                    </li>
                  )
                })}
              </ul>
            </div>
            <button
              onClick={onDismiss}
              className="text-red-300 hover:text-red-100 transition-colors ml-4"
              title="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
