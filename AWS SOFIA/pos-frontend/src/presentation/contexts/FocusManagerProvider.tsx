/**
 * FocusManagerProvider Context
 * 
 * Global context for managing focus state across the POS application.
 * Provides methods for auto-focusing the search input, saving/restoring focus,
 * and registering focusable elements for keyboard navigation.
 * 
 * Features:
 * - Global search input reference
 * - Focus save/restore for modal workflows
 * - Focusable element registration
 * - Focus history management
 * 
 * @module FocusManagerProvider
 */

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react'
import type { FocusManagerContextValue, FocusHistoryEntry } from '@presentation/hooks/types'

/**
 * Create the FocusManager context
 */
const FocusManagerContext = createContext<FocusManagerContextValue | undefined>(undefined)

/**
 * Props for FocusManagerProvider component
 */
interface FocusManagerProviderProps {
  children: ReactNode
}

/**
 * FocusManagerProvider component
 * 
 * Wraps the application to provide global focus management capabilities.
 * Should be placed at the root level of the application.
 * 
 * @example
 * ```tsx
 * <FocusManagerProvider>
 *   <POSPage />
 * </FocusManagerProvider>
 * ```
 */
export function FocusManagerProvider({ children }: FocusManagerProviderProps) {
  // Reference to the search input element
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus history stack for tracking focus changes
  const focusHistoryRef = useRef<FocusHistoryEntry[]>([])

  // Registry of focusable elements by ID
  const focusableElementsRef = useRef<Map<string, React.RefObject<HTMLElement>>>(new Map())

  /**
   * Focus the search input element
   * Uses requestAnimationFrame for timing coordination
   */
  const focusSearch = useCallback(() => {
    if (!searchInputRef.current) {
      console.warn('FocusManager: Search input ref not set')
      return
    }

    try {
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      })
    } catch (error) {
      console.error('FocusManager: Failed to focus search input', error)
    }
  }, [])

  /**
   * Save the current focused element to history
   * Called before opening modals or changing focus context
   */
  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement

    if (!activeElement || activeElement === document.body) {
      return
    }

    // Determine the context based on the active element
    let context: FocusHistoryEntry['context'] = 'page'
    if (activeElement.closest('[role="dialog"]')) {
      context = 'modal'
    } else if (activeElement.closest('[role="listbox"]')) {
      context = 'dropdown'
    }

    // Add to focus history stack
    focusHistoryRef.current.push({
      elementId: activeElement.id || 'unknown',
      timestamp: Date.now(),
      context
    })

    // Limit history stack size to prevent memory leaks
    if (focusHistoryRef.current.length > 20) {
      focusHistoryRef.current.shift()
    }
  }, [])

  /**
   * Restore focus from history
   * Pops the most recent focus entry and restores focus to that element
   */
  const restoreFocus = useCallback(() => {
    // Pop the most recent focus entry
    const lastFocus = focusHistoryRef.current.pop()

    if (!lastFocus) {
      // No history, fall back to search input
      focusSearch()
      return
    }

    try {
      // Try to find the element by ID
      const element = document.getElementById(lastFocus.elementId)

      if (element && document.contains(element)) {
        requestAnimationFrame(() => {
          if (document.contains(element)) {
            element.focus()
          }
        })
      } else {
        // Element no longer exists, fall back to search input
        focusSearch()
      }
    } catch (error) {
      console.error('FocusManager: Failed to restore focus', error)
      // Fall back to search input on error
      focusSearch()
    }
  }, [focusSearch])

  /**
   * Register a focusable element with an ID
   * Allows tracking of focusable elements for keyboard navigation
   * 
   * @param id - Unique identifier for the focusable element
   * @param ref - React ref to the focusable element
   */
  const registerFocusable = useCallback(
    (id: string, ref: React.RefObject<HTMLElement>) => {
      focusableElementsRef.current.set(id, ref)

      // Return cleanup function
      return () => {
        focusableElementsRef.current.delete(id)
      }
    },
    []
  )

  const value: FocusManagerContextValue = {
    searchInputRef,
    focusSearch,
    saveFocus,
    restoreFocus,
    registerFocusable
  }

  return (
    <FocusManagerContext.Provider value={value}>
      {children}
    </FocusManagerContext.Provider>
  )
}

/**
 * Hook to use the FocusManager context
 * 
 * @returns The FocusManager context value
 * @throws Error if used outside of FocusManagerProvider
 * 
 * @example
 * ```tsx
 * const { focusSearch, saveFocus, restoreFocus } = useFocusManager()
 * ```
 */
export function useFocusManager(): FocusManagerContextValue {
  const context = useContext(FocusManagerContext)

  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManagerProvider')
  }

  return context
}

export default FocusManagerProvider
