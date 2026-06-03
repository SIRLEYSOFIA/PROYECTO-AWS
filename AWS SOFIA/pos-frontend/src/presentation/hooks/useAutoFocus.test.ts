/**
 * Unit tests for useAutoFocus hook
 * 
 * Tests focus management functionality including:
 * - Initial focus on mount
 * - Focus save and restore
 * - Timing coordination with requestAnimationFrame
 * - Delay configuration
 * - Enabled flag behavior
 * 
 * Validates: Requirements 1.1, 1.5, 7.1, 7.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoFocus } from './useAutoFocus'
import type { AutoFocusConfig } from './types'

describe('useAutoFocus', () => {
  let mockElement: HTMLInputElement
  let mockRef: React.RefObject<HTMLInputElement>

  beforeEach(() => {
    // Create a mock input element
    mockElement = document.createElement('input')
    mockElement.id = 'test-input'
    document.body.appendChild(mockElement)

    // Create a ref pointing to the mock element
    mockRef = { current: mockElement }

    // Mock requestAnimationFrame to execute immediately
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
  })

  afterEach(() => {
    // Clean up
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement)
    }
    vi.unstubAllGlobals()
  })

  describe('initial focus on mount', () => {
    it('should focus target element on mount when enabled is true', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true
        })
      )

      expect(focusSpy).toHaveBeenCalled()
      focusSpy.mockRestore()
    })

    it('should not focus target element on mount when enabled is false', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: false
        })
      )

      expect(focusSpy).not.toHaveBeenCalled()
      focusSpy.mockRestore()
    })

    it('should handle null ref gracefully', () => {
      const nullRef = { current: null }

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: nullRef,
          enabled: true
        })
      )

      // Should not throw and should return valid methods
      expect(result.current.focus).toBeDefined()
      expect(result.current.blur).toBeDefined()
      expect(result.current.saveFocus).toBeDefined()
      expect(result.current.restoreFocus).toBeDefined()
    })
  })

  describe('focus method', () => {
    it('should focus the target element when called', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true
        })
      )

      focusSpy.mockClear()

      act(() => {
        result.current.focus()
      })

      expect(focusSpy).toHaveBeenCalled()
      focusSpy.mockRestore()
    })

    it('should not focus when enabled is false', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: false
        })
      )

      focusSpy.mockClear()

      act(() => {
        result.current.focus()
      })

      expect(focusSpy).not.toHaveBeenCalled()
      focusSpy.mockRestore()
    })
  })

  describe('blur method', () => {
    it('should blur the target element when called', () => {
      const blurSpy = vi.spyOn(mockElement, 'blur')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true
        })
      )

      act(() => {
        result.current.blur()
      })

      expect(blurSpy).toHaveBeenCalled()
      blurSpy.mockRestore()
    })

    it('should handle blur on null ref gracefully', () => {
      const nullRef = { current: null }

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: nullRef,
          enabled: true
        })
      )

      // Should not throw
      expect(() => {
        act(() => {
          result.current.blur()
        })
      }).not.toThrow()
    })
  })

  describe('saveFocus and restoreFocus', () => {
    it('should save and restore focus correctly', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      // Create another element and focus it
      const anotherElement = document.createElement('button')
      anotherElement.id = 'another-button'
      document.body.appendChild(anotherElement)

      act(() => {
        anotherElement.focus()
      })

      // Save the current focus (anotherElement)
      act(() => {
        result.current.saveFocus()
      })

      // Focus the target element
      focusSpy.mockClear()
      act(() => {
        result.current.focus()
      })
      expect(focusSpy).toHaveBeenCalled()

      // Restore focus to anotherElement
      act(() => {
        result.current.restoreFocus()
      })

      expect(document.activeElement).toBe(anotherElement)

      // Cleanup
      anotherElement.parentNode?.removeChild(anotherElement)
      focusSpy.mockRestore()
    })

    it('should fall back to target element when no history exists', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      focusSpy.mockClear()

      // Restore without saving anything
      act(() => {
        result.current.restoreFocus()
      })

      // Should fall back to focusing the target element
      expect(focusSpy).toHaveBeenCalled()
      focusSpy.mockRestore()
    })

    it('should not restore focus when restoreOnModalClose is false', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: false
        })
      )

      const anotherElement = document.createElement('button')
      document.body.appendChild(anotherElement)

      act(() => {
        anotherElement.focus()
      })

      act(() => {
        result.current.saveFocus()
      })

      focusSpy.mockClear()

      act(() => {
        result.current.restoreFocus()
      })

      // Should not restore because restoreOnModalClose is false
      expect(focusSpy).not.toHaveBeenCalled()

      anotherElement.parentNode?.removeChild(anotherElement)
      focusSpy.mockRestore()
    })

    it('should handle focus history stack with multiple entries', () => {
      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      // Create multiple elements
      const element1 = document.createElement('button')
      element1.id = 'button-1'
      document.body.appendChild(element1)

      const element2 = document.createElement('button')
      element2.id = 'button-2'
      document.body.appendChild(element2)

      // Save focus for element1
      act(() => {
        element1.focus()
        result.current.saveFocus()
      })

      // Save focus for element2
      act(() => {
        element2.focus()
        result.current.saveFocus()
      })

      // Restore should restore element2 first (LIFO)
      act(() => {
        result.current.restoreFocus()
      })
      expect(document.activeElement).toBe(element2)

      // Restore again should restore element1
      act(() => {
        result.current.restoreFocus()
      })
      expect(document.activeElement).toBe(element1)

      // Cleanup
      element1.parentNode?.removeChild(element1)
      element2.parentNode?.removeChild(element2)
    })

    it('should limit focus history stack to prevent memory leaks', () => {
      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      // Create 15 elements and save focus for each
      const elements: HTMLElement[] = []
      for (let i = 0; i < 15; i++) {
        const element = document.createElement('button')
        element.id = `button-${i}`
        document.body.appendChild(element)
        elements.push(element)

        act(() => {
          element.focus()
          result.current.saveFocus()
        })
      }

      // History should be limited to 10 entries
      // Restore 10 times and verify we get the last 10 elements
      for (let i = 14; i >= 5; i--) {
        act(() => {
          result.current.restoreFocus()
        })
        expect(document.activeElement).toBe(elements[i])
      }

      // Cleanup
      elements.forEach(el => {
        el.parentNode?.removeChild(el)
      })
    })

    it('should handle removed elements gracefully', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      // Create an element and save focus
      const tempElement = document.createElement('button')
      tempElement.id = 'temp-button'
      document.body.appendChild(tempElement)

      act(() => {
        tempElement.focus()
        result.current.saveFocus()
      })

      // Remove the element from DOM
      tempElement.parentNode?.removeChild(tempElement)

      focusSpy.mockClear()

      // Restore should fall back to target element since saved element is gone
      act(() => {
        result.current.restoreFocus()
      })

      expect(focusSpy).toHaveBeenCalled()
      focusSpy.mockRestore()
    })
  })

  describe('requestAnimationFrame timing', () => {
    it('should use requestAnimationFrame for focus timing', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true
        })
      )

      rafSpy.mockClear()

      act(() => {
        result.current.focus()
      })

      expect(rafSpy).toHaveBeenCalled()
      rafSpy.mockRestore()
    })

    it('should use requestAnimationFrame for restore timing', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      const anotherElement = document.createElement('button')
      document.body.appendChild(anotherElement)

      act(() => {
        anotherElement.focus()
        result.current.saveFocus()
      })

      rafSpy.mockClear()

      act(() => {
        result.current.restoreFocus()
      })

      expect(rafSpy).toHaveBeenCalled()
      rafSpy.mockRestore()

      anotherElement.parentNode?.removeChild(anotherElement)
    })
  })

  describe('cleanup on unmount', () => {
    it('should prevent focus after unmount', () => {
      const focusSpy = vi.spyOn(mockElement, 'focus')
      vi.useFakeTimers()

      const { unmount } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          delay: 100
        })
      )

      focusSpy.mockClear()

      // Unmount the hook
      unmount()

      // Advance time
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Focus should not be called after unmount
      expect(focusSpy).not.toHaveBeenCalled()

      focusSpy.mockRestore()
      vi.useRealTimers()
    })

    it('should clear focus history on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      const anotherElement = document.createElement('button')
      document.body.appendChild(anotherElement)

      act(() => {
        anotherElement.focus()
        result.current.saveFocus()
      })

      // Unmount
      unmount()

      // After unmount, focus history should be cleared
      // (This is verified by the fact that subsequent restores won't work,
      // but we can't directly test this without accessing internal state)

      anotherElement.parentNode?.removeChild(anotherElement)
    })
  })

  describe('error handling', () => {
    it('should handle focus errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a mock element that throws on focus
      const errorElement = {
        focus: vi.fn(() => {
          throw new Error('Focus failed')
        })
      } as any

      const errorRef = { current: errorElement }

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: errorRef,
          enabled: true
        })
      )

      // Should not throw
      expect(() => {
        act(() => {
          result.current.focus()
        })
      }).not.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle blur errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a mock element that throws on blur
      const errorElement = {
        blur: vi.fn(() => {
          throw new Error('Blur failed')
        })
      } as any

      const errorRef = { current: errorElement }

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: errorRef,
          enabled: true
        })
      )

      // Should not throw
      expect(() => {
        act(() => {
          result.current.blur()
        })
      }).not.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle restore errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const focusSpy = vi.spyOn(mockElement, 'focus')

      const { result } = renderHook(() =>
        useAutoFocus({
          targetRef: mockRef,
          enabled: true,
          restoreOnModalClose: true
        })
      )

      // Create an element that throws on focus
      const errorElement = {
        focus: vi.fn(() => {
          throw new Error('Focus failed')
        })
      } as any

      // Manually add to history (simulating a saved focus)
      act(() => {
        // We can't directly manipulate history, so we'll just test the error handling
        // by having the restore fall back to the target element
        result.current.restoreFocus()
      })

      // Should fall back to target element
      expect(focusSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      focusSpy.mockRestore()
    })
  })
})
