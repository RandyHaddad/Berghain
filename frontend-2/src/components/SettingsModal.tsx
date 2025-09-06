import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'
import { api } from '../lib/api'
import type { AppSettings, ProfileResponse } from '../types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileResponse | null
  onProfileUpdate: (profile: ProfileResponse) => void
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
  currentRunId?: string
}

export default function SettingsModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
  settings,
  onSettingsChange,
  currentRunId
}: SettingsModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name)
    }
  }, [profile])

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      setNameError('Display name cannot be empty')
      return
    }

    setIsUpdatingName(true)
    setNameError('')

    try {
      const updated = await api.updateDisplayName(displayName.trim())
      onProfileUpdate(updated)
      setNameError('')
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        setNameError('Display name already taken')
      } else {
        setNameError('Failed to update display name')
      }
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleExportRun = async () => {
    if (!currentRunId) return

    setIsExporting(true)
    try {
      const blob = await api.exportRun(currentRunId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `berghain-run-${currentRunId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-berghain-dark border border-gray-600 rounded px-3 py-2 text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter display name"
            />
            <Button
              onClick={handleUpdateName}
              loading={isUpdatingName}
              disabled={!displayName.trim() || displayName === profile?.display_name}
              size="sm"
            >
              Update
            </Button>
          </div>
          {nameError && (
            <div className="mt-1 text-sm text-red-400">{nameError}</div>
          )}
        </div>

        {/* Audio Settings */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.sounds}
              onChange={(e) => updateSetting('sounds', e.target.checked)}
              className="w-4 h-4 text-green-600 bg-berghain-dark border-gray-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-300">Enable sounds</span>
          </label>
        </div>

        {/* Auto-run Delay */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Auto-run Delay: {settings.autoRunDelayMs}ms
          </label>
          <input
            type="range"
            min="50"
            max="1000"
            step="10"
            value={settings.autoRunDelayMs}
            onChange={(e) => updateSetting('autoRunDelayMs', Number(e.target.value))}
            className="w-full h-2 bg-berghain-dark rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>50ms</span>
            <span>1000ms</span>
          </div>
        </div>

        {/* Confirm New Game */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.confirmBeforeNewGame}
              onChange={(e) => updateSetting('confirmBeforeNewGame', e.target.checked)}
              className="w-4 h-4 text-green-600 bg-berghain-dark border-gray-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-300">Confirm before starting new game</span>
          </label>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark')}
            className="w-full bg-berghain-dark border border-gray-600 rounded px-3 py-2 text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        {/* Export Current Run */}
        {currentRunId && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export Current Run
            </label>
            <Button
              onClick={handleExportRun}
              loading={isExporting}
              variant="secondary"
              size="sm"
            >
              Download JSON
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
