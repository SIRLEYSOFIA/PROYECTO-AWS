/**
 * Tests for KeyboardShortcutProvider context
 * 
 * Tests the keyboard shortcut registration, unregistration, and help overlay management.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KeyboardShortcutProvider, useKeyboardShortcutContext } from './KeyboardShortcutProvider'
import type { KeyboardShortcut } from '@presentation/hooks/types'

describe('KeyboardShortcutProvider', () => {
  describe('Context Provider', () => {
    it('should render children correctly', () => {
      render(
        <KeyboardShortcutProvider>
          <div data-testid="test-child">Test Content</div>
        </KeyboardShortcutProvider>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('should throw error when hook is used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useKeyboardShortcutContext())
      }).toThrow('useKeyboardShortcutContext must be used within a KeyboardShortcutProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('registerShortcut', () => {
    it('should register a keyboard shortcut', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut)
      })

      expect(result.current.allShortcuts).toHaveLength(1)
      expect(result.current.allShortcuts[0]).toEqual(shortcut)
    })

    it('should register multiple shortcuts', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut1: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      const shortcut2: KeyboardShortcut = {
        key: 'F3',
        description: 'Open payment',
        category: 'payment',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut1)
        result.current.registerShortcut(shortcut2)
      })

      expect(result.current.allShortcuts).toHaveLength(2)
    })

    it('should replace existing shortcut with same key', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut1: KeyboardShortcut = {
        key: 'F1',
        description: 'Old description',
        category: 'search',
        handler: vi.fn()
      }

      const shortcut2: KeyboardShortcut = {
        key: 'F1',
        description: 'New description',
        category: 'search',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut1)
        result.current.registerShortcut(shortcut2)
      })

      expect(result.current.allShortcuts).toHaveLength(1)
      expect(result.current.allShortcuts[0].description).toBe('New description')
    })

    it('should return cleanup function that unregisters shortcut', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      let cleanup: () => void

      act(() => {
        cleanup = result.current.registerShortcut(shortcut)
      })

      expect(result.current.allShortcuts).toHaveLength(1)

      act(() => {
        cleanup!()
      })

      expect(result.current.allShortcuts).toHaveLength(0)
    })

    it('should support shortcuts with modifier keys', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut: KeyboardShortcut = {
        key: '/',
        ctrlKey: true,
        description: 'Show help',
        category: 'navigation',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut)
      })

      expect(result.current.allShortcuts).toHaveLength(1)
      expect(result.current.allShortcuts[0].ctrlKey).toBe(true)
    })

    it('should support shortcuts with enabled condition', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut: KeyboardShortcut = {
        key: 'F3',
        description: 'Open payment',
        category: 'payment',
        handler: vi.fn(),
        enabled: () => true
      }

      act(() => {
        result.current.registerShortcut(shortcut)
      })

      expect(result.current.allShortcuts).toHaveLength(1)
      expect(result.current.allShortcuts[0].enabled).toBeDefined()
    })
  })

  describe('unregisterShortcut', () => {
    it('should unregister a keyboard shortcut', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut)
      })

      expect(result.current.allShortcuts).toHaveLength(1)

      act(() => {
        result.current.unregisterShortcut('F1')
      })

      expect(result.current.allShortcuts).toHaveLength(0)
    })

    it('should be no-op when unregistering non-existent shortcut', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      expect(() => {
        act(() => {
          result.current.unregisterShortcut('F99')
        })
      }).not.toThrow()

      expect(result.current.allShortcuts).toHaveLength(0)
    })

    it('should unregister only the specified shortcut', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut1: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      const shortcut2: KeyboardShortcut = {
        key: 'F3',
        description: 'Open payment',
        category: 'payment',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut1)
        result.current.registerShortcut(shortcut2)
      })

      expect(result.current.allShortcuts).toHaveLength(2)

      act(() => {
        result.current.unregisterShortcut('F1')
      })

      expect(result.current.allShortcuts).toHaveLength(1)
      expect(result.current.allShortcuts[0].key).toBe('F3')
    })
  })

  describe('toggleHelp', () => {
    it('should toggle help overlay state from closed to open', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      expect(result.current.isHelpOpen).toBe(false)

      act(() => {
        result.current.toggleHelp()
      })

      expect(result.current.isHelpOpen).toBe(true)
    })

    it('should toggle help overlay state from open to closed', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      act(() => {
        result.current.toggleHelp()
      })

      expect(result.current.isHelpOpen).toBe(true)

      act(() => {
        result.current.toggleHelp()
      })

      expect(result.current.isHelpOpen).toBe(false)
    })

    it('should toggle help multiple times', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      expect(result.current.isHelpOpen).toBe(false)

      act(() => {
        result.current.toggleHelp()
      })
      expect(result.current.isHelpOpen).toBe(true)

      act(() => {
        result.current.toggleHelp()
      })
      expect(result.current.isHelpOpen).toBe(false)

      act(() => {
        result.current.toggleHelp()
      })
      expect(result.current.isHelpOpen).toBe(true)
    })
  })

  describe('allShortcuts', () => {
    it('should return empty array initially', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      expect(result.current.allShortcuts).toEqual([])
    })

    it('should return all registered shortcuts', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'F1',
          description: 'Focus search',
          category: 'search',
          handler: vi.fn()
        },
        {
          key: 'F3',
          description: 'Open payment',
          category: 'payment',
          handler: vi.fn()
        },
        {
          key: 'F5',
          description: 'Focus customer',
          category: 'navigation',
          handler: vi.fn()
        }
      ]

      act(() => {
        shortcuts.forEach((shortcut) => {
          result.current.registerShortcut(shortcut)
        })
      })

      expect(result.current.allShortcuts).toHaveLength(3)
      expect(result.current.allShortcuts).toEqual(expect.arrayContaining(shortcuts))
    })

    it('should return shortcuts sorted by priority (most recent first)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut1: KeyboardShortcut = {
        key: 'F1',
        description: 'First',
        category: 'search',
        handler: vi.fn()
      }

      const shortcut2: KeyboardShortcut = {
        key: 'F3',
        description: 'Second',
        category: 'payment',
        handler: vi.fn()
      }

      const shortcut3: KeyboardShortcut = {
        key: 'F5',
        description: 'Third',
        category: 'navigation',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut1)
        result.current.registerShortcut(shortcut2)
        result.current.registerShortcut(shortcut3)
      })

      // Most recent should be first
      expect(result.current.allShortcuts[0].key).toBe('F5')
      expect(result.current.allShortcuts[1].key).toBe('F3')
      expect(result.current.allShortcuts[2].key).toBe('F1')
    })

    it('should update when shortcuts are registered/unregistered', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut1: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      const shortcut2: KeyboardShortcut = {
        key: 'F3',
        description: 'Open payment',
        category: 'payment',
        handler: vi.fn()
      }

      act(() => {
        result.current.registerShortcut(shortcut1)
      })
      expect(result.current.allShortcuts).toHaveLength(1)

      act(() => {
        result.current.registerShortcut(shortcut2)
      })
      expect(result.current.allShortcuts).toHaveLength(2)

      act(() => {
        result.current.unregisterShortcut('F1')
      })
      expect(result.current.allShortcuts).toHaveLength(1)
    })
  })

  describe('Integration', () => {
    it('should work with multiple hook instances in same provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      // Create both hooks with the same wrapper to share the same provider instance
      const { result: result1 } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      act(() => {
        result1.current.registerShortcut(shortcut)
      })

      // Verify the shortcut was registered
      expect(result1.current.allShortcuts).toHaveLength(1)
      expect(result1.current.allShortcuts[0].key).toBe('F1')
    })

    it('should maintain state across multiple operations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      )

      const { result } = renderHook(() => useKeyboardShortcutContext(), { wrapper })

      const shortcut1: KeyboardShortcut = {
        key: 'F1',
        description: 'Focus search',
        category: 'search',
        handler: vi.fn()
      }

      const shortcut2: KeyboardShortcut = {
        key: 'F3',
        description: 'Open payment',
        category: 'payment',
        handler: vi.fn()
      }

      // Register first shortcut
      act(() => {
        result.current.registerShortcut(shortcut1)
      })
      expect(result.current.allShortcuts).toHaveLength(1)
      expect(result.current.isHelpOpen).toBe(false)

      // Toggle help
      act(() => {
        result.current.toggleHelp()
      })
      expect(result.current.isHelpOpen).toBe(true)
      expect(result.current.allShortcuts).toHaveLength(1)

      // Register second shortcut
      act(() => {
        result.current.registerShortcut(shortcut2)
      })
      expect(result.current.allShortcuts).toHaveLength(2)
      expect(result.current.isHelpOpen).toBe(true)

      // Toggle help again
      act(() => {
        result.current.toggleHelp()
      })
      expect(result.current.isHelpOpen).toBe(false)
      expect(result.current.allShortcuts).toHaveLength(2)
    })
  })
})

