import { useEffect, useCallback, useRef } from 'react'
import type {
  UseKeyboardShortcutsOptions,
  UseKeyboardShortcutsReturn,
  KeyboardShortcut,
} from './types'

/**
 * Custom hook for managing global keyboard shortcuts with context-aware execution
 * 
 * Features:
 * - Registers global keydown listener with automatic cleanup
 * - Detects typing context to prevent shortcuts when user is typing (except Escape)
 * - Handles modifier keys (Ctrl, Shift, Alt) and F-keys
 * - Prevents default browser behavior for registered shortcuts
 * - Supports enabled/disabled state per shortcut
 * 
 * @param options - Configuration options for keyboard shortcuts
 * @returns Object with shortcuts array, enabled state, and help toggle function
 * 
 * @example
 * ```tsx
 * const { shortcuts, isEnabled, toggleHelp } = useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'F1',
 *       description: 'Focus search input',
 *       category: 'search',
 *       handler: () => searchInputRef.current?.focus(),
 *     },
 *     {
 *       key: 'F3',
 *       description: 'Open payment modal',
 *       category: 'payment',
 *       handler: () => setPaymentModalOpen(true),
 *       enabled: () => cartItems.length > 0,
 *     },
 *   ],
 * })
 * ```
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions
): UseKeyboardShortcutsReturn {
  const { shortcuts, enableWhenTyping = false } = options

  // Use ref to avoid stale closures in event listener
  const shortcutsRef = useRef(shortcuts)
  const enableWhenTypingRef = useRef(enableWhenTyping)
  
  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])
  
  useEffect(() => {
    enableWhenTypingRef.current = enableWhenTyping
  }, [enableWhenTyping])

  /**
   * Check if the user is currently typing in a text input field
   * Examines the active element to determine if it's an input, textarea, or contenteditable
   */
  const isTypingInInput = useCallback((): boolean => {
    const activeElement = document.activeElement
    
    if (!activeElement) {
      return false
    }
    
    const tagName = activeElement.tagName.toLowerCase()
    const isInput = tagName === 'input' || tagName === 'textarea'
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true'
    
    return isInput || isContentEditable
  }, [])

  /**
   * Match a keyboard event against a shortcut definition
   * Compares key and modifier keys (Ctrl, Shift, Alt)
   */
  const matchesShortcut = useCallback(
    (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
      // Normalize key comparison (handle case differences)
      const eventKey = event.key
      const shortcutKey = shortcut.key
      
      // Check if keys match (case-insensitive for letters, case-sensitive for special keys)
      const keyMatches = eventKey.toLowerCase() === shortcutKey.toLowerCase()
      
      if (!keyMatches) {
        return false
      }
      
      // Check modifier keys
      const ctrlMatches = (shortcut.ctrlKey ?? false) === event.ctrlKey
      const shiftMatches = (shortcut.shiftKey ?? false) === event.shiftKey
      const altMatches = (shortcut.altKey ?? false) === event.altKey
      
      return ctrlMatches && shiftMatches && altMatches
    },
    []
  )

  /**
   * Handle keyboard events and execute matching shortcuts
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const typing = isTypingInInput()
    
    // Allow Escape key even when typing (to close modals, clear search, etc.)
    const isEscapeKey = event.key === 'Escape'
    
    // If user is typing and shortcuts are not enabled when typing, only allow Escape
    if (typing && !enableWhenTypingRef.current && !isEscapeKey) {
      return
    }
    
    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find((shortcut) =>
      matchesShortcut(event, shortcut)
    )
    
    if (!matchingShortcut) {
      return
    }
    
    // Check if shortcut is enabled (if enabled function is provided)
    if (matchingShortcut.enabled && !matchingShortcut.enabled()) {
      return
    }
    
    // Prevent default browser behavior for registered shortcuts
    event.preventDefault()
    
    // Execute the shortcut handler
    try {
      matchingShortcut.handler(event)
    } catch (error) {
      console.error('Error executing keyboard shortcut:', error)
    }
  }, [isTypingInInput, matchesShortcut])

  /**
   * Register global keydown listener on mount, cleanup on unmount
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  /**
   * Toggle the keyboard shortcuts help overlay
   * This is a no-op placeholder — the actual help overlay state is managed
   * by KeyboardShortcutProvider context when used in a full provider setup.
   */
  const toggleHelp = useCallback(() => {
    // Help overlay state is managed externally via KeyboardShortcutProvider
    // This stub satisfies the UseKeyboardShortcutsReturn interface
  }, [])

  return {
    shortcuts,
    isEnabled: true,
    toggleHelp,
  }
}
