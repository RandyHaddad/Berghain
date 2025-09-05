import React from 'react'
import { NextPerson } from '../lib/types'

export default function PersonCard({ person }: { person: NextPerson }) {
  return (
    <div className="border border-gray-800 rounded p-3">
      <div className="text-sm text-gray-400">Person #{person.personIndex}</div>
      <div className="grid grid-cols-2 gap-1 mt-2 text-sm">
        {Object.entries(person.attributes).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between bg-gray-800/50 rounded px-2 py-1">
            <span className="text-gray-300">{k}</span>
            <span className={v ? 'text-emerald-400' : 'text-rose-400'}>{v ? 'Yes' : 'No'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

