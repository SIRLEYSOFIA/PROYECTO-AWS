/**
 * Seller entity for POS system
 * Represents a salesperson who can be associated with orders
 */

export interface Seller {
  id: string
  name: string
  email?: string
  phone?: string
  employeeId?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

/**
 * Create a new seller
 */
export function createSeller(data: {
  id: string
  name: string
  email?: string
  phone?: string
  employeeId?: string
}): Seller {
  const now = new Date()
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    employeeId: data.employeeId,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  }
}
