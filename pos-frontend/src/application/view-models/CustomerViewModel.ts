/**
 * Customer View Model
 * 
 * Presentation-layer representation of a customer with formatted data
 * for display in the UI.
 */

import { Customer } from '@domain/entities/Customer'

export interface CustomerViewModel {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  displayName: string
  displayPhone: string
  displayEmail: string
  isRecent: boolean
}

/**
 * Convert a Customer entity to a CustomerViewModel
 */
export function toCustomerViewModel(
  customer: Customer,
  isRecent: boolean = false
): CustomerViewModel {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    displayName: customer.name,
    displayPhone: customer.phone || '—',
    displayEmail: customer.email || '—',
    isRecent,
  }
}
