import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { imageLoader } from '../lib/imageLoader'
import type { NextPerson } from '../types'

interface SwipeCardProps {
  person: NextPerson | null
  scenario: number
  disabled: boolean
  loading?: boolean
  onAccept: () => void
  onReject: () => void
}

export default function SwipeCard({ person, scenario, disabled, loading = false, onAccept, onReject }: SwipeCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!person) {
      setImageUrl('')
      setImageLoaded(false)
      setImageError(false)
      return
    }

    setImageLoaded(false)
    setImageError(false)

    imageLoader.getImageUrl(scenario, person)
      .then(url => {
        setImageUrl(url)
        // Preload the image
        return imageLoader.preloadImage(url)
      })
      .then(() => {
        setImageLoaded(true)
      })
      .catch(error => {
        console.error('Error loading image:', error)
        setImageError(true)
        setImageLoaded(true) // Show fallback
      })
  }, [person, scenario])

  if (!person) {
    return (
      <div className="bg-berghain-grey rounded-lg border border-gray-700 h-96 flex items-center justify-center">
        <span className="text-gray-400">No person loaded</span>
      </div>
    )
  }

  const isReady = imageLoaded && !disabled && !loading

  return (
    <div className="relative">
      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black bg-opacity-60 z-20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-white font-semibold mb-2">Auto-run Active</div>
            <div className="text-gray-300 text-sm">Manual controls locked</div>
          </div>
        </div>
      )}

      <motion.div 
        className="bg-berghain-grey rounded-lg border border-gray-700 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Image */}
        <div className="relative h-80 bg-berghain-dark aspect-square">
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 skeleton rounded-t-lg"
              />
            )}
          </AnimatePresence>

          {imageUrl && (
            <img
              src={imageUrl}
              alt={`Person ${person.personIndex}`}
              className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* Attributes Panel */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-3 max-w-48">
            <div className="text-xs text-gray-300 mb-2">#{person.personIndex}</div>
            <div className="space-y-1">
              {Object.entries(person.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 truncate mr-2">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={`font-semibold ${value ? 'text-green-400' : 'text-red-400'}`}>
                    {value ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6">
          <div className="flex justify-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onReject}
              disabled={!isReady}
              className={`
                flex items-center justify-center w-16 h-16 rounded-full transition-colors relative
                ${isReady 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onAccept}
              disabled={!isReady}
              className={`
                flex items-center justify-center w-16 h-16 rounded-full transition-colors relative
                ${isReady 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </motion.button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-400">
            <kbd className="px-2 py-1 bg-berghain-dark rounded text-xs mr-2">←</kbd>
            Reject
            <span className="mx-4">|</span>
            <kbd className="px-2 py-1 bg-berghain-dark rounded text-xs mr-2">→</kbd>
            Accept
          </div>
        </div>
      </motion.div>
    </div>
  )
}
