import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Modal from './Modal'
import Button from './Button'
import { api } from '../lib/api'
import type { LeaderboardEntry } from '../types'

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard()
    }
  }, [isOpen])

  const loadLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getLeaderboard()
      setEntries(response.entries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Leaderboard" size="lg">
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-300">Loading leaderboard...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4">
            <div className="text-red-100">Error: {error}</div>
            <Button onClick={loadLeaderboard} size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400">No completed runs yet</div>
            <div className="text-sm text-gray-500 mt-2">
              Complete a scenario to appear on the leaderboard!
            </div>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Scenarios
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Rejections
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Completion
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Run
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {entries.map((entry, index) => (
                  <motion.tr
                    key={entry.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-berghain-dark transition-colors"
                  >
                    <td className="py-3 px-2 text-sm">
                      <div className="flex items-center">
                        {index < 3 && (
                          <span className="mr-2">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                          </span>
                        )}
                        <span className="font-mono text-gray-300">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm font-medium text-gray-100">
                      {entry.name}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-300">
                      {entry.scenarios_completed}
                    </td>
                    <td className="py-3 px-2 text-sm font-mono text-gray-300">
                      {entry.total_rejections}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-400">
                      {formatDate(entry.last_completion)}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {entry.best_run_id && (
                        <button 
                          onClick={() => console.log('TODO: View run', entry.best_run_id)}
                          className="text-green-400 hover:text-green-300 transition-colors text-xs"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between">
          <Button onClick={loadLeaderboard} variant="ghost" size="sm">
            Refresh
          </Button>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
