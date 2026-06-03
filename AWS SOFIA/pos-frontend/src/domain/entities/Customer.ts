/**
 * Customer entity for POS system
 * Represents a customer who can be associated with orders
 */

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

/**
 * Create a new customer
 */
export function createCustomer(data: {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}): Customer {
  const now = new Date()
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  }
}
