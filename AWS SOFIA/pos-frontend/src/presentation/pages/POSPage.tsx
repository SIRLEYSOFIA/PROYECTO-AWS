import { useCallback, useState } from 'react'
import { useCatalog } from '@presentation/hooks/useCatalog'
import { useOrder } from '@presentation/hooks/useOrder'
import { useSession } from '@presentation/hooks/useSession'
import { useUIStore } from '@presentation/store/uiStore'
import { useOrderStore } from '@presentation/store/orderStore'
import { useSessionStore } from '@presentation/store/sessionStore'
import { container } from '@composition/container'
import { recalculateOrder } from '@domain/entities/Order'
import { updateOrderItemQuantity, updateOrderItemPrice } from '@domain/entities/OrderItem'
import { Money } from '@domain/value-objects/Money'

import { DiscountModal } from '@presentation/components/order/DiscountModal'
import { PaymentModal } from '@presentation/components/payment/PaymentModal'
import { ReceiptPreview } from '@presentation/components/receipt/ReceiptPreview'
import { ToastContainer } from '@presentation/components/ui/Toast'

import { ProductViewModel } from '@application/view-models/ProductViewModel'
import { Discount } from '@domain/value-objects/Discount'
import './POSPage.css'

export function POSPage() {
  const { logout } = useSession()
  const { lock } = useSessionStore()
  const { session, shift } = useSessionStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [invoiceName, setInvoiceName] = useState('Precuenta')
  const [invoiceType, setInvoiceType] = useState('Facturación POS')
  const [customerSearch, setCustomerSearch] = useState('Consumidor Final')
  const [sellerSearch, setSellerSearch] = useState('Sofia')

  const {
    products, categories, selectedCategory, setSelectedCategory,
    query, setQuery, loading, error, searchByBarcode,
  } = useCatalog()

  const {
    orders, activeOrderId, activeOrder, activeOrderVM,
    setActiveOrderId, addProduct, removeItem,
    applyItemDiscount, applyOrderDiscount, confirmOrder,
    createNewOrder,
  } = useOrder()

  const {
    isPaymentModalOpen, isDiscountModalOpen, discountTargetItemId,
    completedPayment,
    openPaymentModal, closePaymentModal,
    openDiscountModal, closeDiscountModal,
    setCompletedPayment,
  } = useUIStore()

  // Handle barcode scan
  const handleBarcode = useCallback(async (barcode: string) => {
    const product = await searchByBarcode(barcode)
    if (product) await addProduct(product)
  }, [searchByBarcode, addProduct])

  // Handle product selection from search
  const handleProductSelect = useCallback(async (product: ProductViewModel) => {
    await addProduct(product)
    setSearchQuery('')
  }, [addProduct])

  // Search products
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return
    setQuery(searchQuery)
  }, [searchQuery, setQuery])

  const visibleProducts = products.slice(0, 8)

  // Increase quantity
  const handleIncrease = useCallback(async (itemId: string) => {
    if (!activeOrder) return
    const item = activeOrder.items.find((i) => i.id === itemId)
    if (!item) return
    const updatedItems = activeOrder.items.map((i) =>
      i.id === itemId ? updateOrderItemQuantity(i, i.quantity + 1) : i
    )
    const updated = recalculateOrder({ ...activeOrder, items: updatedItems })
    useOrderStore.getState().upsertOrder(updated)
    await container.orderRepository.save(updated)
  }, [activeOrder])

  // Decrease quantity
  const handleDecrease = useCallback(async (itemId: string) => {
    if (!activeOrder) return
    const item = activeOrder.items.find((i) => i.id === itemId)
    if (!item) return
    if (item.quantity <= 1) {
      await removeItem(itemId)
      return
    }
    const updatedItems = activeOrder.items.map((i) =>
      i.id === itemId ? updateOrderItemQuantity(i, i.quantity - 1) : i
    )
    const updated = recalculateOrder({ ...activeOrder, items: updatedItems })
    useOrderStore.getState().upsertOrder(updated)
    await container.orderRepository.save(updated)
  }, [activeOrder, removeItem])

  // Handle quantity change
  const handleQuantityChange = useCallback(async (itemId: string, quantity: number) => {
    if (!activeOrder) return
    const item = activeOrder.items.find((i) => i.id === itemId)
    if (!item) return
    if (quantity <= 0) return
    const updatedItems = activeOrder.items.map((i) =>
      i.id === itemId ? updateOrderItemQuantity(i, quantity) : i
    )
    const updated = recalculateOrder({ ...activeOrder, items: updatedItems })
    useOrderStore.getState().upsertOrder(updated)
    await container.orderRepository.save(updated)
  }, [activeOrder])

  // Handle price change
  const handlePriceChange = useCallback(async (itemId: string, price: number) => {
    if (!activeOrder) return
    const item = activeOrder.items.find((i) => i.id === itemId)
    if (!item) return
    if (price <= 0) return
    const newUnitPrice = Money.fromAmount(price)
    const updatedItems = activeOrder.items.map((i) =>
      i.id === itemId ? updateOrderItemPrice(i, newUnitPrice) : i
    )
    const updated = recalculateOrder({ ...activeOrder, items: updatedItems })
    useOrderStore.getState().upsertOrder(updated)
    await container.orderRepository.save(updated)
  }, [activeOrder])

  // Handle charge button
  const handleCharge = useCallback(async () => {
    if (!activeOrderVM) return
    if (activeOrderVM.canBeConfirmed) {
      const ok = await confirmOrder()
      if (!ok) return
    }
    openPaymentModal()
  }, [activeOrderVM, confirmOrder, openPaymentModal])

  // Handle discount apply
  const handleDiscountApply = useCallback(async (discount: Discount) => {
    const role = session?.role ?? 'cashier'
    if (discountTargetItemId) {
      await applyItemDiscount(discountTargetItemId, discount, role)
    } else {
      await applyOrderDiscount(discount, role)
    }
  }, [discountTargetItemId, applyItemDiscount, applyOrderDiscount, session])

  // New sale after receipt
  const handleNewSale = useCallback(() => {
    setCompletedPayment(null)
    createNewOrder()
  }, [setCompletedPayment, createNewOrder])

  // Show receipt after successful payment
  if (completedPayment && activeOrder) {
    return (
      <div className="siigo-layout">
        <header className="siigo-header">
          <button className="siigo-menu-btn">☰</button>
          <h1 className="siigo-title">Nueva Factura de venta</h1>
          <div className="siigo-header-actions">
            <button className="siigo-help-btn">Ayuda ▼</button>
            <div className="siigo-logo">POS</div>
          </div>
        </header>
        <main className="siigo-receipt-view">
          <ReceiptPreview
            order={activeOrder}
            payment={completedPayment}
            cashierName={session?.username ?? 'Cashier'}
            shiftId={shift?.id.slice(0, 8) ?? '—'}
            onPrint={() => window.print()}
            onEmail={() => alert('Email receipt — coming soon')}
            onWhatsApp={() => {
              const text = encodeURIComponent(
                `Receipt: ${activeOrder.total.format()} — Thank you for shopping with us!`
              )
              window.open(`https://wa.me/?text=${text}`, '_blank')
            }}
            onNewSale={handleNewSale}
          />
        </main>
        <ToastContainer />
      </div>
    )
  }

  const discountLabel = discountTargetItemId
    ? (activeOrderVM?.items.find((i) => i.id === discountTargetItemId)?.productName ?? 'Item')
    : 'Entire Order'

  return (
    <div className="siigo-layout">
      {/* Header */}
      <header className="siigo-header">
        <button className="siigo-menu-btn">☰</button>
        <h1 className="siigo-title">Nueva Factura de venta</h1>
        <div className="siigo-header-actions">
          <button className="siigo-help-btn">Ayuda ▼</button>
          <div className="siigo-logo">POS</div>
        </div>
      </header>

      {/* Tabs */}
      <div className="siigo-tabs">
        <button className="siigo-tab siigo-tab--active">
          precuenta ×
        </button>
        <button className="siigo-tab siigo-tab--new">
          + Nueva precuenta
        </button>
      </div>

      {/* Main Content */}
      <main className="siigo-main">
        {/* Invoice Info */}
        <section className="siigo-invoice-info">
          <div className="siigo-field-group">
            <label>Nombre de precuenta: <strong>{invoiceName}</strong></label>
            <button className="siigo-icon-btn">✏️</button>
            <button className="siigo-icon-btn">🖨️</button>
          </div>
          <div className="siigo-field-group">
            <label>Tipo de facturación *</label>
            <select 
              className="siigo-select" 
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
            >
              <option>Facturación POS</option>
              <option>Factura Electrónica</option>
            </select>
          </div>
        </section>

        {/* Products Table */}
        <section className="siigo-table-section">
          <table className="siigo-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Valor unitario</th>
                <th>% Des.</th>
                <th>Cargo 1</th>
                <th>Cargo 2</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeOrderVM?.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.productName}</td>
                  <td>
                    <div className="siigo-quantity-control">
                      <button 
                        className="siigo-qty-btn siigo-qty-btn--green"
                        onClick={() => handleIncrease(item.id)}
                      >
                        ↑
                      </button>
                      <input 
                        type="number" 
                        className="siigo-qty-input"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      />
                      <button 
                        className="siigo-qty-btn siigo-qty-btn--green"
                        onClick={() => handleDecrease(item.id)}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <select className="siigo-select siigo-select--sm">
                      <option>{item.unitPriceFormatted}</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="siigo-input siigo-input--sm"
                      value={item.hasDiscount ? item.discountLabel : '0'}
                      readOnly
                    />
                  </td>
                  <td>
                    <select className="siigo-select siigo-select--sm">
                      <option>IVA 0%</option>
                    </select>
                  </td>
                  <td>
                    <select className="siigo-select siigo-select--sm">
                      <option>Impuestos</option>
                    </select>
                  </td>
                  <td className="siigo-table-amount">{item.lineTotalFormatted}</td>
                  <td>
                    <button 
                      className="siigo-icon-btn siigo-icon-btn--danger"
                      onClick={() => removeItem(item.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Search Row */}
              <tr className="siigo-search-row">
                <td>{(activeOrderVM?.items.length || 0) + 1}</td>
                <td colSpan={7}>
                  <div className="siigo-search-field">
                    <input
                      type="text"
                      className="siigo-search-input"
                      placeholder="Búsqueda por código / nombre / referencia"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setQuery(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                      }}
                    />
                    <button className="siigo-search-btn" onClick={handleSearch}>
                      🔍
                    </button>
                  </div>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div className="siigo-product-results">
            {loading && <span className="siigo-product-status">Cargando productos...</span>}
            {error && <span className="siigo-product-status siigo-product-status--error">{error}</span>}
            {!loading && visibleProducts.map((product) => (
              <button
                key={product.id}
                className="siigo-product-chip"
                type="button"
                onClick={() => handleProductSelect(product)}
              >
                <strong>{product.name}</strong>
                <span>{product.priceFormatted}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Bottom Section */}
        <div className="siigo-bottom-section">
          {/* Left: Sales Data */}
          <section className="siigo-sales-data">
            <h3 className="siigo-section-title">Datos de la venta</h3>
            
            <div className="siigo-field">
              <label>Cliente</label>
              <div className="siigo-search-field">
                <button className="siigo-search-icon">🔍</button>
                <input
                  type="text"
                  className="siigo-input"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                <button className="siigo-clear-btn">×</button>
              </div>
              <button className="siigo-new-btn">+ NUEVO</button>
            </div>

            <div className="siigo-field">
              <label>Vendedor</label>
              <div className="siigo-search-field">
                <button className="siigo-search-icon">🔍</button>
                <input
                  type="text"
                  className="siigo-input"
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                />
                <button className="siigo-clear-btn">×</button>
              </div>
            </div>
          </section>

          {/* Right: Totals */}
          <section className="siigo-totals">
            <div className="siigo-total-row">
              <span>Total bruto:</span>
              <strong>{activeOrderVM?.subtotalFormatted || '$0'}</strong>
            </div>
            <div className="siigo-total-row">
              <span>Descuentos:</span>
              <strong>{activeOrderVM?.orderDiscountFormatted || '$0'}</strong>
            </div>
            <div className="siigo-total-row">
              <span>Subtotal:</span>
              <strong>{activeOrderVM?.subtotalFormatted || '$0'}</strong>
            </div>
            <div className="siigo-total-row">
              <span>Total IVA:</span>
              <strong>{activeOrderVM?.taxFormatted || '$0'}</strong>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="siigo-actions">
          <button className="siigo-btn siigo-btn--cancel">
            Cancelar
          </button>
          <button 
            className="siigo-btn siigo-btn--charge"
            onClick={handleCharge}
            disabled={!activeOrderVM || activeOrderVM.isEmpty}
          >
            COBRAR {activeOrderVM?.totalFormatted || '$0'}
          </button>
        </div>
      </main>

      {/* Modals */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={closeDiscountModal}
        onApply={handleDiscountApply}
        targetLabel={discountLabel}
      />

      {activeOrderVM && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={closePaymentModal}
          totalAmount={activeOrderVM.totalAmount}
          totalFormatted={activeOrderVM.totalFormatted}
        />
      )}

      <ToastContainer />
    </div>
  )
}
