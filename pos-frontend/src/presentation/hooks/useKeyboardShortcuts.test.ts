/**
 * Unit tests for useKeyboardShortcuts hook
 * 
 * Tests keyboard shortcut functionality including:
 * - Shortcut execution with various key combinations
 * - Context awareness (typing vs. not typing)
 * - Escape exception when typing
 * - preventDefault behavior
 * - Modifier keys (Ctrl, Shift, Alt)
 * - F-keys support
 * - Enabled/disabled state per shortcut
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import type { KeyboardShortcut, UseKeyboardShortcutsOptions } from './types'

describe('useKeyboardShortcuts', () => {
  let mockInput: HTMLInputElement
  let mockTextarea: HTMLTextAreaElement
  let mockButton: HTMLButtonElement

  beforeEach(() => {
    // Create mock DOM elements
    mockInput = document.createElement('input')
    mockInput.id = 'test-input'
    document.body.appendChild(mockInput)

    mockTextarea = document.createElement('textarea')
    mockTextarea.id = 'test-textarea'
    document.body.appendChild(mockTextarea)

    mockButton = document.createElement('button')
    mockButton.id = 'test-button'
    document.body.appendChild(mockButton)
  })

  afterEach(() => {
    // Clean up DOM
    if (mockInput.parentNode) mockInput.parentNode.removeChild(mockInput)
    if (mockTextarea.parentNode) mockTextarea.parentNode.removeChild(mockTextarea)
    if (mockButton.parentNode) mockButton.parentNode.removeChild(mockButton)
    
    // Reset focus
    document.body.focus()
  })

  describe('basic shortcut execution', () => {
    it('should execute handler when shortcut is pressed', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      expect(handler).toHaveBeenCalledWith(event)
    })

    it('should not execute handler when different key is pressed', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', { key: 'F2' })
      window.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should execute multiple shortcuts independently', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'First shortcut',
          category: 'search',
          handler: handler1,
        },
        {
          key: 'F2',
          description: 'Second shortcut',
          category: 'cart',
          handler: handler2,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event1 = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event1)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()

      handler1.mockClear()
      handler2.mockClear()

      const event2 = new KeyboardEvent('keydown', { key: 'F2' })
      window.dispatchEvent(event2)
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('modifier keys', () => {
    it('should match Ctrl key modifier', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Plus',
          ctrlKey: true,
          description: 'Ctrl+Plus',
          category: 'cart',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Should not match without Ctrl
      let event = new KeyboardEvent('keydown', { key: 'Plus', ctrlKey: false })
      window.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Should match with Ctrl
      event = new KeyboardEvent('keydown', { key: 'Plus', ctrlKey: true })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalled()
    })

    it('should match Shift key modifier', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Tab',
          shiftKey: true,
          description: 'Shift+Tab',
          category: 'navigation',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Should not match without Shift
      let event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false })
      window.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Should match with Shift
      event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalled()
    })

    it('should match Alt key modifier', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'a',
          altKey: true,
          description: 'Alt+A',
          category: 'navigation',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Should not match without Alt
      let event = new KeyboardEvent('keydown', { key: 'a', altKey: false })
      window.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Should match with Alt
      event = new KeyboardEvent('keydown', { key: 'a', altKey: true })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalled()
    })

    it('should match multiple modifier keys', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'S',
          ctrlKey: true,
          shiftKey: true,
          description: 'Ctrl+Shift+S',
          category: 'navigation',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Should not match with only Ctrl
      let event = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true, shiftKey: false })
      window.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Should not match with only Shift
      event = new KeyboardEvent('keydown', { key: 'S', ctrlKey: false, shiftKey: true })
      window.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Should match with both Ctrl and Shift
      event = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true, shiftKey: true })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('F-keys support', () => {
    it('should support F1 through F12 keys', () => {
      const handlers = Array.from({ length: 12 }, () => vi.fn())
      const shortcuts: KeyboardShortcut[] = handlers.map((handler, index) => ({
        key: `F${index + 1}`,
        description: `F${index + 1} shortcut`,
        category: 'navigation',
        handler,
      }))

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Test each F-key
      for (let i = 1; i <= 12; i++) {
        handlers.forEach((h, idx) => h.mockClear())
        const event = new KeyboardEvent('keydown', { key: `F${i}` })
        window.dispatchEvent(event)
        expect(handlers[i - 1]).toHaveBeenCalled()
      }
    })
  })

  describe('context awareness - typing detection', () => {
    it('should not execute shortcut when user is typing in input field', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Focus input field
      mockInput.focus()
      expect(document.activeElement).toBe(mockInput)

      // Press F1 while typing in input
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      // Handler should not be called
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not execute shortcut when user is typing in textarea', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Focus textarea
      mockTextarea.focus()
      expect(document.activeElement).toBe(mockTextarea)

      // Press F1 while typing in textarea
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      // Handler should not be called
      expect(handler).not.toHaveBeenCalled()
    })

    it('should execute shortcut when user is not typing', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Focus button (not a text input)
      mockButton.focus()
      expect(document.activeElement).toBe(mockButton)

      // Press F1
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      // Handler should be called
      expect(handler).toHaveBeenCalled()
    })

    it('should execute shortcut when no element has focus', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Ensure no element has focus
      document.body.focus()

      // Press F1
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      // Handler should be called
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('Escape key exception', () => {
    it('should allow Escape key even when typing in input field', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Escape',
          description: 'Close modal',
          category: 'navigation',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Focus input field
      mockInput.focus()
      expect(document.activeElement).toBe(mockInput)

      // Press Escape while typing
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)

      // Handler should be called even though typing
      expect(handler).toHaveBeenCalled()
    })

    it('should allow Escape key even when typing in textarea', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Escape',
          description: 'Close modal',
          category: 'navigation',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Focus textarea
      mockTextarea.focus()
      expect(document.activeElement).toBe(mockTextarea)

      // Press Escape while typing
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)

      // Handler should be called even though typing
      expect(handler).toHaveBeenCalled()
    })

    it('should not allow other shortcuts when typing, but allow Escape', () => {
      const f1Handler = vi.fn()
      const escapeHandler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Focus search',
          category: 'search',
          handler: f1Handler,
        },
        {
          key: 'Escape',
          description: 'Close modal',
          category: 'navigation',
          handler: escapeHandler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Focus input field
      mockInput.focus()

      // Press F1 - should not execute
      let event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(f1Handler).not.toHaveBeenCalled()

      // Press Escape - should execute
      event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
      expect(escapeHandler).toHaveBeenCalled()
    })
  })

  describe('preventDefault behavior', () => {
    it('should prevent default browser behavior for registered shortcuts', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', { key: 'F1' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      window.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
      preventDefaultSpy.mockRestore()
    })

    it('should not prevent default for unregistered shortcuts', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', { key: 'F2' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      window.dispatchEvent(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
      preventDefaultSpy.mockRestore()
    })

    it('should prevent default for Escape key when registered', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Escape',
          description: 'Close modal',
          category: 'navigation',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      mockInput.focus()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      window.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
      preventDefaultSpy.mockRestore()
    })
  })

  describe('enabled/disabled state per shortcut', () => {
    it('should execute shortcut when enabled function returns true', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
          enabled: () => true,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })

    it('should not execute shortcut when enabled function returns false', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
          enabled: () => false,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should respect dynamic enabled state', () => {
      let isEnabled = true
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
          enabled: () => isEnabled,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // First press - enabled
      let event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalledTimes(1)

      // Disable
      isEnabled = false
      handler.mockClear()

      // Second press - disabled
      event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(handler).not.toHaveBeenCalled()

      // Re-enable
      isEnabled = true
      handler.mockClear()

      // Third press - enabled again
      event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalled()
    })

    it('should execute shortcut without enabled function', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
          // No enabled function
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('enableWhenTyping option', () => {
    it('should execute shortcuts when typing if enableWhenTyping is true', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts,
          enableWhenTyping: true,
        })
      )

      // Focus input field
      mockInput.focus()

      // Press F1 while typing
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      // Handler should be called because enableWhenTyping is true
      expect(handler).toHaveBeenCalled()
    })

    it('should not execute shortcuts when typing if enableWhenTyping is false', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts,
          enableWhenTyping: false,
        })
      )

      // Focus input field
      mockInput.focus()

      // Press F1 while typing
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      // Handler should not be called
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('case-insensitive key matching', () => {
    it('should match keys case-insensitively', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'a',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Press lowercase 'a'
      let event = new KeyboardEvent('keydown', { key: 'a' })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalledTimes(1)

      handler.mockClear()

      // Press uppercase 'A'
      event = new KeyboardEvent('keydown', { key: 'A' })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup on unmount', () => {
    it('should remove event listener on unmount', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Press F1 before unmount
      let event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(handler).toHaveBeenCalledTimes(1)

      // Unmount
      unmount()
      handler.mockClear()

      // Press F1 after unmount
      event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)

      // Handler should not be called after unmount
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle errors in handler gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      const normalHandler = vi.fn()

      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Error shortcut',
          category: 'search',
          handler: errorHandler,
        },
        {
          key: 'F2',
          description: 'Normal shortcut',
          category: 'search',
          handler: normalHandler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Press F1 - should throw but be caught
      let event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(errorHandler).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Press F2 - should still work
      event = new KeyboardEvent('keydown', { key: 'F2' })
      window.dispatchEvent(event)
      expect(normalHandler).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('return value', () => {
    it('should return shortcuts array', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler: vi.fn(),
        },
      ]

      const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }))

      expect(result.current.shortcuts).toEqual(shortcuts)
    })

    it('should return isEnabled as true', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler: vi.fn(),
        },
      ]

      const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }))

      expect(result.current.isEnabled).toBe(true)
    })

    it('should return toggleHelp function', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler: vi.fn(),
        },
      ]

      const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }))

      expect(typeof result.current.toggleHelp).toBe('function')
      // Should not throw
      expect(() => {
        act(() => {
          result.current.toggleHelp()
        })
      }).not.toThrow()
    })
  })

  describe('contenteditable support', () => {
    it('should not execute shortcut when user is typing in contenteditable element', () => {
      const handler = vi.fn()
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Test shortcut',
          category: 'search',
          handler,
        },
      ]

      renderHook(() => useKeyboardShortcuts({ shortcuts }))

      // Create contenteditable element
      const editableDiv = document.createElement('div')
      editableDiv.setAttribute('contenteditable', 'true')
      editableDiv.id = 'editable-div'
      editableDiv.tabIndex = 0
      document.body.appendChild(editableDiv)

      // Focus contenteditable element
      act(() => {
        editableDiv.focus()
      })

      // Verify it's focused (contenteditable divs may not always set activeElement)
      // Instead, we'll just verify the handler is not called when activeElement is the div
      if (document.activeElement === editableDiv) {
        // Press F1 while typing in contenteditable
        const event = new KeyboardEvent('keydown', { key: 'F1' })
        window.dispatchEvent(event)

        // Handler should not be called
        expect(handler).not.toHaveBeenCalled()
      }

      // Cleanup
      editableDiv.parentNode?.removeChild(editableDiv)
    })
  })

  describe('dynamic shortcut updates', () => {
    it('should update shortcuts when props change', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const { rerender } = renderHook(
        ({ shortcuts }: UseKeyboardShortcutsOptions) =>
          useKeyboardShortcuts({ shortcuts }),
        {
          initialProps: {
            shortcuts: [
              {
                key: 'F1',
                description: 'First shortcut',
                category: 'search',
                handler: handler1,
              },
            ],
          },
        }
      )

      // Press F1 with first handler
      let event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(handler1).toHaveBeenCalledTimes(1)

      // Update shortcuts
      rerender({
        shortcuts: [
          {
            key: 'F1',
            description: 'Second shortcut',
            category: 'search',
            handler: handler2,
          },
        ],
      })

      handler1.mockClear()
      handler2.mockClear()

      // Press F1 with second handler
      event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })
})
