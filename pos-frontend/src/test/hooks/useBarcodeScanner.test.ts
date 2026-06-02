import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBarcodeScanner } from '@presentation/hooks/useBarcodeScanner'

/**
 * Unit tests for useBarcodeScanner hook
 * 
 * Tests the barcode scanner detection by analyzing character timing:
 * - Rapid input detection (< 50ms between chars)
 * - Enter key handler to trigger onScan callback
 * - Buffer clearing after 100ms inactivity
 * - Minimum length validation (default: 4 characters)
 * 
 * Validates: Requirements 1.2, 1.3, 1.7, 9.2, 9.3
 */

describe('useBarcodeScanner', () => {
  let onScan: ReturnType<typeof vi.fn>
  let onError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onScan = vi.fn()
    onError = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should detect rapid character input as barcode scan', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      const event1 = new KeyboardEvent('keydown', { key: '7' })
      window.dispatchEvent(event1)
      vi.advanceTimersByTime(10)

      const event2 = new KeyboardEvent('keydown', { key: '5' })
      window.dispatchEvent(event2)
      vi.advanceTimersByTime(10)

      const event3 = new KeyboardEvent('keydown', { key: '0' })
      window.dispatchEvent(event3)
      vi.advanceTimersByTime(10)

      const event4 = new KeyboardEvent('keydown', { key: '1' })
      window.dispatchEvent(event4)
      vi.advanceTimersByTime(10)

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('7501')
    expect(result.current.lastBarcode).toBe('7501')
  })

  it('should not trigger onScan for slow manual typing', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      const event1 = new KeyboardEvent('keydown', { key: 'P' })
      window.dispatchEvent(event1)
      vi.advanceTimersByTime(100)

      const event2 = new KeyboardEvent('keydown', { key: 'r' })
      window.dispatchEvent(event2)
      vi.advanceTimersByTime(100)

      const event3 = new KeyboardEvent('keydown', { key: 'o' })
      window.dispatchEvent(event3)
      vi.advanceTimersByTime(100)

      const event4 = new KeyboardEvent('keydown', { key: 'd' })
      window.dispatchEvent(event4)
      vi.advanceTimersByTime(100)

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(result.current.isScanning).toBe(false)
    expect(onScan).not.toHaveBeenCalled()
  })

  it('should trigger onScan when Enter is pressed after rapid input', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 4; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('0123')
  })

  it('should call onError when Enter is pressed with buffer too short', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 3; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onError).toHaveBeenCalledWith(
      'Barcode too short: 012 (minimum 4 characters)'
    )
    expect(onScan).not.toHaveBeenCalled()
  })

  it('should clear buffer after 100ms of inactivity', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      const event1 = new KeyboardEvent('keydown', { key: '7' })
      window.dispatchEvent(event1)
      vi.advanceTimersByTime(10)

      vi.advanceTimersByTime(100)

      const event2 = new KeyboardEvent('keydown', { key: '5' })
      window.dispatchEvent(event2)
      vi.advanceTimersByTime(10)

      const event3 = new KeyboardEvent('keydown', { key: '0' })
      window.dispatchEvent(event3)
      vi.advanceTimersByTime(10)

      const event4 = new KeyboardEvent('keydown', { key: '1' })
      window.dispatchEvent(event4)
      vi.advanceTimersByTime(10)

      const event5 = new KeyboardEvent('keydown', { key: '2' })
      window.dispatchEvent(event5)
      vi.advanceTimersByTime(10)

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('5012')
  })

  it('should reset isScanning state after buffer clears', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 4; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }
    })

    expect(result.current.isScanning).toBe(true)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.isScanning).toBe(false)
  })

  it('should require minimum 4 characters by default', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 3; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onError).toHaveBeenCalledWith(
      'Barcode too short: 012 (minimum 4 characters)'
    )
    expect(onScan).not.toHaveBeenCalled()
  })

  it('should accept custom minimum length', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 6,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 5; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onError).toHaveBeenCalledWith(
      'Barcode too short: 01234 (minimum 6 characters)'
    )
    expect(onScan).not.toHaveBeenCalled()
  })

  it('should accept barcode with exactly minimum length', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 4; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('0123')
    expect(onError).not.toHaveBeenCalled()
  })

  it('should accept barcode longer than minimum length', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      const barcode = '7501234567890'
      for (const char of barcode) {
        const event = new KeyboardEvent('keydown', { key: char })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('7501234567890')
    expect(onError).not.toHaveBeenCalled()
  })

  it('should ignore special keys like Shift, Ctrl, Alt', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      const event1 = new KeyboardEvent('keydown', { key: '7' })
      window.dispatchEvent(event1)
      vi.advanceTimersByTime(10)

      const shiftEvent = new KeyboardEvent('keydown', { key: 'Shift' })
      window.dispatchEvent(shiftEvent)
      vi.advanceTimersByTime(10)

      const event2 = new KeyboardEvent('keydown', { key: '5' })
      window.dispatchEvent(event2)
      vi.advanceTimersByTime(10)

      const event3 = new KeyboardEvent('keydown', { key: '0' })
      window.dispatchEvent(event3)
      vi.advanceTimersByTime(10)

      const event4 = new KeyboardEvent('keydown', { key: '1' })
      window.dispatchEvent(event4)
      vi.advanceTimersByTime(10)

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('7501')
  })

  it('should update lastBarcode on successful scan', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    expect(result.current.lastBarcode).toBeNull()

    act(() => {
      for (let i = 0; i < 4; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(result.current.lastBarcode).toBe('0123')
  })

  it('should set isScanning to true when rapid input is detected', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    expect(result.current.isScanning).toBe(false)

    act(() => {
      const event1 = new KeyboardEvent('keydown', { key: '7' })
      window.dispatchEvent(event1)
      vi.advanceTimersByTime(10)

      const event2 = new KeyboardEvent('keydown', { key: '5' })
      window.dispatchEvent(event2)
    })

    expect(result.current.isScanning).toBe(true)
  })

  it('should handle typical EAN-13 barcode', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      const barcode = '7501234567890'
      for (const char of barcode) {
        const event = new KeyboardEvent('keydown', { key: char })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(15)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('7501234567890')
    expect(result.current.lastBarcode).toBe('7501234567890')
  })

  it('should handle multiple consecutive scans', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    act(() => {
      const barcode1 = '1111'
      for (const char of barcode1) {
        const event = new KeyboardEvent('keydown', { key: char })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent1 = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent1)

      vi.advanceTimersByTime(200)

      const barcode2 = '2222'
      for (const char of barcode2) {
        const event = new KeyboardEvent('keydown', { key: char })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(10)
      }

      const enterEvent2 = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent2)
    })

    expect(onScan).toHaveBeenCalledTimes(2)
    expect(onScan).toHaveBeenNthCalledWith(1, '1111')
    expect(onScan).toHaveBeenNthCalledWith(2, '2222')
    expect(result.current.lastBarcode).toBe('2222')
  })

  it('should respect custom maxCharDelay setting', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 100,
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 4; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(75)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).toHaveBeenCalledWith('0123')
  })

  it('should reject input exceeding custom maxCharDelay', () => {
    const { result } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 30,
        onScan,
        onError,
      })
    )

    act(() => {
      for (let i = 0; i < 4; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) })
        window.dispatchEvent(event)
        vi.advanceTimersByTime(40)
      }

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
    })

    expect(onScan).not.toHaveBeenCalled()
  })

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useBarcodeScanner({
        minLength: 4,
        maxCharDelay: 50,
        onScan,
        onError,
      })
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})
