/**
 * CartTableEnhanced Component
 * 
 * Keyboard-optimized cart table with inline editing, Tab/Shift+Tab navigation,
 * and keyboard shortcuts for quantity adjustment and item removal.
 * 
 * Features:
 * - Tab/Shift+Tab navigation between cells
 * - Inline editable quantity and price fields
 * - Delete key to remove focused item
 * - Ctrl+Plus/Minus for quantity adjustment
 * - Inline action buttons (+, -, discount, remove)
 * - Focus indicators for keyboard users
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**
 */

import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { OrderItemViewModel } from '@application/view-models/OrderViewModel'
import './CartTableEnhanced.css'

interface CartTableEnhancedProps {
  items: OrderItemViewModel[]
  onQuantityChange: (itemId: string, quantity: number) => void
  onPriceChange: (itemId: string, price: number) => void
  onRemove: (itemId: string) => void
  onDiscount: (itemId: string) => void
  onFocusLost?: () => void
}

interface EditingState {
  itemId: string | null
  field: 'quantity' | 'price' | null
}

export function CartTableEnhanced({
  items,
  onQuantityChange,
  onPriceChange,
  onRemove,
  onDiscount,
  onFocusLost,
}: CartTableEnhancedProps) {
  const [editingState, setEditingState] = useState<EditingState>({ itemId: null, field: null })
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  /**
   * Handle quantity input change
   */
  const handleQuantityChange = useCallback(
    (itemId: string, value: string) => {
      const quantity = parseInt(value, 10)
      // Only call if valid (positive integer)
      if (!isNaN(quantity) && quantity > 0) {
        onQuantityChange(itemId, quantity)
      }
    },
    [onQuantityChange]
  )

  /**
   * Handle price input change
   */
  const handlePriceChange = useCallback(
    (itemId: string, value: string) => {
      const price = parseFloat(value)
      // Only call if valid (positive number)
      if (!isNaN(price) && price > 0) {
        onPriceChange(itemId, price)
      }
    },
    [onPriceChange]
  )

  /**
   * Handle keyboard events in editable fields
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, itemId: string, field: 'quantity' | 'price') => {
      const currentItemIndex = items.findIndex((item) => item.id === itemId)

      switch (e.key) {
        case 'Tab': {
          e.preventDefault()
          // Move to next field or next item
          if (field === 'quantity') {
            // Move to price field
            setEditingState({ itemId, field: 'price' })
            setTimeout(() => {
              const priceInput = inputRefs.current.get(`${itemId}-price`)
              priceInput?.focus()
            }, 0)
          } else if (field === 'price') {
            // Move to next item's quantity field
            if (currentItemIndex < items.length - 1) {
              const nextItemId = items[currentItemIndex + 1].id
              setEditingState({ itemId: nextItemId, field: 'quantity' })
              setTimeout(() => {
                const nextInput = inputRefs.current.get(`${nextItemId}-quantity`)
                nextInput?.focus()
              }, 0)
            } else {
              // Last item, blur
              setEditingState({ itemId: null, field: null })
              onFocusLost?.()
            }
          }
          break
        }

        case 'Shift+Tab':
        case 'Shift': {
          // Handle Shift+Tab
          if (e.shiftKey && e.key === 'Tab') {
            e.preventDefault()
            // Move to previous field or previous item
            if (field === 'price') {
              // Move to quantity field
              setEditingState({ itemId, field: 'quantity' })
              setTimeout(() => {
                const quantityInput = inputRefs.current.get(`${itemId}-quantity`)
                quantityInput?.focus()
              }, 0)
            } else if (field === 'quantity') {
              // Move to previous item's price field
              if (currentItemIndex > 0) {
                const prevItemId = items[currentItemIndex - 1].id
                setEditingState({ itemId: prevItemId, field: 'price' })
                setTimeout(() => {
                  const prevInput = inputRefs.current.get(`${prevItemId}-price`)
                  prevInput?.focus()
                }, 0)
              } else {
                // First item, blur
                setEditingState({ itemId: null, field: null })
                onFocusLost?.()
              }
            }
          }
          break
        }

        case 'Delete': {
          e.preventDefault()
          onRemove(itemId)
          break
        }

        case 'Enter': {
          e.preventDefault()
          // Blur the input
          setEditingState({ itemId: null, field: null })
          onFocusLost?.()
          break
        }

        case 'Escape': {
          e.preventDefault()
          // Blur the input
          setEditingState({ itemId: null, field: null })
          onFocusLost?.()
          break
        }
      }
    },
    [items, onRemove, onFocusLost]
  )

  /**
   * Handle Ctrl+Plus/Minus for quantity adjustment
   */
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!focusedItemId) return

      const item = items.find((i) => i.id === focusedItemId)
      if (!item) return

      if (e.ctrlKey && e.key === '+') {
        e.preventDefault()
        onQuantityChange(focusedItemId, item.quantity + 1)
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault()
        if (item.quantity > 1) {
          onQuantityChange(focusedItemId, item.quantity - 1)
        }
      }
    },
    [focusedItemId, items, onQuantityChange]
  )

  /**
   * Set up global keyboard listener for Ctrl+Plus/Minus
   */
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [handleGlobalKeyDown])

  /**
   * Store input refs
   */
  const setInputRef = useCallback((itemId: string, field: string, element: HTMLInputElement | null) => {
    if (element) {
      inputRefs.current.set(`${itemId}-${field}`, element)
    } else {
      inputRefs.current.delete(`${itemId}-${field}`)
    }
  }, [])

  if (items.length === 0) {
    return (
      <div className="cart-table-enhanced cart-table-enhanced--empty">
        <p>No items in cart</p>
      </div>
    )
  }

  return (
    <div className="cart-table-enhanced">
      <table className="cart-table" role="table">
        <thead>
          <tr role="row">
            <th role="columnheader">Product</th>
            <th role="columnheader" className="cart-table-col-qty">
              Qty
            </th>
            <th role="columnheader" className="cart-table-col-price">
              Unit Price
            </th>
            <th role="columnheader" className="cart-table-col-discount">
              Discount
            </th>
            <th role="columnheader" className="cart-table-col-tax">
              Tax
            </th>
            <th role="columnheader" className="cart-table-col-subtotal">
              Subtotal
            </th>
            <th role="columnheader" className="cart-table-col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              role="row"
              className={`cart-table-row ${focusedItemId === item.id ? 'focused' : ''}`}
              onMouseEnter={() => setFocusedItemId(item.id)}
              onMouseLeave={() => setFocusedItemId(null)}
              data-testid={`cart-item-${index}`}
            >
              {/* Product Name */}
              <td role="cell" className="cart-table-col-name">
                <div className="cart-item-name">{item.productName}</div>
                <div className="cart-item-sku">{item.productSku}</div>
              </td>

              {/* Quantity */}
              <td role="cell" className="cart-table-col-qty">
                <input
                  ref={(el) => setInputRef(item.id, 'quantity', el)}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, item.id, 'quantity')}
                  onFocus={() => {
                    setFocusedItemId(item.id)
                    setEditingState({ itemId: item.id, field: 'quantity' })
                  }}
                  onBlur={() => {
                    setEditingState({ itemId: null, field: null })
                  }}
                  className="cart-table-input"
                  aria-label={`Quantity for ${item.productName}`}
                  data-testid={`quantity-input-${index}`}
                />
              </td>

              {/* Unit Price */}
              <td role="cell" className="cart-table-col-price">
                <input
                  ref={(el) => setInputRef(item.id, 'price', el)}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPriceAmount}
                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, item.id, 'price')}
                  onFocus={() => {
                    setFocusedItemId(item.id)
                    setEditingState({ itemId: item.id, field: 'price' })
                  }}
                  onBlur={() => {
                    setEditingState({ itemId: null, field: null })
                  }}
                  className="cart-table-input"
                  aria-label={`Unit price for ${item.productName}`}
                  data-testid={`price-input-${index}`}
                />
              </td>

              {/* Discount */}
              <td role="cell" className="cart-table-col-discount">
                {item.hasDiscount ? (
                  <span className="discount-badge">{item.discountLabel}</span>
                ) : (
                  <span className="discount-none">—</span>
                )}
              </td>

              {/* Tax */}
              <td role="cell" className="cart-table-col-tax">
                <span className="tax-amount">
                  {(item.lineTotalAmount * 0.16).toFixed(2)}
                </span>
              </td>

              {/* Subtotal */}
              <td role="cell" className="cart-table-col-subtotal">
                <span className="subtotal-amount">{item.lineTotalFormatted}</span>
              </td>

              {/* Actions */}
              <td role="cell" className="cart-table-col-actions">
                <div className="cart-item-actions">
                  <button
                    className="cart-action-btn cart-action-btn--increase"
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.productName}`}
                    title="Increase quantity (Ctrl+Plus)"
                    data-testid={`increase-btn-${index}`}
                  >
                    +
                  </button>

                  <button
                    className="cart-action-btn cart-action-btn--decrease"
                    onClick={() => {
                      if (item.quantity > 1) {
                        onQuantityChange(item.id, item.quantity - 1)
                      }
                    }}
                    aria-label={`Decrease quantity of ${item.productName}`}
                    title="Decrease quantity (Ctrl+Minus)"
                    data-testid={`decrease-btn-${index}`}
                  >
                    −
                  </button>

                  <button
                    className="cart-action-btn cart-action-btn--discount"
                    onClick={() => onDiscount(item.id)}
                    aria-label={`Apply discount to ${item.productName}`}
                    title="Apply discount"
                    data-testid={`discount-btn-${index}`}
                  >
                    🏷️
                  </button>

                  <button
                    className="cart-action-btn cart-action-btn--remove"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.productName} from cart`}
                    title="Remove item (Delete)"
                    data-testid={`remove-btn-${index}`}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
