import React from 'react'
import { motion } from 'framer-motion'
import Button from './Button'
import { DECISION_STRATEGIES, type DecisionStrategy } from '../types'

interface AutoControlsProps {
  strategy: DecisionStrategy
  onStrategyChange: (strategy: DecisionStrategy) => void
  isRunning: boolean
  onToggle: () => void
  delayMs: number
  disabled?: boolean
}

export default function AutoControls({
  strategy,
  onStrategyChange,
  isRunning,
  onToggle,
  delayMs,
  disabled = false
}: AutoControlsProps) {
  return (
    <motion.div 
      className="bg-berghain-grey rounded-lg border border-gray-700 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Automatic Mode</h3>
      
      {/* Strategy Selector */}
      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-2">Decision Strategy</label>
        <select
          value={strategy}
          onChange={(e) => onStrategyChange(e.target.value as DecisionStrategy)}
          disabled={disabled || isRunning}
          className="w-full bg-berghain-dark border border-gray-600 rounded px-3 py-2 text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {DECISION_STRATEGIES.map((strat) => (
            <option key={strat.value} value={strat.value}>
              {strat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Controls */}
      <div className="mb-6">
        <Button
          onClick={onToggle}
          variant={isRunning ? 'danger' : 'success'}
          disabled={disabled}
          className="w-full"
        >
          {isRunning ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause Auto
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
              </svg>
              Start Auto
            </>
          )}
        </Button>
      </div>

      {/* Delay Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Delay</span>
          <span className="text-gray-100 font-mono">{delayMs}ms</span>
        </div>
      </div>

      {/* Status */}
      {isRunning && (
        <div className="bg-green-900 bg-opacity-50 border border-green-700 rounded-lg p-3">
          <div className="flex items-center text-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm">Auto-run active</span>
          </div>
          <div className="text-xs text-green-300 mt-1">
            Manual controls are locked
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="text-xs text-gray-400">
          Auto-run will make decisions automatically using the selected strategy.
        </div>
      )}
    </motion.div>
  )
}
