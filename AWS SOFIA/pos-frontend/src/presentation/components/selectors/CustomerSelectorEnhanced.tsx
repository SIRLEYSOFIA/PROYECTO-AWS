/**
 * CustomerSelectorEnhanced Component
 * 
 * Searchable dropdown for customer selection with keyboard navigation.
 * 
 * Features:
 * - Searchable dropdown with keyboard navigation (Up/Down/Enter/Escape)
 * - Filter customers by name, ID, or phone
 * - Display recent customers at the top
 * - Auto-focus support
 * - Keyboard-navigable results
 * - Visual focus indicators for keyboard users
 * 
 * **Validates: Requirements 4.2, 4.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.7**
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@presentation/components/ui/Input'
import { useSearchDropdown } from '@presentation/hooks/useSearchDropdown'
import type { Customer } from '@domain/entities/Customer'
import './CustomerSelectorEnhanced.css'

interface CustomerSelectorEnhancedProps {
  value: Customer | null
  onChange: (customer: Customer | null) => void
  customers: Customer[]
  autoFocus?: boolean
  placeholder?: string
  onError?: (error: string) => void
  recentCustomerIds?: string[]
}

/**
 * Convert Customer to a format compatible with useSearchDropdown
 */
interface CustomerViewModel {
  id: string
  name: string
  phone?: string
  email?: string
  isRecent?: boolean
}

export function CustomerSelectorEnhanced({
  value,
  onChange,
  customers,
  autoFocus = false,
  placeholder = 'Search customer by name, ID or phone...',
  onError,
  recentCustomerIds = [],
}: CustomerSelectorEnhancedProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // State for dropdown visibility and search
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  /**
   * Filter and sort customers based on search query
   * Recent customers appear at the top
   */
  const filteredCustomers = useMemo(() => {
    let results: CustomerViewModel[] = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      isRecent: recentCustomerIds.includes(customer.id),
    }))

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.id.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query)
      )
    }

    // Sort: recent customers first, then by name
    results.sort((a, b) => {
      if (a.isRecent && !b.isRecent) return -1
      if (!a.isRecent && b.isRecent) return 1
      return a.name.localeCompare(b.name)
    })

    return results
  }, [customers, searchQuery, recentCustomerIds])

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    setHighlightedIndex(0)

    if (newValue.trim().length > 0) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }
  }

  /**
   * Handle customer selection
   */
  const handleSelectCustomer = useCallback(
    (customer: CustomerViewModel) => {
      const fullCustomer = customers.find((c) => c.id === customer.id)
      if (fullCustomer) {
        onChange(fullCustomer)
        setSearchQuery('')
        setIsDropdownOpen(false)
        setHighlightedIndex(0)
        inputRef.current?.blur()
      }
    },
    [customers, onChange]
  )

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDropdownOpen && filteredCustomers.length > 0) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredCustomers.length - 1))
          return

        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : 0))
          return

        case 'Enter':
          e.preventDefault()
          if (filteredCustomers[highlightedIndex]) {
            handleSelectCustomer(filteredCustomers[highlightedIndex])
          }
          return

        case 'Escape':
          e.preventDefault()
          setIsDropdownOpen(false)
          setSearchQuery('')
          setHighlightedIndex(0)
          return
      }
    } else {
      // Handle Escape when dropdown is closed
      if (e.key === 'Escape') {
        e.preventDefault()
        setSearchQuery('')
        setIsDropdownOpen(false)
        setHighlightedIndex(0)
        return
      }

      // Handle Enter to open dropdown
      if (e.key === 'Enter' && !isDropdownOpen) {
        e.preventDefault()
        setIsDropdownOpen(true)
        return
      }
    }
  }

  /**
   * Handle focus on input
   */
  const handleFocus = () => {
    if (searchQuery.trim().length > 0 || filteredCustomers.length > 0) {
      setIsDropdownOpen(true)
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
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isDropdownOpen])

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
          placeholder={value ? value.name : placeholder}
          icon={<span className="customer-icon">👥</span>}
          aria-label="Select customer"
          aria-autocomplete="list"
          aria-controls={isDropdownOpen ? 'customer-dropdown' : undefined}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
          autoFocus={autoFocus}
          data-testid="customer-selector-input"
        />
      </div>

      {/* Customer Results Dropdown */}
      {isDropdownOpen && filteredCustomers.length > 0 && (
        <div
          ref={dropdownRef}
          className="customer-dropdown"
          id="customer-dropdown"
          role="listbox"
          data-testid="customer-dropdown"
        >
          {filteredCustomers.map((customer, index) => (
            <div
              key={customer.id}
              className={`customer-dropdown-item ${index === highlightedIndex ? 'highlighted' : ''} ${
                customer.isRecent ? 'recent' : ''
              }`}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelectCustomer(customer)}
              onMouseEnter={() => setHighlightedIndex(index)}
              data-testid={`customer-result-${index}`}
            >
              <div className="customer-dropdown-item-header">
                <div className="customer-dropdown-item-name">{customer.name}</div>
                {customer.isRecent && <span className="customer-recent-badge">Recent</span>}
              </div>
              <div className="customer-dropdown-item-details">
                {customer.phone && <span className="customer-dropdown-item-phone">{customer.phone}</span>}
                {customer.email && <span className="customer-dropdown-item-email">{customer.email}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isDropdownOpen && searchQuery.trim().length > 0 && filteredCustomers.length === 0 && (
        <div className="customer-dropdown customer-dropdown-empty" data-testid="customer-no-results">
          <div className="customer-dropdown-item">No customers found</div>
        </div>
      )}

      {/* Selected Customer Display */}
      {value && !isDropdownOpen && (
        <div className="customer-selector-selected" data-testid="customer-selected">
          <span className="customer-selected-name">{value.name}</span>
          {value.phone && <span className="customer-selected-phone">({value.phone})</span>}
        </div>
      )}
    </div>
  )
}
