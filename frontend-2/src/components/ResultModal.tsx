import React from 'react'
import { motion } from 'framer-motion'
import Modal from './Modal'
import Button from './Button'

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  success: boolean
  admittedCount: number
  rejectedCount: number
  capacityRequired: number
  onNewGame: () => void
  onOpenLeaderboard: () => void
}

export default function ResultModal({
  isOpen,
  onClose,
  success,
  admittedCount,
  rejectedCount,
  capacityRequired,
  onNewGame,
  onOpenLeaderboard
}: ResultModalProps) {
  const efficiency = (admittedCount + rejectedCount) > 0 
    ? admittedCount / (admittedCount + rejectedCount) 
    : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center space-y-6">
        {/* Icon and Title */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          {success ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-400">Venue Filled!</h2>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-2xl font-bold text-red-400">Run Failed</h2>
            </>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-berghain-dark rounded-lg p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{admittedCount}</div>
              <div className="text-sm text-gray-400">Admitted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
              <div className="text-sm text-gray-400">Rejected</div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-100">
                {(efficiency * 100).toFixed(1)}% Efficiency
              </div>
              <div className="text-sm text-gray-400">
                {admittedCount} / {capacityRequired} capacity filled
              </div>
            </div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-300"
        >
          {success ? (
            <p>Congratulations! You successfully filled the venue while meeting all constraints.</p>
          ) : (
            <p>The run ended before reaching capacity. Try a different strategy next time.</p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center space-x-4"
        >
          <Button onClick={onNewGame} variant="primary">
            New Game
          </Button>
          <Button onClick={onOpenLeaderboard} variant="secondary">
            Leaderboard
          </Button>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </motion.div>
      </div>
    </Modal>
  )
}
