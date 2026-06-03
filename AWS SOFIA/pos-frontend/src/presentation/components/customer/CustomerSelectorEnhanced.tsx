/**
 * CustomerSelectorEnhanced Component
 * 
 * Searchable dropdown for customer selection with keyboard navigation.
 * 
 * Features:
 * - Searchable dropdown with keyboard navigation
 * - Filter by name, ID, phone
 * - F2 handler to open quick creation modal
 * - Enter to select highlighted customer
 * - Escape to close dropdown
 * - Display recent customers at top
 * 
 * **Validates: Requirements 4.2, 4.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.7**
 */

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Input } from '@presentation/components/ui/Input'
import { useSearchDropdown } from '@presentation/hooks/useSearchDropdown'
import type { CustomerViewModel } from '@application/view-models/CustomerViewModel'
import { toCustomerViewModel } from '@application/view-models/CustomerViewModel'
import { getRecentCustomers, searchCustomers, mockCustomers } from '@infrastructure/mock/mockCustomers'
import './CustomerSelectorEnhanced.css'

interface CustomerSelectorEnhancedProps {
  value: CustomerViewModel | null
  onChange: (customer: CustomerViewModel | null) => void
  onCreateNew?: () => void
  autoFocus?: boolean
  placeholder?: string
  onError?: (error: string) => void
}

export function CustomerSelectorEnhanced({
  value,
  onChange,
  onCreateNew,
  autoFocus = false,
  placeholder = 'Search customer by name, ID or phone...',
  onError,
}: CustomerSelectorEnhancedProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // State for dropdown visibility and search
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayedCustomers, setDisplayedCustomers] = useState<CustomerViewModel[]>([])
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Debounce timer for search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Get customers to display: recent if no search, filtered if searching
   */
  const updateDisplayedCustomers = useCallback((query: string) => {
    if (!query.trim()) {
      // Show recent customers when no search query
      const recent = getRecentCustomers(mockCustomers)
      setDisplayedCustomers(recent.map((c) => toCustomerViewModel(c, true)))
    } else {
      // Show search results
      const results = searchCustomers(query, mockCustomers)
      setDisplayedCustomers(results.map((c) => toCustomerViewModel(c, false)))
    }
  }, [])

  /**
   * Use search dropdown hook for keyboard navigation
   */
  const { highlightedIndex, moveUp, moveDown, selectHighlighted, reset: resetDropdown } =
    useSearchDropdown({
      results: displayedCustomers,
      isOpen: isDropdownOpen,
      onSelect: (customerVM) => {
        onChange(customerVM as CustomerViewModel)
        setSearchQuery('')
        setIsDropdownOpen(false)
        inputRef.current?.focus()
      },
      onClose: () => {
        setIsDropdownOpen(false)
        resetDropdown()
      },
    })

  /**
   * Handle input focus — open dropdown with recent customers
   */
  const handleFocus = () => {
    setIsDropdownOpen(true)
    updateDisplayedCustomers(searchQuery)
  }

  /**
   * Handle input change with debounced search
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (newValue.trim().length > 0) {
      // Show dropdown immediately but debounce the actual search
      setIsDropdownOpen(true)

      // Debounce search by 300ms for manual typing
      debounceTimerRef.current = setTimeout(() => {
        updateDisplayedCustomers(newValue)
        debounceTimerRef.current = null
      }, 300)
    } else {
      // Show recent customers when search is cleared
      updateDisplayedCustomers('')
      setIsDropdownOpen(true)
    }
  }

  /**
   * Handle keyboard events in the input
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle F2 to open quick creation modal
    if (e.key === 'F2') {
      e.preventDefault()
      onCreateNew?.()
      return
    }

    // Handle dropdown navigation
    if (isDropdownOpen && displayedCustomers.length > 0) {
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
          setSearchQuery('')
          return
      }
    } else {
      // Handle Escape when dropdown is closed
      if (e.key === 'Escape') {
        e.preventDefault()
        setSearchQuery('')
        setIsDropdownOpen(false)
        resetDropdown()
        return
      }

      // Handle Enter when dropdown is closed (select current value)
      if (e.key === 'Enter' && value) {
        e.preventDefault()
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
   * Initialize displayed customers on mount
   */
  useEffect(() => {
    updateDisplayedCustomers('')
  }, [updateDisplayedCustomers])

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
    <div className="customer-selector-enhanced">
      <div className="customer-selector-input-wrapper">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          icon={<span className="customer-icon">👤</span>}
          aria-label="Search customers"
          aria-autocomplete="list"
          aria-controls={isDropdownOpen ? 'customer-dropdown' : undefined}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
          autoFocus={autoFocus}
          data-testid="customer-selector-input"
        />
        {value && (
          <span className="customer-selected-indicator" title={`Selected: ${value.displayName}`}>
            ✓
          </span>
        )}
      </div>

      {/* Selected Customer Display */}
      {value && !isDropdownOpen && (
        <div className="customer-selected-display" data-testid="customer-selected-display">
          <div className="customer-selected-name">{value.displayName}</div>
          {value.phone && <div className="customer-selected-phone">{value.displayPhone}</div>}
        </div>
      )}

      {/* Customer Dropdown */}
      {isDropdownOpen && displayedCustomers.length > 0 && (
        <div
          ref={dropdownRef}
          className="customer-dropdown"
          id="customer-dropdown"
          role="listbox"
          data-testid="customer-dropdown"
        >
          {displayedCustomers.map((customer, index) => (
            <div
              key={customer.id}
              className={`customer-dropdown-item ${(hoverIndex !== null ? hoverIndex : highlightedIndex) === index ? 'highlighted' : ''}`}
              role="option"
              aria-selected={(hoverIndex !== null ? hoverIndex : highlightedIndex) === index}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => {
                onChange(customer)
                setSearchQuery('')
                setIsDropdownOpen(false)
                setHoverIndex(null)
                inputRef.current?.focus()
              }}
              data-testid={`customer-result-${index}`}
            >
              <div className="customer-dropdown-item-name">{customer.displayName}</div>
              <div className="customer-dropdown-item-details">
                {customer.phone && (
                  <span className="customer-dropdown-item-phone">{customer.displayPhone}</span>
                )}
                {customer.email && (
                  <span className="customer-dropdown-item-email">{customer.displayEmail}</span>
                )}
              </div>
              {customer.isRecent && (
                <span className="customer-recent-badge" title="Recent customer">
                  ⭐
                </span>
              )}
            </div>
          ))}

          {/* F2 Hint */}
          <div className="customer-dropdown-footer">
            <span className="customer-f2-hint">Press F2 to create new customer</span>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {isDropdownOpen && searchQuery.trim().length > 0 && displayedCustomers.length === 0 && (
        <div className="customer-dropdown customer-dropdown-empty" data-testid="customer-no-results">
          <div className="customer-dropdown-item">
            <div className="customer-dropdown-item-name">No customers found</div>
            <div className="customer-dropdown-item-details">
              <span className="customer-no-results-hint">Press F2 to create a new customer</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
