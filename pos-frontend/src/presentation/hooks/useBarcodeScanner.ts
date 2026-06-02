import { useEffect, useRef, useState, useCallback } from 'react'
import type { BarcodeScannerConfig, BarcodeScannerState } from './types'

/**
 * Character input entry with timestamp for timing analysis
 */
interface CharacterEntry {
  char: string
  timestamp: number
}

/**
 * Check if a key represents a printable character that could be part of a barcode.
 * Single-character keys are always included. Multi-character keys (e.g. 'Shift', 'ArrowUp')
 * are excluded since they are control/modifier keys.
 */
function isPrintableKey(key: string): boolean {
  return key.length === 1
}

/**
 * Hook for detecting barcode scanner input by analyzing character timing
 * 
 * Barcode scanners typically send characters very rapidly (< 50ms between chars)
 * followed by an Enter key. This hook distinguishes scanner input from manual typing
 * by tracking character timing and triggering the onScan callback when a valid
 * barcode is detected.
 * 
 * @param config - Configuration for barcode scanner detection
 * @returns State indicating scanning status and last scanned barcode
 * 
 * @example
 * ```tsx
 * const { isScanning, lastBarcode } = useBarcodeScanner({
 *   minLength: 4,
 *   maxCharDelay: 50,
 *   onScan: (barcode) => {
 *     console.log('Scanned:', barcode)
 *     searchProductByBarcode(barcode)
 *   },
 *   onError: (error) => {
 *     console.error('Scan error:', error)
 *   }
 * })
 * ```
 */
export function useBarcodeScanner(config: BarcodeScannerConfig): BarcodeScannerState {
  const {
    minLength = 4,
    maxCharDelay = 50,
    onScan,
    onError
  } = config

  // State
  const [isScanning, setIsScanning] = useState(false)
  const [lastBarcode, setLastBarcode] = useState<string | null>(null)

  // Character buffer with timestamps
  const bufferRef = useRef<CharacterEntry[]>([])
  
  // Timer for clearing buffer after inactivity
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Clear the character buffer and reset scanning state
   */
  const clearBuffer = useCallback(() => {
    bufferRef.current = []
    setIsScanning(false)
    
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
      clearTimerRef.current = null
    }
  }, [])

  /**
   * Schedule buffer clearing after 100ms of inactivity
   */
  const scheduleClearBuffer = useCallback(() => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
    }
    
    clearTimerRef.current = setTimeout(() => {
      clearBuffer()
    }, 100)
  }, [clearBuffer])

  /**
   * Check if the character timing indicates scanner input
   * Scanner input has < 50ms between characters
   */
  const isRapidInput = useCallback((buffer: CharacterEntry[]): boolean => {
    if (buffer.length < 2) return false

    // Check timing between consecutive characters
    for (let i = 1; i < buffer.length; i++) {
      const timeDiff = buffer[i].timestamp - buffer[i - 1].timestamp
      if (timeDiff > maxCharDelay) {
        return false
      }
    }

    return true
  }, [maxCharDelay])

  /**
   * Handle keyboard input events
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key

    // Handle Enter key - potential barcode completion
    if (key === 'Enter') {
      const buffer = bufferRef.current
      const barcodeText = buffer.map(entry => entry.char).join('')

      // Check if we have a valid barcode
      if (buffer.length >= minLength && isRapidInput(buffer)) {
        // Valid barcode detected
        event.preventDefault()
        setLastBarcode(barcodeText)
        onScan(barcodeText)
        clearBuffer()
      } else if (buffer.length > 0 && buffer.length < minLength) {
        // Buffer has content but too short for valid barcode
        if (onError) {
          onError(`Barcode too short: ${barcodeText} (minimum ${minLength} characters)`)
        }
        clearBuffer()
      } else {
        // Empty buffer or slow typing - let Enter pass through normally
        clearBuffer()
      }
      return
    }

    // Only process printable characters (ignore special keys like Shift, Ctrl, etc.)
    if (!isPrintableKey(key)) {
      return
    }

    // Add character to buffer
    const now = Date.now()
    bufferRef.current.push({
      char: key,
      timestamp: now
    })

    // Set scanning state if we detect rapid input
    if (bufferRef.current.length >= 2 && isRapidInput(bufferRef.current)) {
      setIsScanning(true)
    }

    // Schedule buffer clearing after inactivity
    scheduleClearBuffer()
  }, [minLength, maxCharDelay, onScan, onError, isRapidInput, clearBuffer, scheduleClearBuffer])

  // Set up global keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      
      // Clean up timer on unmount
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [handleKeyDown])

  return {
    isScanning,
    lastBarcode
  }
}
