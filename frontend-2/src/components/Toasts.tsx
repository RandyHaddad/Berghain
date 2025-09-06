import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Toast } from '../hooks/useToast'

interface ToastsProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export default function Toasts({ toasts, onDismiss }: ToastsProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className={`
              px-4 py-3 rounded-lg shadow-lg border cursor-pointer max-w-sm
              ${toast.type === 'success' ? 'bg-green-900 border-green-700 text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-900 border-red-700 text-red-100' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-900 border-yellow-700 text-yellow-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-900 border-blue-700 text-blue-100' : ''}
            `}
            onClick={() => onDismiss(toast.id)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(toast.id)
                }}
                className="ml-3 text-lg leading-none opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
