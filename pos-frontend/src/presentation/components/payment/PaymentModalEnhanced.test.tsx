/**
 * PaymentModalEnhanced Component Tests
 * 
 * **Validates: Requirements 11.1, 11.3, 11.4, 11.5**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentModalEnhanced } from './PaymentModalEnhanced'

// Mock the usePayment hook
vi.mock('@presentation/hooks/usePayment', () => ({
  usePayment: () => ({
    pay: vi.fn().mockResolvedValue(undefined),
    processing: false,
    error: null,
    setError: vi.fn(),
  }),
}))

describe('PaymentModalEnhanced', () => {
  let onClose: ReturnType<typeof vi.fn>
  let onPaymentComplete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onClose = vi.fn()
    onPaymentComplete = vi.fn()
  })

  describe('Rendering', () => {
    it('should render payment modal when open', () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      // Check for payment methods which are inside the modal
      expect(screen.getByTestId('payment-method-cash')).toBeInTheDocument()
    })

    it('should display payment methods', () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      expect(screen.getByTestId('payment-method-cash')).toBeInTheDocument()
      expect(screen.getByTestId('payment-method-card')).toBeInTheDocument()
      expect(screen.getByTestId('payment-method-qr')).toBeInTheDocument()
    })

    it('should display cash input by default', () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      expect(screen.getByTestId('cash-amount-input')).toBeInTheDocument()
    })
  })

  describe('Payment Method Switching', () => {
    it('should switch to card method when card button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cardButton = screen.getByTestId('payment-method-card')
      await user.click(cardButton)

      expect(cardButton).toHaveClass('active')
      expect(screen.queryByTestId('cash-amount-input')).not.toBeInTheDocument()
    })

    it('should switch payment methods with number keys', async () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cashButton = screen.getByTestId('payment-method-cash')

      // Press 2 to switch to card
      fireEvent.keyDown(cashButton, { key: '2' })
      await waitFor(() => {
        expect(screen.getByTestId('payment-method-card')).toHaveClass('active')
      })

      // Press 3 to switch to QR
      fireEvent.keyDown(cashButton, { key: '3' })
      await waitFor(() => {
        expect(screen.getByTestId('payment-method-qr')).toHaveClass('active')
      })

      // Press 1 to switch back to cash
      fireEvent.keyDown(cashButton, { key: '1' })
      await waitFor(() => {
        expect(screen.getByTestId('payment-method-cash')).toHaveClass('active')
      })
    })
  })

  describe('Cash Payment', () => {
    it('should display change calculation', async () => {
      const user = userEvent.setup()
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cashInput = screen.getByTestId('cash-amount-input') as HTMLInputElement
      await user.click(cashInput)
      fireEvent.change(cashInput, { target: { value: '150' } })

      await waitFor(() => {
        expect(screen.getByTestId('change-amount')).toHaveTextContent('$50.00')
      })
    })

    it('should show insufficient warning when cash is less than total', async () => {
      const user = userEvent.setup()
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cashInput = screen.getByTestId('cash-amount-input') as HTMLInputElement
      await user.click(cashInput)
      fireEvent.change(cashInput, { target: { value: '50' } })

      await waitFor(() => {
        expect(screen.getByTestId('change-amount')).toHaveTextContent('⚠️ Insufficient')
      })
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should close modal on Escape key', async () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cashButton = screen.getByTestId('payment-method-cash')
      fireEvent.keyDown(cashButton, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should have keyboard shortcuts hint', () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      expect(screen.getByText(/Shortcuts:/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      expect(screen.getByLabelText(/Amount received in cash/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Cash \(Press 1\)/)).toBeInTheDocument()
    })

    it('should have proper role attributes', () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      // The Modal component has role="dialog", and our inner div also has role="dialog"
      // Just verify that at least one dialog role exists
      const dialogs = screen.getAllByRole('dialog')
      expect(dialogs.length).toBeGreaterThan(0)
    })
  })

  describe('Focus Management', () => {
    it('should auto-focus cash input when cash method is selected', async () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cashInput = screen.getByTestId('cash-amount-input') as HTMLInputElement
      await waitFor(() => {
        expect(cashInput).toHaveFocus()
      })
    })

    it('should auto-focus confirm button when card method is selected', async () => {
      const user = userEvent.setup()
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cardButton = screen.getByTestId('payment-method-card')
      await user.click(cardButton)

      const confirmButton = screen.getByTestId('confirm-button') as HTMLButtonElement
      await waitFor(() => {
        expect(confirmButton).toHaveFocus()
      })
    })
  })

  describe('Button States', () => {
    it('should disable confirm button when cash is insufficient', async () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cashInput = screen.getByTestId('cash-amount-input') as HTMLInputElement
      fireEvent.change(cashInput, { target: { value: '50' } })

      const confirmButton = screen.getByTestId('confirm-button') as HTMLButtonElement
      await waitFor(() => {
        expect(confirmButton).toBeDisabled()
      })
    })

    it('should enable confirm button when cash is sufficient', async () => {
      render(
        <PaymentModalEnhanced
          isOpen={true}
          onClose={onClose}
          totalAmount={100}
          totalFormatted="$100.00"
          onPaymentComplete={onPaymentComplete}
        />
      )

      const cashInput = screen.getByTestId('cash-amount-input') as HTMLInputElement
      fireEvent.change(cashInput, { target: { value: '150' } })

      const confirmButton = screen.getByTestId('confirm-button') as HTMLButtonElement
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled()
      })
    })
  })
})
