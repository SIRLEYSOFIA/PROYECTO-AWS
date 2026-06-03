/**
 * KeyboardShortcutsHelp Component
 * 
 * Overlay displaying available keyboard shortcuts grouped by category.
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
 */

import React, { useEffect } from 'react'
import type { KeyboardShortcut } from '@presentation/hooks/types'
import './KeyboardShortcutsHelp.css'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}

const CATEGORIES = ['search', 'cart', 'payment', 'navigation'] as const

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Group shortcuts by category
  const groupedShortcuts = CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = shortcuts.filter((s) => s.category === category)
      return acc
    },
    {} as Record<typeof CATEGORIES[number], KeyboardShortcut[]>
  )

  return (
    <div className="keyboard-shortcuts-help-overlay" onClick={onClose} data-testid="shortcuts-help">
      <div className="keyboard-shortcuts-help" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            className="shortcuts-close"
            onClick={onClose}
            aria-label="Close shortcuts help"
            title="Press Escape to close"
          >
            ✕
          </button>
        </div>

        <div className="shortcuts-content">
          {CATEGORIES.map((category) => {
            const categoryShortcuts = groupedShortcuts[category]
            if (categoryShortcuts.length === 0) return null

            return (
              <div key={category} className="shortcuts-category">
                <h3 className="shortcuts-category-title">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className="shortcuts-list">
                  {categoryShortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="shortcut-item">
                      <div className="shortcut-key">
                        <kbd>{shortcut.key}</kbd>
                        {shortcut.ctrlKey && <kbd>Ctrl</kbd>}
                        {shortcut.shiftKey && <kbd>Shift</kbd>}
                        {shortcut.altKey && <kbd>Alt</kbd>}
                      </div>
                      <div className="shortcut-description">{shortcut.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="shortcuts-footer">
          <small>Press <kbd>Escape</kbd> or click outside to close</small>
        </div>
      </div>
    </div>
  )
}
