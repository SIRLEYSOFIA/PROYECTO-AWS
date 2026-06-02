/**
 * useAutoFocus Hook
 * 
 * Manages intelligent focus restoration and auto-focus behavior for keyboard-first interaction.
 * Maintains a focus history stack and provides methods to save/restore focus state.
 * 
 * Features:
 * - Auto-focus on mount with configurable delay
 * - Focus history stack for restoration
 * - requestAnimationFrame timing coordination
 * - Enabled flag for conditional focusing
 * - Modal close focus restoration
 * 
 * @module useAutoFocus
 */

import { useEffect, useRef, useCallback } from 'react'
import type { AutoFocusConfig, UseAutoFocusReturn, FocusHistory } from './types'

/**
 * Hook for managing auto-focus and focus restoration
 * 
 * @param config - Configuration options for auto-focus behavior
 * @returns Methods to control focus behavior
 * 
 * @example
 * ```tsx
 * const searchInputRef = useRef<HTMLInputElement>(null)
 * const { focus, saveFocus, restoreFocus } = useAutoFocus({
 *   targetRef: searchInputRef,
 *   enabled: true,
 *   restoreOnModalClose: true,
 *   delay: 0
 * })
 * 
 * // Before opening modal
 * saveFocus()
 * 
 * // After closing modal
 * restoreFocus()
 * ```
 */
export function useAutoFocus(config: AutoFocusConfig): UseAutoFocusReturn {
  const {
    targetRef,
    enabled = true,
    restoreOnModalClose = true,
    delay = 0
  } = config

  // Focus history stack (stores previously focused elements)
  const focusHistoryRef = useRef<FocusHistory[]>([])
  
  // Track if component is mounted to prevent focus after unmount
  const isMountedRef = useRef(true)

  /**
   * Focus the target element with timing coordination
   * Uses requestAnimationFrame to ensure DOM is ready
   */
  const focus = useCallback(() => {
    if (!enabled || !targetRef.current || !isMountedRef.current) {
      return
    }

    const performFocus = () => {
      if (!targetRef.current || !isMountedRef.current) {
        return
      }

      try {
        // Use requestAnimationFrame for timing coordination
        requestAnimationFrame(() => {
          if (targetRef.current && isMountedRef.current) {
            targetRef.current.focus()
          }
        })
      } catch (error) {
        console.error('useAutoFocus: Failed to focus element', error)
      }
    }

    if (delay > 0) {
      setTimeout(performFocus, delay)
    } else {
      performFocus()
    }
  }, [enabled, targetRef, delay])

  /**
   * Blur the target element
   */
  const blur = useCallback(() => {
    if (!targetRef.current) {
      return
    }

    try {
      targetRef.current.blur()
    } catch (error) {
      console.error('useAutoFocus: Failed to blur element', error)
    }
  }, [targetRef])

  /**
   * Save the current focused element to history stack
   * Useful before opening modals or changing focus context
   */
  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement

    if (!activeElement || activeElement === document.body) {
      return
    }

    // Add to focus history stack
    focusHistoryRef.current.push({
      element: activeElement,
      timestamp: Date.now()
    })

    // Limit history stack size to prevent memory leaks
    if (focusHistoryRef.current.length > 10) {
      focusHistoryRef.current.shift()
    }
  }, [])

  /**
   * Restore focus from history stack
   * Pops the most recent focus entry and restores focus to that element
   */
  const restoreFocus = useCallback(() => {
    if (!restoreOnModalClose || !isMountedRef.current) {
      return
    }

    // Pop the most recent focus entry
    const lastFocus = focusHistoryRef.current.pop()

    if (!lastFocus) {
      // No history, fall back to target element
      focus()
      return
    }

    try {
      // Check if the element still exists in the DOM
      if (document.contains(lastFocus.element)) {
        requestAnimationFrame(() => {
          if (isMountedRef.current && document.contains(lastFocus.element)) {
            lastFocus.element.focus()
          }
        })
      } else {
        // Element no longer exists, fall back to target element
        focus()
      }
    } catch (error) {
      console.error('useAutoFocus: Failed to restore focus', error)
      // Fall back to target element on error
      focus()
    }
  }, [restoreOnModalClose, focus])

  // Auto-focus on mount if enabled
  useEffect(() => {
    if (enabled) {
      focus()
    }
  }, [enabled, focus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      focusHistoryRef.current = []
    }
  }, [])

  return {
    focus,
    blur,
    saveFocus,
    restoreFocus
  }
}
