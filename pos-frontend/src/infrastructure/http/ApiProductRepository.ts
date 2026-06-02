import { IProductRepository } from '@application/ports/repositories/IProductRepository'
import { Product, ProductFilters } from '@domain/entities/Product'
import { Money } from '@domain/value-objects/Money'

interface ApiProduct {
  id: number | string
  name: string
  barcode?: string
  unitPrice?: number
  availableStock?: number
  category?: string
}

export class ApiProductRepository implements IProductRepository {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getAll(filters?: ProductFilters): Promise<Product[]> {
    const products = await this.requestProducts('/api/products')
    return this.applyFilters(products, filters)
  }

  async getById(id: string): Promise<Product | null> {
    const products = await this.getAll()
    return products.find((product) => product.id === id) ?? null
  }

  async searchByQuery(query: string): Promise<Product[]> {
    const products = await this.requestProducts(`/api/products/search?name=${encodeURIComponent(query)}`)
    return Array.isArray(products) ? products : [products]
  }

  async searchByBarcode(barcode: string): Promise<Product | null> {
    const result = await this.requestProducts(`/api/products/search?barcode=${encodeURIComponent(barcode)}`)
    const product = Array.isArray(result) ? result[0] : result
    return product ?? null
  }

  async getCategories(): Promise<string[]> {
    const products = await this.getAll()
    return Array.from(new Set(products.map((product) => product.categoryId))).sort()
  }

  private async requestProducts(path: string): Promise<Product[]> {
    const response = await fetch(`${this.baseUrl}${path}`)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    const data = await response.json()
    return (Array.isArray(data) ? data : [data]).map(toProduct)
  }

  private applyFilters(products: Product[], filters?: ProductFilters): Product[] {
    let results = products
    if (filters?.categoryId) {
      results = results.filter((product) => product.categoryId === filters.categoryId)
    }
    if (filters?.inStockOnly) {
      results = results.filter((product) => product.stock > 0)
    }
    return results
  }
}

function toProduct(product: ApiProduct): Product {
  const id = String(product.id)
  const categoryId = product.category || 'General'
  return {
    id,
    sku: id,
    barcode: product.barcode ?? id,
    name: product.name,
    description: categoryId,
    price: Money.fromAmount(product.unitPrice ?? 0),
    taxRate: 0,
    categoryId,
    imageUrl: '',
    stock: product.availableStock ?? 0,
    isActive: true,
  }
}
