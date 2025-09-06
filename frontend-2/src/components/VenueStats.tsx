import React from 'react'
import { motion } from 'framer-motion'

interface VenueStatsProps {
  admitted: number
  rejected: number
  capacity: number
  status: string
}

export default function VenueStats({ admitted, rejected, capacity, status }: VenueStatsProps) {
  const total = admitted + rejected
  const remaining = Math.max(0, capacity - admitted)
  const efficiency = total > 0 ? admitted / total : 0

  const stats = [
    {
      label: 'Status',
      value: status.charAt(0).toUpperCase() + status.slice(1),
      className: 'text-gray-100'
    },
    {
      label: 'Admitted',
      value: `${admitted}/${capacity}`,
      className: 'text-green-400'
    },
    {
      label: 'Rejected',
      value: rejected.toString(),
      className: 'text-red-400'
    },
    {
      label: 'Remaining',
      value: remaining.toString(),
      className: 'text-yellow-400'
    },
    {
      label: 'Efficiency',
      value: `${(efficiency * 100).toFixed(1)}%`,
      className: efficiency > 0.8 ? 'text-green-400' : efficiency > 0.6 ? 'text-yellow-400' : 'text-red-400'
    }
  ]

  return (
    <motion.div 
      className="bg-berghain-grey rounded-lg border border-gray-700 p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Venue Stats</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {stat.label}
            </div>
            <div className={`text-lg font-semibold font-mono ${stat.className}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress visualization */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Progress</span>
          <span>{admitted} / {capacity}</span>
        </div>
        <div className="h-2 bg-berghain-dark rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-600 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${capacity > 0 ? (admitted / capacity) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
}
