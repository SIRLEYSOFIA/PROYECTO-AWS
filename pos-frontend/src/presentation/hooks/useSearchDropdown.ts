import { useEffect, useRef, useState, useCallback } from 'react'
import type { SearchDropdownConfig, SearchDropdownState } from './types'
import type { ProductViewModel } from '@application/view-models/ProductViewModel'

/**
 * Hook for managing keyboard-navigable search result dropdown
 * 
 * Provides state and methods for:
 * - Tracking which result is highlighted
 * - Moving highlight up/down with arrow keys
 * - Selecting the highlighted result with Enter
 * - Resetting state when dropdown closes
 * - Updating highlight on mouse hover
 * 
 * @param config - Configuration including results, callbacks, and open state
 * @returns State and methods for dropdown navigation
 * 
 * @example
 * ```tsx
 * const { highlightedIndex, moveUp, moveDown, selectHighlighted, reset } = useSearchDropdown({
 *   results: searchResults,
 *   isOpen: dropdownOpen,
 *   onSelect: (product) => {
 *     addToCart(product)
 *     setDropdownOpen(false)
 *   },
 *   onClose: () => setDropdownOpen(false)
 * })
 * ```
 */
export function useSearchDropdown(config: SearchDropdownConfig): SearchDropdownState {
  const { results, onSelect, onClose, isOpen } = config

  // Track the currently highlighted index
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  // Keep track of previous results length to detect changes
  const prevResultsLengthRef = useRef(results.length)

  /**
   * Move highlight to the previous result
   * Wraps around to the last result if at the beginning
   */
  const moveUp = useCallback(() => {
    setHighlightedIndex((prevIndex) => {
      if (results.length === 0) return 0
      return prevIndex === 0 ? results.length - 1 : prevIndex - 1
    })
  }, [results.length])

  /**
   * Move highlight to the next result
   * Wraps around to the first result if at the end
   */
  const moveDown = useCallback(() => {
    setHighlightedIndex((prevIndex) => {
      if (results.length === 0) return 0
      return prevIndex === results.length - 1 ? 0 : prevIndex + 1
    })
  }, [results.length])

  /**
   * Select the currently highlighted result
   * Calls onSelect callback and closes dropdown
   */
  const selectHighlighted = useCallback(() => {
    if (results.length > 0 && highlightedIndex >= 0 && highlightedIndex < results.length) {
      const selectedProduct = results[highlightedIndex]
      onSelect(selectedProduct)
      onClose()
    }
  }, [results, highlightedIndex, onSelect, onClose])

  /**
   * Reset the dropdown state
   * Called when dropdown closes or results change
   */
  const reset = useCallback(() => {
    setHighlightedIndex(0)
  }, [])

  // Reset highlighted index when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  // Reset highlighted index when results change
  useEffect(() => {
    if (results.length !== prevResultsLengthRef.current) {
      prevResultsLengthRef.current = results.length
      reset()
    }
  }, [results.length, reset])

  // Ensure highlighted index is valid when results change
  useEffect(() => {
    if (results.length > 0 && highlightedIndex >= results.length) {
      setHighlightedIndex(Math.max(0, results.length - 1))
    }
  }, [results.length, highlightedIndex])

  return {
    highlightedIndex,
    moveUp,
    moveDown,
    selectHighlighted,
    reset
  }
}
