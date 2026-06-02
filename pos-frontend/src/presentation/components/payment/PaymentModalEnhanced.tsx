/**
 * PaymentModalEnhanced Component
 * 
 * Enhanced payment modal with keyboard-optimized flow, auto-focus management,
 * and keyboard shortcuts for payment method switching.
 * 
 * Features:
 * - Auto-focus on amount input (cash) or confirm button (card/QR)
 * - Number keys 1/2/3 to switch payment methods
 * - Enter to confirm payment
 * - Escape to cancel
 * - Tab navigation between fields
 * - Loading state with disabled inputs
 * 
 * **Validates: Requirements 5.3, 5.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Modal } from '@presentation/components/ui/Modal'
import { Button } from '@presentation/components/ui/Button'
import { Input } from '@presentation/components/ui/Input'
import { Spinner } from '@presentation/components/ui/Spinner'
import { usePayment } from '@presentation/hooks/usePayment'
import { useAutoFocus } from '@presentation/hooks/useAutoFocus'
import type { PaymentMethod } from '@domain/value-objects/OrderStatus'
import './PaymentModalEnhanced.css'

interface PaymentModalEnhancedProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  totalFormatted: string
  onPaymentComplete?: (success: boolean) => void
}

const METHODS: { id: PaymentMethod; label: string; icon: string; key: string }[] = [
  { id: 'cash', label: 'Cash', icon: '💵', key: '1' },
  { id: 'card', label: 'Card', icon: '💳', key: '2' },
  { id: 'qr', label: 'QR Code', icon: '📱', key: '3' },
]

export function PaymentModalEnhanced({
  isOpen,
  onClose,
  totalAmount,
  totalFormatted,
  onPaymentComplete,
}: PaymentModalEnhancedProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')

  const { pay, processing, error, setError } = usePayment()

  // Refs for focus management
  const cashInputRef = useRef<HTMLInputElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Use auto-focus hook
  const { focus: focusCashInput } = useAutoFocus({
    targetRef: cashInputRef,
    enabled: isOpen && method === 'cash',
    delay: 50,
  })

  const { focus: focusConfirmButton } = useAutoFocus({
    targetRef: confirmButtonRef,
    enabled: isOpen && method !== 'cash',
    delay: 50,
  })

  // Calculate change
  const cashAmount = parseFloat(cashReceived) || 0
  const change = method === 'cash' ? Math.max(0, cashAmount - totalAmount) : 0
  const canPay = method !== 'cash' || cashAmount >= totalAmount

  /**
   * Handle payment confirmation
   */
  const handlePay = useCallback(async () => {
    try {
      await pay(method, method === 'cash' ? cashAmount : undefined)
      onPaymentComplete?.(true)
    } catch (err) {
      onPaymentComplete?.(false)
    }
  }, [pay, method, cashAmount, onPaymentComplete])

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    setCashReceived('')
    setError(null)
    onClose()
  }, [onClose, setError])

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Number keys 1/2/3 to switch payment methods
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        e.preventDefault()
        const methodIndex = parseInt(e.key, 10) - 1
        if (methodIndex < METHODS.length) {
          setMethod(METHODS[methodIndex].id)
          setError(null)
        }
        return
      }

      // Enter to confirm payment
      if (e.key === 'Enter' && canPay && !processing) {
        e.preventDefault()
        handlePay()
        return
      }

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }
    },
    [canPay, processing, handlePay, handleClose, setError]
  )

  /**
   * Auto-focus on mount or when method changes
   */
  useEffect(() => {
    if (isOpen) {
      if (method === 'cash') {
        focusCashInput()
      } else {
        focusConfirmButton()
      }
    }
  }, [isOpen, method, focusCashInput, focusConfirmButton])

  /**
   * Handle cash input change
   */
  const handleCashChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCashReceived(e.target.value)
  }, [])

  /**
   * Handle method button click
   */
  const handleMethodClick = useCallback((methodId: PaymentMethod) => {
    setMethod(methodId)
    setError(null)
  }, [setError])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Process Payment — ${totalFormatted}`}
      size="md"
      data-testid="payment-modal-enhanced"
    >
      <div
        ref={modalRef}
        className="payment-modal-enhanced"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Payment modal"
      >
        {/* Payment Method Selector */}
        <div className="payment-methods-enhanced">
          <div className="payment-methods-label">Payment Method (Press 1, 2, or 3):</div>
          <div className="payment-methods-buttons">
            {METHODS.map((m) => (
              <button
                key={m.id}
                className={`payment-method-btn-enhanced ${method === m.id ? 'active' : ''}`}
                onClick={() => handleMethodClick(m.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleMethodClick(m.id)
                  }
                }}
                aria-pressed={method === m.id}
                aria-label={`${m.label} (Press ${m.key})`}
                title={`${m.label} (Press ${m.key})`}
                data-testid={`payment-method-${m.id}`}
              >
                <span className="payment-method-icon">{m.icon}</span>
                <span className="payment-method-label">{m.label}</span>
                <span className="payment-method-key">{m.key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash Input Section */}
        {method === 'cash' && (
          <div className="cash-section-enhanced">
            <Input
              ref={cashInputRef}
              label="Amount Received ($)"
              type="number"
              min={totalAmount}
              step="0.01"
              value={cashReceived}
              onChange={handleCashChange}
              placeholder={totalAmount.toFixed(2)}
              disabled={processing}
              aria-label="Amount received in cash"
              data-testid="cash-amount-input"
            />
            <div className="change-display-enhanced">
              <span className="change-label">Change:</span>
              <span
                className={`change-amount ${
                  cashAmount > 0 && cashAmount < totalAmount ? 'change-insufficient' : ''
                }`}
                aria-live="polite"
                data-testid="change-amount"
              >
                {cashAmount > 0 && cashAmount < totalAmount
                  ? '⚠️ Insufficient'
                  : `$${change.toFixed(2)}`}
              </span>
            </div>
          </div>
        )}

        {/* Card Section */}
        {method === 'card' && (
          <div className="card-section-enhanced">
            {processing ? (
              <div className="card-waiting">
                <Spinner />
                <p>Processing card payment...</p>
              </div>
            ) : (
              <p className="card-instruction">💳 Present card to terminal and confirm</p>
            )}
          </div>
        )}

        {/* QR Section */}
        {method === 'qr' && (
          <div className="qr-section-enhanced">
            <div className="qr-placeholder" aria-label="QR code for payment">
              <div className="qr-mock">
                <div className="qr-inner">📱</div>
              </div>
              <p>Scan with your digital wallet</p>
              <p className="qr-amount">{totalFormatted}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="payment-error-enhanced" role="alert" data-testid="payment-error">
            ❌ {error}
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="payment-shortcuts-hint">
          <small>
            💡 Shortcuts: <kbd>1</kbd> Cash • <kbd>2</kbd> Card • <kbd>3</kbd> QR • <kbd>Enter</kbd> Confirm • <kbd>Esc</kbd> Cancel
          </small>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-enhanced">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={processing}
            aria-label="Cancel payment (Press Escape)"
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            ref={confirmButtonRef}
            variant="success"
            onClick={handlePay}
            disabled={!canPay || processing}
            loading={processing}
            aria-label="Confirm payment (Press Enter)"
            data-testid="confirm-button"
          >
            ✅ Confirm Payment
          </Button>
        </div>
      </div>
    </Modal>
  )
}
