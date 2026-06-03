/**
 * KeyboardShortcutProvider Context
 * 
 * Global context for managing keyboard shortcuts across the POS application.
 * Provides methods for registering/unregistering shortcuts, managing the help overlay,
 * and maintaining a registry of all active shortcuts.
 * 
 * Features:
 * - Dynamic shortcut registration and unregistration
 * - Help overlay state management
 * - Shortcut registry with priority-based conflict resolution
 * - Automatic cleanup on unmount
 * 
 * @module KeyboardShortcutProvider
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import type { KeyboardShortcutContextValue, KeyboardShortcut, ShortcutRegistry, ShortcutRegistryEntry } from '@presentation/hooks/types'

/**
 * Create the KeyboardShortcut context
 */
const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | undefined>(undefined)

/**
 * Props for KeyboardShortcutProvider component
 */
interface KeyboardShortcutProviderProps {
  children: ReactNode
}

/**
 * KeyboardShortcutProvider component
 * 
 * Wraps the application to provide global keyboard shortcut management capabilities.
 * Should be placed at the root level of the application, typically before or alongside
 * other context providers.
 * 
 * @example
 * ```tsx
 * <KeyboardShortcutProvider>
 *   <FocusManagerProvider>
 *     <POSPage />
 *   </FocusManagerProvider>
 * </KeyboardShortcutProvider>
 * ```
 */
export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  // State for help overlay visibility
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // State for shortcuts registry to trigger re-renders
  const [shortcutRegistry, setShortcutRegistry] = useState<ShortcutRegistry>({})

  // Counter for priority assignment (higher = more recent = higher priority)
  const priorityCounterRef = useRef(0)

  /**
   * Register a new keyboard shortcut
   * 
   * If a shortcut with the same key already exists, it will be replaced.
   * Returns a cleanup function that unregisters the shortcut when called.
   * 
   * @param shortcut - The keyboard shortcut to register
   * @returns Cleanup function to unregister the shortcut
   * 
   * @example
   * ```tsx
   * const cleanup = registerShortcut({
   *   key: 'F1',
   *   description: 'Focus search input',
   *   category: 'search',
   *   handler: () => searchInputRef.current?.focus(),
   * })
   * 
   * // Later, unregister the shortcut
   * cleanup()
   * ```
   */
  const registerShortcut = useCallback((shortcut: KeyboardShortcut): (() => void) => {
    // Create registry entry with priority and timestamp
    const entry: ShortcutRegistryEntry = {
      shortcut,
      priority: priorityCounterRef.current++,
      registeredAt: Date.now()
    }

    // Update registry state
    setShortcutRegistry((prev) => ({
      ...prev,
      [shortcut.key]: entry
    }))

    // Return cleanup function
    return () => {
      unregisterShortcut(shortcut.key)
    }
  }, [])

  /**
   * Unregister a keyboard shortcut by key
   * 
   * If the shortcut doesn't exist, this is a no-op.
   * 
   * @param key - The key of the shortcut to unregister
   * 
   * @example
   * ```tsx
   * unregisterShortcut('F1')
   * ```
   */
  const unregisterShortcut = useCallback((key: string): void => {
    setShortcutRegistry((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  /**
   * Toggle the help overlay visibility
   * 
   * @example
   * ```tsx
   * toggleHelp() // Opens help if closed, closes if open
   * ```
   */
  const toggleHelp = useCallback(() => {
    setIsHelpOpen((prev) => !prev)
  }, [])

  /**
   * Get all currently registered shortcuts as an array
   * Sorted by priority (most recent first)
   */
  const allShortcuts = Object.values(shortcutRegistry)
    .sort((a, b) => b.priority - a.priority)
    .map((entry) => entry.shortcut)

  const value: KeyboardShortcutContextValue = {
    registerShortcut,
    unregisterShortcut,
    isHelpOpen,
    toggleHelp,
    allShortcuts
  }

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  )
}

/**
 * Hook to use the KeyboardShortcut context
 * 
 * @returns The KeyboardShortcut context value
 * @throws Error if used outside of KeyboardShortcutProvider
 * 
 * @example
 * ```tsx
 * const { registerShortcut, toggleHelp, allShortcuts } = useKeyboardShortcuts()
 * ```
 */
export function useKeyboardShortcutContext(): KeyboardShortcutContextValue {
  const context = useContext(KeyboardShortcutContext)

  if (!context) {
    throw new Error('useKeyboardShortcutContext must be used within a KeyboardShortcutProvider')
  }

  return context
}

export default KeyboardShortcutProvider
