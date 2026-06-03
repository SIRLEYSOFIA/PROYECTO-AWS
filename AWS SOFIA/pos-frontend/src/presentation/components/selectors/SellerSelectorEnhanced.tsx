/**
 * SellerSelectorEnhanced Component
 * 
 * Searchable dropdown for seller selection with keyboard navigation.
 * Implements identical behavior to CustomerSelectorEnhanced, adapted for seller data model.
 * 
 * Features:
 * - Searchable dropdown with keyboard navigation (Up/Down/Enter/Escape)
 * - Filter sellers by name, ID, or email
 * - Display recent sellers at the top
 * - Auto-focus support
 * - Keyboard-navigable results
 * - Visual focus indicators for keyboard users
 * 
 * **Validates: Requirements 4.6, 12.6, 12.7**
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@presentation/components/ui/Input'
import { useSearchDropdown } from '@presentation/hooks/useSearchDropdown'
import type { Seller } from '@domain/entities/Seller'
import './SellerSelectorEnhanced.css'

interface SellerSelectorEnhancedProps {
  value: Seller | null
  onChange: (seller: Seller | null) => void
  sellers: Seller[]
  autoFocus?: boolean
  placeholder?: string
  onError?: (error: string) => void
  recentSellerIds?: string[]
}

/**
 * Convert Seller to a format compatible with useSearchDropdown
 */
interface SellerViewModel {
  id: string
  name: string
  email?: string
  employeeId?: string
  isRecent?: boolean
}

export function SellerSelectorEnhanced({
  value,
  onChange,
  sellers,
  autoFocus = false,
  placeholder = 'Search seller by name, ID or email...',
  onError,
  recentSellerIds = [],
}: SellerSelectorEnhancedProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // State for dropdown visibility and search
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  /**
   * Filter and sort sellers based on search query
   * Recent sellers appear at the top
   */
  const filteredSellers = useMemo(() => {
    let results: SellerViewModel[] = sellers.map((seller) => ({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      employeeId: seller.employeeId,
      isRecent: recentSellerIds.includes(seller.id),
    }))

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (seller) =>
          seller.name.toLowerCase().includes(query) ||
          seller.id.toLowerCase().includes(query) ||
          seller.email?.toLowerCase().includes(query) ||
          seller.employeeId?.toLowerCase().includes(query)
      )
    }

    // Sort: recent sellers first, then by name
    results.sort((a, b) => {
      if (a.isRecent && !b.isRecent) return -1
      if (!a.isRecent && b.isRecent) return 1
      return a.name.localeCompare(b.name)
    })

    return results
  }, [sellers, searchQuery, recentSellerIds])

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
   * Handle seller selection
   */
  const handleSelectSeller = useCallback(
    (seller: SellerViewModel) => {
      const fullSeller = sellers.find((s) => s.id === seller.id)
      if (fullSeller) {
        onChange(fullSeller)
        setSearchQuery('')
        setIsDropdownOpen(false)
        setHighlightedIndex(0)
        inputRef.current?.blur()
      }
    },
    [sellers, onChange]
  )

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDropdownOpen && filteredSellers.length > 0) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredSellers.length - 1))
          return

        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < filteredSellers.length - 1 ? prev + 1 : 0))
          return

        case 'Enter':
          e.preventDefault()
          if (filteredSellers[highlightedIndex]) {
            handleSelectSeller(filteredSellers[highlightedIndex])
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
    if (searchQuery.trim().length > 0 || filteredSellers.length > 0) {
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
    <div className="seller-selector-enhanced">
      <div className="seller-selector-input-wrapper">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={value ? value.name : placeholder}
          icon={<span className="seller-icon">👤</span>}
          aria-label="Select seller"
          aria-autocomplete="list"
          aria-controls={isDropdownOpen ? 'seller-dropdown' : undefined}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
          autoFocus={autoFocus}
          data-testid="seller-selector-input"
        />
      </div>

      {/* Seller Results Dropdown */}
      {isDropdownOpen && filteredSellers.length > 0 && (
        <div
          ref={dropdownRef}
          className="seller-dropdown"
          id="seller-dropdown"
          role="listbox"
          data-testid="seller-dropdown"
        >
          {filteredSellers.map((seller, index) => (
            <div
              key={seller.id}
              className={`seller-dropdown-item ${index === highlightedIndex ? 'highlighted' : ''} ${
                seller.isRecent ? 'recent' : ''
              }`}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelectSeller(seller)}
              onMouseEnter={() => setHighlightedIndex(index)}
              data-testid={`seller-result-${index}`}
            >
              <div className="seller-dropdown-item-header">
                <div className="seller-dropdown-item-name">{seller.name}</div>
                {seller.isRecent && <span className="seller-recent-badge">Recent</span>}
              </div>
              <div className="seller-dropdown-item-details">
                {seller.employeeId && <span className="seller-dropdown-item-id">ID: {seller.employeeId}</span>}
                {seller.email && <span className="seller-dropdown-item-email">{seller.email}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isDropdownOpen && searchQuery.trim().length > 0 && filteredSellers.length === 0 && (
        <div className="seller-dropdown seller-dropdown-empty" data-testid="seller-no-results">
          <div className="seller-dropdown-item">No sellers found</div>
        </div>
      )}

      {/* Selected Seller Display */}
      {value && !isDropdownOpen && (
        <div className="seller-selector-selected" data-testid="seller-selected">
          <span className="seller-selected-name">{value.name}</span>
          {value.employeeId && <span className="seller-selected-id">({value.employeeId})</span>}
        </div>
      )}
    </div>
  )
}
