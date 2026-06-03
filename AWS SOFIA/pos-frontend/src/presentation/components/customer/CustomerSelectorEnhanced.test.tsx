/**
 * CustomerSelectorEnhanced Component Tests
 * 
 * Tests for searchable customer selector with keyboard navigation
 * 
 * **Validates: Requirements 12.2, 12.3, 12.4, 12.7**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerSelectorEnhanced } from './CustomerSelectorEnhanced'
import { toCustomerViewModel } from '@application/view-models/CustomerViewModel'
import { mockCustomers } from '@infrastructure/mock/mockCustomers'

describe('CustomerSelectorEnhanced', () => {
  const mockOnChange = vi.fn()
  const mockOnCreateNew = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnCreateNew.mockClear()
  })

  describe('Rendering', () => {
    it('should render input field with placeholder', () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
          placeholder="Search customer..."
        />
      )

      const input = screen.getByTestId('customer-selector-input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Search customer...')
    })

    it('should display selected customer when value is provided', () => {
      const customer = toCustomerViewModel(mockCustomers[0])
      render(
        <CustomerSelectorEnhanced
          value={customer}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByTestId('customer-selected-display')).toBeInTheDocument()
      expect(screen.getByText(customer.displayName)).toBeInTheDocument()
    })

    it('should show selected indicator when customer is selected', () => {
      const customer = toCustomerViewModel(mockCustomers[0])
      render(
        <CustomerSelectorEnhanced
          value={customer}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    it('should auto-focus input when autoFocus prop is true', () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
          autoFocus={true}
        />
      )

      const input = screen.getByTestId('customer-selector-input')
      expect(input).toHaveFocus()
    })
  })

  describe('Search Functionality', () => {
    it('should show recent customers when dropdown opens without search query', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input')
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Should show recent customers (at least some)
      const items = screen.getAllByTestId(/customer-result-/)
      expect(items.length).toBeGreaterThan(0)
    })

    it('should filter customers by name', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, 'Juan')

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Should show Juan García
      expect(screen.getByText('Juan García')).toBeInTheDocument()
    })

    it('should filter customers by phone', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, '912')

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Should show customer with phone containing 912
      expect(screen.getByText('Juan García')).toBeInTheDocument()
    })

    it('should filter customers by ID', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, 'cust-001')

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Should show customer with ID cust-001
      expect(screen.getByText('Juan García')).toBeInTheDocument()
    })

    it('should show "No customers found" when search has no results', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, 'NonexistentCustomer')

      await waitFor(() => {
        expect(screen.getByTestId('customer-no-results')).toBeInTheDocument()
      })

      expect(screen.getByText('No customers found')).toBeInTheDocument()
    })

    it('should clear search and show recent customers when input is cleared', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, 'Juan')

      await waitFor(() => {
        expect(screen.getByText('Juan García')).toBeInTheDocument()
      })

      // Clear the input
      await userEvent.clear(input)

      await waitFor(() => {
        // Should show recent customers again
        const items = screen.getAllByTestId(/customer-result-/)
        expect(items.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate dropdown with arrow keys', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Get first item
      const firstItem = screen.getByTestId('customer-result-0')
      expect(firstItem).toHaveClass('highlighted')

      // Press arrow down
      await userEvent.keyboard('{ArrowDown}')

      // Second item should be highlighted
      const secondItem = screen.getByTestId('customer-result-1')
      expect(secondItem).toHaveClass('highlighted')
      expect(firstItem).not.toHaveClass('highlighted')

      // Press arrow up
      await userEvent.keyboard('{ArrowUp}')

      // First item should be highlighted again
      expect(firstItem).toHaveClass('highlighted')
      expect(secondItem).not.toHaveClass('highlighted')
    })

    it('should select highlighted customer on Enter key', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Press Enter to select first item
      await userEvent.keyboard('{Enter}')

      // onChange should be called with the first customer
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })

      const selectedCustomer = mockOnChange.mock.calls[0][0]
      expect(selectedCustomer.name).toBe(mockCustomers[0].name)
    })

    it('should close dropdown on Escape key', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Press Escape
      await userEvent.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('customer-dropdown')).not.toBeInTheDocument()
      })
    })

    it('should clear search query on Escape key', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, 'Juan')

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Press Escape
      await userEvent.keyboard('{Escape}')

      // Input should be cleared
      expect(input.value).toBe('')
    })

    it('should open quick creation modal on F2 key', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
          onCreateNew={mockOnCreateNew}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      // Press F2
      fireEvent.keyDown(input, { key: 'F2', code: 'F2' })

      expect(mockOnCreateNew).toHaveBeenCalled()
    })
  })

  describe('Mouse Interaction', () => {
    it('should select customer on click', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Click on first customer
      const firstItem = screen.getByTestId('customer-result-0')
      await userEvent.click(firstItem)

      expect(mockOnChange).toHaveBeenCalled()
      const selectedCustomer = mockOnChange.mock.calls[0][0]
      expect(selectedCustomer.name).toBe(mockCustomers[0].name)
    })

    it('should close dropdown when clicking outside', async () => {
      const { container } = render(
        <div>
          <CustomerSelectorEnhanced
            value={null}
            onChange={mockOnChange}
          />
          <div data-testid="outside-element">Outside</div>
        </div>
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Click outside
      const outsideElement = screen.getByTestId('outside-element')
      await userEvent.click(outsideElement)

      await waitFor(() => {
        expect(screen.queryByTestId('customer-dropdown')).not.toBeInTheDocument()
      })
    })

    it('should highlight customer on hover', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      const secondItem = screen.getByTestId('customer-result-1')
      await userEvent.hover(secondItem)

      // Item should be highlighted on hover
      expect(secondItem).toHaveClass('highlighted')
    })
  })

  describe('Recent Customers', () => {
    it('should display recent customers badge', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Recent customers should have star badge
      const badges = screen.getAllByText('⭐')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should not display recent badge for search results', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, 'Juan')

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      // Search results should not have star badge (or fewer badges)
      const badges = screen.queryAllByText('⭐')
      expect(badges.length).toBe(0)
    })
  })

  describe('F2 Hint', () => {
    it('should display F2 hint in dropdown footer', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      expect(screen.getByText('Press F2 to create new customer')).toBeInTheDocument()
    })

    it('should display F2 hint in no results message', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.type(input, 'NonexistentCustomer')

      await waitFor(() => {
        expect(screen.getByTestId('customer-no-results')).toBeInTheDocument()
      })

      expect(screen.getByText('Press F2 to create a new customer')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input')
      expect(input).toHaveAttribute('aria-label', 'Search customers')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
      expect(input).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update aria-expanded when dropdown opens', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input')
      expect(input).toHaveAttribute('aria-expanded', 'false')

      await userEvent.click(input)

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('should have proper role attributes on dropdown items', async () => {
      render(
        <CustomerSelectorEnhanced
          value={null}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByTestId('customer-selector-input') as HTMLInputElement
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument()
      })

      const dropdown = screen.getByTestId('customer-dropdown')
      expect(dropdown).toHaveAttribute('role', 'listbox')

      const items = screen.getAllByTestId(/customer-result-/)
      items.forEach((item) => {
        expect(item).toHaveAttribute('role', 'option')
      })
    })
  })
})
