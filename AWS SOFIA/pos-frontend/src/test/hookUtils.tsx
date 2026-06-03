/**
 * Testing utilities for React hooks
 * Provides helpers for testing custom hooks with React Testing Library
 */

import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react'
import { ReactNode } from 'react'

/**
 * Wrapper for renderHook that provides common setup
 */
export function renderTestHook<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>
): RenderHookResult<TResult, TProps> {
  return renderHook(hook, options)
}

/**
 * Create a wrapper component for hooks that need context providers
 */
export function createHookWrapper(providers: Array<React.ComponentType<{ children: ReactNode }>>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactNode>(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    )
  }
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> {
  const startTime = Date.now()
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
}

/**
 * Mock keyboard event for testing
 */
export function createKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  options: {
    key: string
    code?: string
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    metaKey?: boolean
  }
): KeyboardEvent {
  return new KeyboardEvent(type, {
    key: options.key,
    code: options.code || options.key,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
    bubbles: true,
    cancelable: true,
  })
}

/**
 * Simulate rapid keyboard input (for barcode scanner testing)
 */
export async function simulateRapidInput(
  characters: string,
  delay: number = 10
): Promise<void> {
  for (const char of characters) {
    const event = createKeyboardEvent('keydown', { key: char })
    document.dispatchEvent(event)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

/**
 * Simulate slow keyboard input (for manual typing testing)
 */
export async function simulateSlowInput(
  characters: string,
  delay: number = 100
): Promise<void> {
  for (const char of characters) {
    const event = createKeyboardEvent('keydown', { key: char })
    document.dispatchEvent(event)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

/**
 * Get the currently focused element
 */
export function getFocusedElement(): Element | null {
  return document.activeElement
}

/**
 * Check if an element is focused
 */
export function isElementFocused(element: HTMLElement | null): boolean {
  return element !== null && document.activeElement === element
}

/**
 * Focus an element and verify it received focus
 */
export function focusElement(element: HTMLElement): void {
  element.focus()
  if (!isElementFocused(element)) {
    throw new Error('Element did not receive focus')
  }
}

/**
 * Create a mock ref for testing
 */
export function createMockRef<T>(current: T | null = null): React.RefObject<T> {
  return { current } as React.RefObject<T>
}

/**
 * Advance timers and flush promises
 */
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  // @ts-expect-error - vi is a global from vitest
  vi.advanceTimersByTime(ms)
  await Promise.resolve()
}
