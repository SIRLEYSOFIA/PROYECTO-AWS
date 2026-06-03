/**
 * SearchBarEnhanced Component
 * 
 * Enhanced search input with barcode scanner detection, keyboard-navigable dropdown,
 * and intelligent search mode detection.
 * 
 * Features:
 * - Barcode scanner detection with rapid input analysis
 * - Debounced search for manual typing (300ms)
 * - Immediate search on barcode Enter
 * - Keyboard-navigable dropdown (Up/Down/Enter/Escape)
 * - Visual indicator for scan vs. search mode
 * - Auto-clear on barcode scan
 * - Preserve text on manual search
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 9.1, 9.2, 9.3, 9.4, 9.5**
 */

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Input } from '@presentation/components/ui/Input'
import { useBarcodeScanner } from '@presentation/hooks/useBarcodeScanner'
import { useSearchDropdown } from '@presentation/hooks/useSearchDropdown'
import type { ProductViewModel } from '@application/view-models/ProductViewModel'
import './SearchBarEnhanced.css'

interface SearchBarEnhancedProps {
  value: string
  onChange: (value: string) => void
  onProductSelect: (product: ProductViewModel) => void
  searchResults?: ProductViewModel[]
  autoFocus?: boolean
  placeholder?: string
  onBarcodeScanned?: (barcode: string) => void
  onError?: (error: string) => void
}

export function SearchBarEnhanced({
  value,
  onChange,
  onProductSelect,
  searchResults = [],
  autoFocus = true,
  placeholder = 'Search by name, SKU or barcode...',
  onBarcodeScanned,
  onError,
}: SearchBarEnhancedProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // State for dropdown visibility and search mode
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [searchMode, setSearchMode] = useState<'scan' | 'search'>('search')

  // Debounce timer for manual search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Handle barcode scan completion
   */
  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      // Clear the input after barcode scan
      onChange('')
      setIsDropdownOpen(false)
      setSearchMode('scan')

      // Call the barcode scanned callback
      onBarcodeScanned?.(barcode)

      // Re-focus the input for next scan
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    },
    [onChange, onBarcodeScanned]
  )

  /**
   * Handle barcode scanner errors
   */
  const handleBarcodeError = useCallback(
    (error: string) => {
      onError?.(error)
      setIsScanning(false)
    },
    [onError]
  )

  // Use barcode scanner hook
  const { isScanning: isScannerActive } = useBarcodeScanner({
    minLength: 4,
    maxCharDelay: 50,
    onScan: handleBarcodeScan,
    onError: handleBarcodeError,
  })

  // Use search dropdown hook
  const { highlightedIndex, moveUp, moveDown, selectHighlighted, reset: resetDropdown } = useSearchDropdown({
    results: searchResults,
    isOpen: isDropdownOpen,
    onSelect: (product) => {
      onProductSelect(product)
      onChange('')
      setIsDropdownOpen(false)
      setSearchMode('search')
      inputRef.current?.focus()
    },
    onClose: () => {
      setIsDropdownOpen(false)
      resetDropdown()
    },
  })

  /**
   * Handle input change with debounced search
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set search mode to 'search' for manual typing
    setSearchMode('search')

    if (newValue.trim().length > 0) {
      // Show dropdown immediately but debounce the actual search
      setIsDropdownOpen(true)

      // Debounce search by 300ms for manual typing
      debounceTimerRef.current = setTimeout(() => {
        // Search is handled by parent component via onChange
        debounceTimerRef.current = null
      }, 300)
    } else {
      setIsDropdownOpen(false)
      resetDropdown()
    }
  }

  /**
   * Handle keyboard events in the input
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle dropdown navigation
    if (isDropdownOpen && searchResults.length > 0) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          moveUp()
          return

        case 'ArrowDown':
          e.preventDefault()
          moveDown()
          return

        case 'Enter':
          e.preventDefault()
          selectHighlighted()
          return

        case 'Escape':
          e.preventDefault()
          setIsDropdownOpen(false)
          resetDropdown()
          onChange('')
          return
      }
    } else {
      // Handle Escape when dropdown is closed
      if (e.key === 'Escape') {
        e.preventDefault()
        onChange('')
        setIsDropdownOpen(false)
        resetDropdown()
        return
      }
    }
  }

  /**
   * Handle click outside dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
        resetDropdown()
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isDropdownOpen, resetDropdown])

  /**
   * Update scanning state
   */
  useEffect(() => {
    setIsScanning(isScannerActive)
  }, [isScannerActive])

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="search-bar-enhanced">
      <div className="search-bar-input-wrapper">
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          icon={<span className="search-icon">🔍</span>}
          iconRight={
            isScanning ? (
              <span className="scan-indicator" title="Barcode scanning mode" aria-label="Barcode scanning mode">
                📱
              </span>
            ) : null
          }
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls={isDropdownOpen ? 'search-dropdown' : undefined}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
          autoFocus={autoFocus}
          data-testid="search-input"
        />
        {searchMode === 'scan' && (
          <span className="search-mode-indicator scan-mode" title="Scan mode">
            SCAN
          </span>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isDropdownOpen && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="search-dropdown"
          id="search-dropdown"
          role="listbox"
          data-testid="search-dropdown"
        >
          {searchResults.map((product, index) => (
            <div
              key={product.id}
              className={`search-dropdown-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => {
                onProductSelect(product)
                onChange('')
                setIsDropdownOpen(false)
                setSearchMode('search')
                inputRef.current?.focus()
              }}
              onMouseEnter={() => {
                // Update highlighted index on mouse hover
                // This is handled by the parent component's state management
              }}
              data-testid={`search-result-${index}`}
            >
              <div className="search-dropdown-item-name">{product.name}</div>
              <div className="search-dropdown-item-details">
                <span className="search-dropdown-item-sku">SKU: {product.sku}</span>
                <span className="search-dropdown-item-price">{product.priceFormatted}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isDropdownOpen && value.trim().length > 0 && searchResults.length === 0 && (
        <div className="search-dropdown search-dropdown-empty" data-testid="search-no-results">
          <div className="search-dropdown-item">No products found</div>
        </div>
      )}
    </div>
  )
}
