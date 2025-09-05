import React from 'react'

export default function PlaybackControls({ runId, onReload }: { runId: string; onReload: () => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Replay</div>
        <div className="flex gap-2">
          <a
            className="px-3 py-1 bg-gray-800 rounded border border-gray-700"
            href={`/api/runs/${runId}/export`}
            target="_blank"
          >
            Export JSON
          </a>
          <button className="px-3 py-1 bg-gray-800 rounded border border-gray-700" onClick={onReload}>
            Reload Events
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2">Simple export and reload. Step-through UI can be expanded.</div>
    </div>
  )
}

