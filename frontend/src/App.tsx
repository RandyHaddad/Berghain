import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './lib/api'
import { Constraint, EventOut, NextPerson, RunSummary } from './lib/types'
import PersonCard from './components/PersonCard'
import ConstraintBar from './components/ConstraintBar'
import VenueOverview from './components/VenueOverview'
import StrategyControls from './components/StrategyControls'
import PlaybackControls from './components/PlaybackControls'

function App() {
  const [scenario, setScenario] = useState<number>(1)
  const [run, setRun] = useState<RunSummary | null>(null)
  const [nextPerson, setNextPerson] = useState<NextPerson | null>(null)
  const [events, setEvents] = useState<EventOut[]>([])
  const [loading, setLoading] = useState(false)
  const [auto, setAuto] = useState(false)
  const [strategy, setStrategy] = useState<string>('greedy_tightness')

  const loadEvents = useCallback(async (runId: string) => {
    const page = await api.listEvents(runId, 0, 2000)
    setEvents(page.items)
  }, [])

  const startNew = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.newRun(scenario)
      setRun(r)
      setNextPerson(null)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [scenario])

  const fetchFirst = useCallback(async () => {
    if (!run) return
    const res = await api.step(run.id, { personIndex: 0 })
    setRun(res.run)
    setNextPerson(res.nextPerson || null)
  }, [run])

  const manualDecision = useCallback(
    async (accept: boolean) => {
      if (!run || !nextPerson) return
      const res = await api.step(run.id, {
        personIndex: nextPerson.personIndex,
        accept,
      })
      setRun(res.run)
      setNextPerson(res.nextPerson || null)
      await loadEvents(run.id)
    },
    [run, nextPerson, loadEvents]
  )

  // Auto-run loop
  const autoRef = useRef(auto)
  autoRef.current = auto
  useEffect(() => {
    if (!auto || !run) return
    let cancelled = false
    const tick = async () => {
      if (cancelled || !autoRef.current || !run) return
      try {
        const index = nextPerson ? nextPerson.personIndex : 0
        const res = await api.autoStep(run.id, { personIndex: index, strategy })
        setRun(res.run)
        setNextPerson(res.nextPerson || null)
        await loadEvents(run.id)
        if (res.run.status !== 'running') setAuto(false)
        if (res.run.admittedCount >= res.run.capacityRequired) setAuto(false)
        if (res.run.rejectedCount >= 20000) setAuto(false)
      } catch (e) {
        console.error(e)
        setAuto(false)
      } finally {
        if (!cancelled && autoRef.current) setTimeout(tick, 200)
      }
    }
    setTimeout(tick, 0)
    return () => {
      cancelled = true
    }
  }, [auto, run, nextPerson, loadEvents])

  const countsByAttr = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const ev of events) {
      if (ev.accepted) {
        for (const [k, v] of Object.entries(ev.attributes)) {
          if (v) counts[k] = (counts[k] || 0) + 1
        }
      }
    }
    return counts
  }, [events])

  const efficiency = useMemo(() => {
    if (!run) return 0
    const total = run.admittedCount + run.rejectedCount
    if (total === 0) return 0
    return run.admittedCount / total
  }, [run])

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Berghain Challenge – Control Room</h1>

      <div className="flex items-center gap-2">
        <label>Scenario</label>
        <select
          className="bg-gray-900 border border-gray-700 rounded px-2 py-1"
          value={scenario}
          onChange={(e) => setScenario(Number(e.target.value))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
        <button
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
          disabled={loading}
          onClick={startNew}
        >
          New Game
        </button>
        {run && (
          <button
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded"
            onClick={fetchFirst}
          >
            Fetch First
          </button>
        )}
      </div>

      {run && (
        <>
          <VenueOverview
            admitted={run.admittedCount}
            rejected={run.rejectedCount}
            capacity={run.capacityRequired}
            efficiency={efficiency}
            status={run.status}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded p-3">
                <h2 className="font-medium mb-2">Constraints</h2>
                <div className="space-y-2">
                  {run.constraints.map((c) => (
                    <ConstraintBar
                      key={c.attribute}
                      constraint={c}
                      current={countsByAttr[c.attribute] || 0}
                      capacity={run.capacityRequired}
                      admitted={run.admittedCount}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded p-3">
                <h2 className="font-medium mb-2">Events ({events.length})</h2>
                <div className="max-h-64 overflow-auto text-sm">
                  {events.slice(-50).map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between py-1 border-b border-gray-800">
                      <div>#{ev.personIndex}</div>
                      <div>{ev.accepted ? 'ACCEPT' : 'REJECT'}</div>
                      <div className="text-xs text-gray-400">A:{ev.admittedCount} R:{ev.rejectedCount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded p-3">
                <h2 className="font-medium mb-2">Current Person</h2>
                {nextPerson ? (
                  <>
                    <PersonCard person={nextPerson} />
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded" onClick={() => manualDecision(true)}>
                        Accept (A)
                      </button>
                      <button className="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded" onClick={() => manualDecision(false)}>
                        Reject (R)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">No person loaded.</div>
                )}
              </div>

              <StrategyControls
                running={auto}
                onToggle={() => setAuto((v) => !v)}
                disabled={!run}
                strategy={strategy}
                onStrategyChange={setStrategy}
              />

              <PlaybackControls runId={run.id} onReload={() => loadEvents(run.id)} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
