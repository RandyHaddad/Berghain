import React from 'react'

const STRATEGIES = [
  { value: 'greedy_tightness', label: 'Greedy Tightness' },
  { value: 'expected_feasible', label: 'Expected Feasible Guard' },
  { value: 'risk_adjusted_feasible', label: 'Risk-adjusted Feasible' },
  { value: 'proportional_control', label: 'Proportional Control' },
  { value: 'lookahead_1', label: 'Lookahead-1 (expected slack)' },
]

export default function StrategyControls({ running, onToggle, disabled, strategy, onStrategyChange }: { running: boolean; onToggle: () => void; disabled?: boolean; strategy: string; onStrategyChange: (s: string) => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-medium">Auto-run</div>
          <select
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            value={strategy}
            onChange={(e) => onStrategyChange(e.target.value)}
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <button
          className={`px-3 py-1 rounded ${running ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'} disabled:opacity-50`}
          onClick={onToggle}
          disabled={disabled}
        >
          {running ? 'Stop Auto' : 'Start Auto'}
        </button>
      </div>
      <div className="text-xs text-gray-400 mt-2">Client loops calls to /auto-step with small delay.</div>
    </div>
  )
}
