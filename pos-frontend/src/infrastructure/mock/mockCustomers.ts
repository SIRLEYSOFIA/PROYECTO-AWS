import { Customer } from '@domain/entities/Customer'

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    name: 'Juan García',
    email: 'juan.garcia@email.com',
    phone: '912-345-678',
    address: 'Calle Mayor 1, Madrid',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
  {
    id: 'cust-002',
    name: 'María López',
    email: 'maria.lopez@email.com',
    phone: '913-456-789',
    address: 'Avenida Principal 2, Madrid',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    isActive: true,
  },
  {
    id: 'cust-003',
    name: 'Carlos Martínez',
    email: 'carlos.m@email.com',
    phone: '914-567-890',
    address: 'Plaza España 3, Madrid',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    isActive: true,
  },
  {
    id: 'cust-004',
    name: 'Ana Rodríguez',
    email: 'ana.r@email.com',
    phone: '915-678-901',
    address: 'Calle Serrano 4, Madrid',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    isActive: true,
  },
  {
    id: 'cust-005',
    name: 'Pedro Sánchez',
    email: 'pedro.s@email.com',
    phone: '916-789-012',
    address: 'Gran Vía 5, Madrid',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    isActive: true,
  },
  {
    id: 'cust-006',
    name: 'Laura Fernández',
    email: 'laura.f@email.com',
    phone: '917-890-123',
    address: 'Paseo Castellana 6, Madrid',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
    isActive: true,
  },
  {
    id: 'cust-007',
    name: 'Miguel González',
    email: 'miguel.g@email.com',
    phone: '918-901-234',
    address: 'Calle Alcalá 7, Madrid',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    isActive: true,
  },
  {
    id: 'cust-008',
    name: 'Isabel Torres',
    email: 'isabel.t@email.com',
    phone: '919-012-345',
    address: 'Calle Fuencarral 8, Madrid',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    isActive: true,
  },
]

/** Alias for backward compatibility and test imports */
export const mockCustomers = MOCK_CUSTOMERS

/**
 * Returns the most recent customers (first N by createdAt desc)
 */
export function getRecentCustomers(customers: Customer[], limit = 5): Customer[] {
  return [...customers]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
}

/**
 * Search customers by name, phone, or ID (case-insensitive)
 */
export function searchCustomers(query: string, customers: Customer[]): Customer[] {
  const q = query.toLowerCase().trim()
  if (!q) return customers
  return customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      c.id.toLowerCase().includes(q)
  )
}
