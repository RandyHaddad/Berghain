import React from 'react'
import { motion } from 'framer-motion'
import type { Constraint } from '../types'

interface ConstraintsPanelProps {
  constraints: Constraint[]
  admittedByAttribute: Record<string, number>
  capacityRequired: number
  admittedCount: number
}

export default function ConstraintsPanel({ 
  constraints, 
  admittedByAttribute, 
  capacityRequired, 
  admittedCount 
}: ConstraintsPanelProps) {
  return (
    <motion.div 
      className="bg-berghain-grey rounded-lg border border-gray-700 p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Constraints</h3>
      
      <div className="space-y-4">
        {constraints.map((constraint) => {
          const current = admittedByAttribute[constraint.attribute] || 0
          const progress = constraint.minCount > 0 ? Math.min(1, current / constraint.minCount) : 1
          const remaining = Math.max(0, capacityRequired - admittedCount)
          const deficit = Math.max(0, constraint.minCount - current)
          const tightness = remaining > 0 ? deficit / remaining : 0
          const isInfeasible = remaining < deficit

          return (
            <div key={constraint.attribute} className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono text-gray-200">
                    {constraint.attribute.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-gray-400 ml-2">min {constraint.minCount}</span>
                </div>
                <div className="text-gray-300">
                  {current}/{constraint.minCount}
                  {isInfeasible && (
                    <span className="text-red-400 ml-2 text-xs">(infeasible)</span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-berghain-dark rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Tightness */}
              <div className="text-xs text-gray-500">
                tightness: {tightness.toFixed(3)}
              </div>
            </div>
          )
        })}
      </div>

      {constraints.length === 0 && (
        <div className="text-gray-400 text-sm text-center py-4">
          No constraints defined
        </div>
      )}
    </motion.div>
  )
}
