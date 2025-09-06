import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'

// Components
import Header from './components/Header'
import SwipeCard from './components/SwipeCard'
import AutoControls from './components/AutoControls'
import ConstraintsPanel from './components/ConstraintsPanel'
import VenueStats from './components/VenueStats'
import FeasibilityBanner from './components/FeasibilityBanner'
import LeaderboardModal from './components/LeaderboardModal'
import SettingsModal from './components/SettingsModal'
import ResultModal from './components/ResultModal'
import Toasts from './components/Toasts'

// Hooks and utilities
import { useLocalStorage } from './hooks/useLocalStorage'
import { useKeyboard } from './hooks/useKeyboard'
import { useToast } from './hooks/useToast'
import { api } from './lib/api'

// Types
import type { 
  GameState, 
  RunSummary, 
  NextPerson, 
  ProfileResponse, 
  AppSettings,
  DecisionStrategy 
} from './types'

const DEFAULT_SETTINGS: AppSettings = {
  displayName: '',
  sounds: false,
  autoRunDelayMs: 200,
  confirmBeforeNewGame: true,
  theme: 'dark'
}

export default function App() {
  // Core state
  const [gameState, setGameState] = useState<GameState>('idle')
  const [scenario, setScenario] = useState<1 | 2 | 3>(3)
  const [run, setRun] = useState<RunSummary | null>(null)
  const [nextPerson, setNextPerson] = useState<NextPerson | null>(null)
  const [admittedByAttribute, setAdmittedByAttribute] = useState<Record<string, number>>({})

  // Profile and settings
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [settings, setSettings] = useLocalStorage('berghain-v2-settings', DEFAULT_SETTINGS)

  // Auto-run state
  const [autoStrategy, setAutoStrategy] = useState<DecisionStrategy>('greedy_tightness')
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Loading states
  const [isManualLoading, setIsManualLoading] = useState(false)

  // Modal states
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual')
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [feasibilityDismissed, setFeasibilityDismissed] = useState(false)

  // State persistence
  const [persistedState, setPersistedState] = useLocalStorage('berghain-v2-game-state', {
    runId: null as string | null,
    gameState: 'idle' as GameState,
    scenario: 3 as 1 | 2 | 3,
    nextPerson: null as NextPerson | null,
    admittedByAttribute: {} as Record<string, number>
  })

  // Toast notifications
  const { toasts, showToast, dismissToast } = useToast()

  // Load profile on mount (only once)
  useEffect(() => {
    api.getProfile()
      .then(setProfile)
      .catch(error => {
        console.error('Failed to load profile:', error)
        showToast('Failed to load profile', 'error')
      })
  }, [showToast])

  // Restore persisted state on mount (only once)
  useEffect(() => {
    if (persistedState.runId && persistedState.gameState !== 'idle') {
      setScenario(persistedState.scenario)
      
      // Try to restore the run
      api.getRun(persistedState.runId)
        .then((runData) => {
          setRun(runData)
          
          // Restore the persisted person and attribute data directly
          setNextPerson(persistedState.nextPerson)
          setAdmittedByAttribute(persistedState.admittedByAttribute)
          
          // Restore the exact game state
          setGameState(persistedState.gameState)
          showToast('Session restored', 'info')
        })
        .catch(error => {
          console.error('Failed to restore run:', error)
          // Clear invalid persisted state
          setPersistedState({ 
            runId: null, 
            gameState: 'idle', 
            scenario: 3,
            nextPerson: null,
            admittedByAttribute: {}
          })
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Persist state changes
  useEffect(() => {
    if (run) {
      setPersistedState({
        runId: run.id,
        gameState,
        scenario,
        nextPerson,
        admittedByAttribute
      })
    } else if (gameState === 'idle') {
      setPersistedState({ 
        runId: null, 
        gameState: 'idle', 
        scenario,
        nextPerson: null,
        admittedByAttribute: {}
      })
    }
  }, [run, gameState, scenario, nextPerson, admittedByAttribute, setPersistedState])

  // Keyboard shortcuts
  useKeyboard({
    'ArrowLeft': () => {
      if (activeTab === 'manual' && nextPerson && !isAutoRunning) {
        handleManualDecision(false)
      }
    },
    'ArrowRight': () => {
      if (activeTab === 'manual' && nextPerson && !isAutoRunning) {
        handleManualDecision(true)
      }
    },
    ' ': () => {
      if (isAutoRunning) {
        handleStopAuto()
      } else if (nextPerson && gameState === 'manualReady') {
        handleStartAuto()
      }
    },
    '?': () => {
      showToast('← Reject | → Accept | Space Pause/Resume | ? Help', 'info', 5000)
    },
    'a': () => {
      if (activeTab === 'manual' && nextPerson && !isAutoRunning) {
        handleManualDecision(true)
      }
    },
    'r': () => {
      if (activeTab === 'manual' && nextPerson && !isAutoRunning) {
        handleManualDecision(false)
      }
    }
  }, gameState !== 'idle')

  // Auto-run cleanup
  useEffect(() => {
    return () => {
      setIsAutoRunning(false)
      if (autoIntervalRef.current) {
        autoIntervalRef.current = null
      }
    }
  }, [])

  // Handle new game
  const handleNewGame = useCallback(async () => {
    if (settings.confirmBeforeNewGame && gameState !== 'idle') {
      if (!window.confirm('Start a new game? This will end the current run.')) {
        return
      }
    }

    try {
      setGameState('newGame')
      const newRun = await api.newRun(scenario)
      setRun(newRun)
      setNextPerson(null)
      setAdmittedByAttribute({})
      setFeasibilityDismissed(false)
      
      // Automatically fetch the first person
      const response = await api.step(newRun.id, { personIndex: 0 })
      setRun(response.run)
      setNextPerson(response.nextPerson || null)
      if (response.admittedByAttribute) {
        setAdmittedByAttribute(response.admittedByAttribute)
      }
      setGameState('manualReady')
      showToast('New game started!', 'success')
    } catch (error) {
      console.error('Failed to create new run:', error)
      showToast('Failed to start new game', 'error')
      setGameState('idle')
    }
  }, [scenario, settings.confirmBeforeNewGame, gameState, showToast])


  // Handle manual decision
  const handleManualDecision = useCallback(async (accept: boolean) => {
    if (!run || !nextPerson || isManualLoading) return

    setIsManualLoading(true)
    try {
      const response = await api.step(run.id, {
        personIndex: nextPerson.personIndex,
        accept
      })

      setRun(response.run)
      setNextPerson(response.nextPerson || null)
      if (response.admittedByAttribute) {
        setAdmittedByAttribute(response.admittedByAttribute)
      }

      // Check for completion
      if (response.run.status === 'completed' || response.run.status === 'failed') {
        setGameState(response.run.status)
        setShowResult(true)
        
        // Record completion
        try {
          await api.completeRun(run.id)
        } catch (error) {
          console.error('Failed to record completion:', error)
        }
      } else if (!response.nextPerson) {
        setGameState('completed')
        setShowResult(true)
      }

      showToast(accept ? 'Accepted' : 'Rejected', accept ? 'success' : 'warning', 1000)
    } catch (error) {
      console.error('Failed to make decision:', error)
      showToast('Failed to make decision', 'error')
    } finally {
      setIsManualLoading(false)
    }
  }, [run, nextPerson, isManualLoading, showToast])

  // Auto-run logic with proper async handling
  const handleStartAuto = useCallback(() => {
    if (!run || !nextPerson || isAutoRunning) return

    setIsAutoRunning(true)
    setActiveTab('auto')
    
    const autoStepLoop = async () => {
      let currentRun = run
      let currentPerson: NextPerson | null = nextPerson

      while (isAutoRunning && currentRun && currentPerson) {
        try {
          const response = await api.autoStep(currentRun.id, {
            personIndex: currentPerson.personIndex,
            strategy: autoStrategy,
            delayMs: settings.autoRunDelayMs
          })

          // Update state
          setRun(response.run)
          setNextPerson(response.nextPerson || null)
          if (response.admittedByAttribute) {
            setAdmittedByAttribute(response.admittedByAttribute)
          }

          currentRun = response.run
          currentPerson = response.nextPerson || null

          // Check for completion
          if (response.run.status === 'completed' || response.run.status === 'failed') {
            setIsAutoRunning(false)
            setGameState(response.run.status)
            setShowResult(true)
            
            // Record completion
            try {
              await api.completeRun(currentRun.id)
            } catch (error) {
              console.error('Failed to record completion:', error)
            }
            return
          }

          if (!response.nextPerson) {
            setIsAutoRunning(false)
            setGameState('completed')
            setShowResult(true)
            return
          }

          // Wait for the specified delay before next step
          await new Promise(resolve => setTimeout(resolve, settings.autoRunDelayMs))

        } catch (error) {
          console.error('Auto-step failed:', error)
          setIsAutoRunning(false)
          showToast('Auto-run failed', 'error')
          return
        }

        // Check if auto-run was stopped during the delay
        if (!autoIntervalRef.current || !isAutoRunning) {
          return
        }
      }
    }

    // Store the promise reference to allow cancellation
    autoIntervalRef.current = autoStepLoop() as any
  }, [run, nextPerson, autoStrategy, settings.autoRunDelayMs, showToast, isAutoRunning])

  const handleStopAuto = useCallback(() => {
    setIsAutoRunning(false)
    if (autoIntervalRef.current) {
      // The ref contains a promise in the new implementation
      autoIntervalRef.current = null
    }
    showToast('Auto-run paused', 'info')
  }, [showToast])

  // Handle scenario change
  const handleScenarioChange = useCallback((newScenario: number) => {
    setScenario(newScenario as 1 | 2 | 3)
    if (gameState !== 'idle') {
      setGameState('idle')
      setRun(null)
      setNextPerson(null)
      setAdmittedByAttribute({})
      handleStopAuto()
    }
  }, [gameState, handleStopAuto])

  // Copy game ID
  const handleCopyGameId = useCallback(() => {
    if (run?.gameId) {
      navigator.clipboard.writeText(run.gameId)
        .then(() => showToast('Game ID copied!', 'success'))
        .catch(() => showToast('Failed to copy Game ID', 'error'))
    }
  }, [run?.gameId, showToast])

  const isManualTabDisabled = isAutoRunning

  return (
    <div className="min-h-screen bg-berghain-dark text-gray-100 flex flex-col">
      {/* Header */}
      <Header
        profile={profile}
        scenario={scenario}
        onScenarioChange={handleScenarioChange}
        gameId={run?.gameId}
        gameState={gameState}
        onNewGame={handleNewGame}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenSettings={() => setShowSettings(true)}
        onCopyGameId={handleCopyGameId}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Pane */}
        <div className="w-1/2 p-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setActiveTab('auto')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'auto'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Automatic
            </button>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'manual' && (
              <SwipeCard
                person={nextPerson}
                scenario={scenario}
                disabled={isManualTabDisabled}
                loading={isManualLoading}
                onAccept={() => handleManualDecision(true)}
                onReject={() => handleManualDecision(false)}
              />
            )}

            {activeTab === 'auto' && (
              <AutoControls
                strategy={autoStrategy}
                onStrategyChange={setAutoStrategy}
                isRunning={isAutoRunning}
                onToggle={isAutoRunning ? handleStopAuto : handleStartAuto}
                delayMs={settings.autoRunDelayMs}
                disabled={!nextPerson}
              />
            )}
          </motion.div>
        </div>

        {/* Right Pane */}
        <div className="w-1/2 p-6 space-y-6">
          {/* Feasibility Banner */}
          {run && (
            <FeasibilityBanner
              constraints={run.constraints}
              admittedByAttribute={admittedByAttribute}
              admittedCount={run.admittedCount}
              capacityRequired={run.capacityRequired}
              onDismiss={() => setFeasibilityDismissed(true)}
              isDismissed={feasibilityDismissed}
            />
          )}

          {/* Venue Stats */}
          {run && (
            <VenueStats
              admitted={run.admittedCount}
              rejected={run.rejectedCount}
              capacity={run.capacityRequired}
              status={run.status}
            />
          )}

          {/* Constraints */}
          {run && (
            <ConstraintsPanel
              constraints={run.constraints}
              admittedByAttribute={admittedByAttribute}
              capacityRequired={run.capacityRequired}
              admittedCount={run.admittedCount}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        onProfileUpdate={setProfile}
        settings={settings}
        onSettingsChange={setSettings}
        currentRunId={run?.id}
      />

      <ResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        success={gameState === 'completed' && (run?.admittedCount || 0) >= (run?.capacityRequired || 0)}
        admittedCount={run?.admittedCount || 0}
        rejectedCount={run?.rejectedCount || 0}
        capacityRequired={run?.capacityRequired || 0}
        onNewGame={() => {
          setShowResult(false)
          handleNewGame()
        }}
        onOpenLeaderboard={() => {
          setShowResult(false)
          setShowLeaderboard(true)
        }}
      />

      {/* Toasts */}
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
