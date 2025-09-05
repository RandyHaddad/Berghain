import React from 'react'

export default function VenueOverview({
  admitted,
  rejected,
  capacity,
  efficiency,
  status,
}: {
  admitted: number
  rejected: number
  capacity: number
  efficiency: number
  status: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-400 text-sm">Status</div>
          <div className="font-medium">{status}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Admitted</div>
          <div className="font-medium">{admitted}/{capacity}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Rejected</div>
          <div className="font-medium">{rejected}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Efficiency</div>
          <div className="font-medium">{(efficiency * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

