import { useState } from 'react'
import Button from './Button'
import type { ProfileResponse, GameState } from '../types'

interface HeaderProps {
  profile: ProfileResponse | null
  scenario: number
  onScenarioChange: (scenario: number) => void
  gameId?: string
  gameState: GameState
  onNewGame: () => void
  onOpenLeaderboard: () => void
  onOpenSettings: () => void
  onCopyGameId: () => void
}

export default function Header({
  profile,
  scenario,
  onScenarioChange,
  gameId,
  gameState,
  onNewGame,
  onOpenLeaderboard,
  onOpenSettings,
  onCopyGameId
}: HeaderProps) {
  const [scenarioConfirm, setScenarioConfirm] = useState<number | null>(null)

  const handleScenarioChange = (newScenario: number) => {
    if (gameState !== 'idle' && newScenario !== scenario) {
      setScenarioConfirm(newScenario)
    } else {
      onScenarioChange(newScenario)
    }
  }

  const confirmScenarioChange = () => {
    if (scenarioConfirm) {
      onScenarioChange(scenarioConfirm)
      setScenarioConfirm(null)
    }
  }


  return (
    <header className="bg-berghain-grey border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Scenario Select */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Scenario</label>
            <select
              value={scenario}
              onChange={(e) => handleScenarioChange(Number(e.target.value))}
              className="bg-berghain-dark border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          {/* New Game */}
          <Button
            onClick={onNewGame}
            size="sm"
            variant="primary"
          >
            New Game
          </Button>


          {/* Game ID */}
          {gameId && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Game ID:</span>
              <code className="text-xs text-gray-300 font-mono bg-berghain-dark px-2 py-1 rounded">
                {gameId.slice(0, 4)}…{gameId.slice(-5)}
              </code>
              <button
                onClick={onCopyGameId}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                title="Copy full Game ID"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Temporary Reload Button */}
          <Button
            onClick={() => console.log('TODO: Reload runs')}
            size="sm"
            variant="ghost"
          >
            Reload Runs
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Leaderboard */}
          <Button
            onClick={onOpenLeaderboard}
            size="sm"
            variant="ghost"
          >
            Leaderboard
          </Button>

          {/* Settings */}
          <Button
            onClick={onOpenSettings}
            size="sm"
            variant="ghost"
          >
            Settings
          </Button>

          {/* Display Name */}
          <button
            onClick={onOpenSettings}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            {profile?.display_name || 'Guest'}
          </button>
        </div>
      </div>

      {/* Scenario Change Confirmation */}
      {scenarioConfirm && (
        <div className="mt-4 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-yellow-100 text-sm">
              Changing scenario will end the current run. Continue?
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={confirmScenarioChange}
                size="sm"
                variant="primary"
              >
                Yes
              </Button>
              <Button
                onClick={() => setScenarioConfirm(null)}
                size="sm"
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
