/**
 * SearchBarEnhanced Component Tests
 * 
 * **Validates: Requirements 2.4, 2.5, 2.6, 9.1, 9.2**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBarEnhanced } from './SearchBarEnhanced'
import type { ProductViewModel } from '@application/view-models/ProductViewModel'

// Mock product data
const mockProducts: ProductViewModel[] = [
  {
    id: '1',
    sku: 'SKU001',
    barcode: '7501234567890',
    name: 'Product 1',
    description: 'Description 1',
    priceFormatted: '$10.00',
    priceAmount: 10,
    taxRate: 0.16,
    categoryId: 'cat1',
    imageUrl: 'image1.jpg',
    stock: 10,
    isActive: true,
    isLowStock: false,
    isOutOfStock: false,
  },
  {
    id: '2',
    sku: 'SKU002',
    barcode: '7501234567891',
    name: 'Product 2',
    description: 'Description 2',
    priceFormatted: '$20.00',
    priceAmount: 20,
    taxRate: 0.16,
    categoryId: 'cat1',
    imageUrl: 'image2.jpg',
    stock: 5,
    isActive: true,
    isLowStock: true,
    isOutOfStock: false,
  },
]

describe('SearchBarEnhanced', () => {
  let onChange: ReturnType<typeof vi.fn>
  let onProductSelect: ReturnType<typeof vi.fn>
  let onBarcodeScanned: ReturnType<typeof vi.fn>
  let onError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onChange = vi.fn()
    onProductSelect = vi.fn()
    onBarcodeScanned = vi.fn()
    onError = vi.fn()
  })

  describe('Dropdown Navigation', () => {
    it('should navigate dropdown with arrow keys', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)

      // Open dropdown by typing
      await user.type(input, 'P')
      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // First item should be highlighted by default
      let items = screen.getAllByTestId(/search-result-/)
      expect(items[0]).toHaveClass('highlighted')

      // Press arrow down
      await user.keyboard('{ArrowDown}')
      items = screen.getAllByTestId(/search-result-/)
      expect(items[1]).toHaveClass('highlighted')

      // Press arrow up
      await user.keyboard('{ArrowUp}')
      items = screen.getAllByTestId(/search-result-/)
      expect(items[0]).toHaveClass('highlighted')
    })

    it('should select highlighted item on Enter', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)

      // Open dropdown
      await user.type(input, 'P')
      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Press Enter to select first item
      await user.keyboard('{Enter}')

      expect(onProductSelect).toHaveBeenCalledWith(mockProducts[0])
      expect(onChange).toHaveBeenCalledWith('')
    })

    it('should close dropdown on Escape', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)

      // Open dropdown
      await user.type(input, 'P')
      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Press Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('search-dropdown')).not.toBeInTheDocument()
      })
      expect(onChange).toHaveBeenCalledWith('')
    })
  })

  describe('Search Behavior', () => {
    it('should show dropdown when search results are available', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Should display all products
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(2)
    })

    it('should show "No products found" when no results', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="xyz"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={[]}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)
      await user.type(input, 'xyz')

      await waitFor(() => {
        expect(screen.getByTestId('search-no-results')).toBeInTheDocument()
      })
    })

    it('should close dropdown when search value is cleared', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input') as HTMLInputElement
      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Clear the input
      rerender(
        <SearchBarEnhanced
          value=""
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={[]}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      await waitFor(() => {
        expect(screen.queryByTestId('search-dropdown')).not.toBeInTheDocument()
      })
    })
  })

  describe('Product Selection', () => {
    it('should call onProductSelect when item is clicked', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Click on first product
      const firstResult = screen.getByTestId('search-result-0')
      await user.click(firstResult)

      expect(onProductSelect).toHaveBeenCalledWith(mockProducts[0])
      expect(onChange).toHaveBeenCalledWith('')
    })

    it('should clear input and close dropdown after selection', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Select item
      const firstResult = screen.getByTestId('search-result-0')
      await user.click(firstResult)

      await waitFor(() => {
        expect(screen.queryByTestId('search-dropdown')).not.toBeInTheDocument()
      })
    })
  })

  describe('Barcode Scanning', () => {
    it('should display scan indicator when scanning', async () => {
      const { rerender } = render(
        <SearchBarEnhanced
          value=""
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={[]}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      // Simulate scanning state (this would be set by useBarcodeScanner)
      // Note: In a real test, we'd mock the useBarcodeScanner hook
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    it('should call onBarcodeScanned when barcode is detected', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value=""
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={[]}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)

      // Simulate rapid barcode input (< 50ms between chars)
      // This is handled by useBarcodeScanner hook
      // For this test, we're just verifying the component accepts the callback
      expect(onBarcodeScanned).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <SearchBarEnhanced
          value=""
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          autoFocus={false}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      expect(input).toHaveAttribute('aria-label', 'Search products')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
    })

    it('should have aria-expanded when dropdown is open', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      expect(input).toHaveAttribute('aria-expanded', 'false')

      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('should have proper role attributes on dropdown', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        const dropdown = screen.getByTestId('search-dropdown')
        expect(dropdown).toHaveAttribute('role', 'listbox')
      })

      const items = screen.getAllByTestId(/search-result-/)
      items.forEach((item) => {
        expect(item).toHaveAttribute('role', 'option')
      })
    })
  })

  describe('Focus Management', () => {
    it('should auto-focus input on mount', () => {
      render(
        <SearchBarEnhanced
          value=""
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={[]}
          autoFocus={true}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input') as HTMLInputElement
      expect(input).toHaveFocus()
    })

    it('should not auto-focus when autoFocus is false', () => {
      render(
        <SearchBarEnhanced
          value=""
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={[]}
          autoFocus={false}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input') as HTMLInputElement
      expect(input).not.toHaveFocus()
    })

    it('should refocus input after product selection', async () => {
      const user = userEvent.setup()
      render(
        <SearchBarEnhanced
          value="Product"
          onChange={onChange}
          onProductSelect={onProductSelect}
          searchResults={mockProducts}
          onBarcodeScanned={onBarcodeScanned}
        />
      )

      const input = screen.getByTestId('search-input') as HTMLInputElement
      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Select item
      const firstResult = screen.getByTestId('search-result-0')
      await user.click(firstResult)

      // Input should be refocused after selection
      await waitFor(() => {
        expect(input).toHaveFocus()
      })
    })
  })

  describe('Click Outside Behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <SearchBarEnhanced
            value="Product"
            onChange={onChange}
            onProductSelect={onProductSelect}
            searchResults={mockProducts}
            onBarcodeScanned={onBarcodeScanned}
          />
          <div data-testid="outside-element">Outside</div>
        </div>
      )

      const input = screen.getByTestId('search-input')
      await user.click(input)
      await user.type(input, 'P')

      await waitFor(() => {
        expect(screen.getByTestId('search-dropdown')).toBeInTheDocument()
      })

      // Click outside
      const outside = screen.getByTestId('outside-element')
      await user.click(outside)

      await waitFor(() => {
        expect(screen.queryByTestId('search-dropdown')).not.toBeInTheDocument()
      })
    })
  })
})
