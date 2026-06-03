import { Order } from '@domain/entities/Order'
import { IndexedDBOrderRepository } from '@infrastructure/local/IndexedDBOrderRepository'

interface ApiSaleItem {
  productId: string
  productName: string
  productPrice: number
  quantity: number
}

export class ApiOrderRepository extends IndexedDBOrderRepository {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    super()
    this.baseUrl = baseUrl
  }

  async complete(id: string): Promise<void> {
    const order = await this.getById(id)
    if (order) {
      await this.postSale(order)
    }
    await super.complete(id)
  }

  private async postSale(order: Order): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        cashier: order.cashierId,
        terminalId: order.shiftId,
        products: order.items.map(toSaleItem),
        subtotal: order.subtotal.toAmount(),
        iva: order.taxAmount.toAmount(),
        discount: order.orderDiscountAmount.toAmount(),
        total: order.total.toAmount(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Sale API request failed: ${response.status}`)
    }
  }
}

function toSaleItem(item: Order['items'][number]): ApiSaleItem {
  return {
    productId: item.productId,
    productName: item.productName,
    productPrice: item.unitPrice.toAmount(),
    quantity: item.quantity,
  }
}
