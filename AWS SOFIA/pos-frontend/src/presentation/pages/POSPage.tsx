import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type ModuleKey = 'pos' | 'productos' | 'ventas' | 'cuadre' | 'usuarios'

interface LocalUser {
  username: string
  role: 'ADMIN' | 'CAJERO'
  status: 'Activo' | 'Bloqueado'
}

const MODULES: { id: ModuleKey; label: string }[] = [
  { id: 'pos', label: 'POS' },
  { id: 'productos', label: 'Productos' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'cuadre', label: 'Cuadre' },
  { id: 'usuarios', label: 'Usuarios' },
]

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)

export function POSPage() {
  const { logout } = useSession()
  const { lock } = useSessionStore()
  const { session, shift } = useSessionStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [invoiceName, setInvoiceName] = useState('Precuenta')
  const [invoiceType, setInvoiceType] = useState('Facturación POS')
  const [customerSearch, setCustomerSearch] = useState('Consumidor Final')
  const [sellerSearch, setSellerSearch] = useState('Sofia')
  const [activeModule, setActiveModule] = useState<ModuleKey>('pos')
  const [clock, setClock] = useState(() => new Date())
  const [inventoryFilter, setInventoryFilter] = useState('')
  const [declaredCash, setDeclaredCash] = useState('')
  const [openingCash, setOpeningCash] = useState('0')
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'CAJERO' as LocalUser['role'] })
  const [localUsers, setLocalUsers] = useState<LocalUser[]>([
    { username: 'SofiaInPensante', role: 'ADMIN', status: 'Activo' },
    { username: 'SOF', role: 'ADMIN', status: 'Activo' },
    { username: 'cajera-sofia', role: 'CAJERO', status: 'Activo' },
  ])
  const searchInputRef = useRef<HTMLInputElement>(null)

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
  const filteredProducts = useMemo(() => {
    const filter = inventoryFilter.trim().toLowerCase()
    if (!filter) return products
    return products.filter((product) =>
      [product.name, product.sku, product.barcode, product.categoryId]
        .some((value) => value.toLowerCase().includes(filter))
    )
  }, [inventoryFilter, products])

  const soldOrders = useMemo(() => orders.filter((order) => order.status === 'paid'), [orders])
  const completedOrders = soldOrders.length > 0 ? soldOrders : orders.filter((order) => order.items.length > 0)
  const salesTotal = completedOrders.reduce((acc, order) => acc + order.total.toAmount(), 0)
  const salesItemCount = completedOrders.reduce(
    (acc, order) => acc + order.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0),
    0,
  )
  const cashExpected = Number(openingCash || 0) + salesTotal
  const cashDifference = Number(declaredCash || 0) - cashExpected

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  const handleCreateUser = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const username = newUser.username.trim()
    if (!username || !newUser.password.trim()) return
    setLocalUsers((current) => [
      { username, role: newUser.role, status: 'Activo' },
      ...current.filter((user) => user.username.toLowerCase() !== username.toLowerCase()),
    ])
    setNewUser({ username: '', password: '', role: 'CAJERO' })
  }, [newUser])

  const toggleUserStatus = useCallback((username: string) => {
    setLocalUsers((current) => current.map((user) => (
      user.username === username
        ? { ...user, status: user.status === 'Activo' ? 'Bloqueado' : 'Activo' }
        : user
    )))
  }, [])

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

  useEffect(() => {
    function handleShortcuts(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if (event.key === 'F2') {
        event.preventDefault()
        setActiveModule('pos')
        window.setTimeout(() => {
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        })
      }

      if (event.key === 'F8') {
        event.preventDefault()
        if (activeOrderVM && !activeOrderVM.isEmpty) handleCharge()
      }

      if (event.key === '?' && !isTyping) {
        event.preventDefault()
        alert('Atajos: F2 buscar producto, F8 cobrar, ? ayuda, Ctrl+L limpiar busqueda.')
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        setSearchQuery('')
        setQuery('')
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleShortcuts)
    return () => window.removeEventListener('keydown', handleShortcuts)
  }, [activeOrderVM, handleCharge, setQuery])

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
        <h1 className="siigo-title">POS Sofia</h1>
        <div className="siigo-header-actions">
          <span className="siigo-header-meta">{session?.username ?? 'Sofia'} · {clock.toLocaleTimeString('es-CO')}</span>
          <button className="siigo-help-btn" onClick={() => alert('Atajos: F2 buscar, F8 cobrar, Ctrl+L limpiar busqueda.')}>Ayuda ▼</button>
          <button className="siigo-help-btn" onClick={lock}>Bloquear</button>
          <button className="siigo-help-btn" onClick={logout}>Salir</button>
          <div className="siigo-logo">POS</div>
        </div>
      </header>

      {/* Tabs */}
      <div className="siigo-tabs">
        {MODULES.map((module) => (
          <button
            key={module.id}
            className={`siigo-tab ${activeModule === module.id ? 'siigo-tab--active' : ''}`}
            onClick={() => setActiveModule(module.id)}
          >
            {module.label}
          </button>
        ))}
        <button className="siigo-tab siigo-tab--new">
          + Nueva precuenta
        </button>
      </div>

      {/* Main Content */}
      {activeModule === 'pos' && (
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
                      ref={searchInputRef}
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
      )}

      {activeModule === 'productos' && (
        <main className="siigo-main">
          <section className="siigo-backoffice-head">
            <div>
              <h2>Inventario del mostrador</h2>
              <p>Consulta productos de DynamoDB, filtra por nombre, codigo o categoria y agregalos directo a la venta.</p>
            </div>
            <button className="siigo-btn siigo-btn--charge" onClick={() => setActiveModule('pos')}>Abrir POS</button>
          </section>

          <section className="siigo-summary-grid">
            <article className="siigo-summary-card">
              <span>Productos</span>
              <strong>{products.length}</strong>
            </article>
            <article className="siigo-summary-card">
              <span>Activos</span>
              <strong>{products.filter((product) => product.isActive).length}</strong>
            </article>
            <article className="siigo-summary-card">
              <span>Bajo stock</span>
              <strong>{products.filter((product) => product.isLowStock || product.isOutOfStock).length}</strong>
            </article>
          </section>

          <section className="siigo-table-section">
            <div className="siigo-panel-toolbar">
              <input
                className="siigo-input"
                value={inventoryFilter}
                onChange={(event) => setInventoryFilter(event.target.value)}
                placeholder="Buscar producto, codigo o categoria"
              />
              <button className="siigo-search-btn" onClick={() => setQuery(inventoryFilter)}>Recargar</button>
            </div>
            <table className="siigo-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Codigo</th>
                  <th>Categoria</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.barcode || product.sku}</td>
                    <td>{product.categoryId}</td>
                    <td className="siigo-table-amount">{product.priceFormatted}</td>
                    <td>{product.stock}</td>
                    <td>{product.isActive ? 'Activo' : 'Inactivo'}</td>
                    <td><button className="siigo-icon-btn" onClick={() => handleProductSelect(product)}>Agregar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {activeModule === 'ventas' && (
        <main className="siigo-main">
          <section className="siigo-backoffice-head">
            <div>
              <h2>Historial de ventas</h2>
              <p>Resumen local de precuentas y ventas procesadas durante la sesion.</p>
            </div>
            <button className="siigo-search-btn" onClick={createNewOrder}>Nueva venta</button>
          </section>

          <section className="siigo-summary-grid">
            <article className="siigo-summary-card">
              <span>Ventas</span>
              <strong>{completedOrders.length}</strong>
            </article>
            <article className="siigo-summary-card">
              <span>Total vendido</span>
              <strong>{formatCurrency(salesTotal)}</strong>
            </article>
            <article className="siigo-summary-card">
              <span>Articulos</span>
              <strong>{salesItemCount}</strong>
            </article>
          </section>

          <section className="siigo-table-section">
            <table className="siigo-table">
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Fecha</th>
                  <th>Cajera</th>
                  <th>Articulos</th>
                  <th>Subtotal</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.length === 0 && (
                  <tr><td colSpan={7}>Aun no hay ventas registradas en esta sesion.</td></tr>
                )}
                {completedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id.slice(0, 8)}</td>
                    <td>{order.createdAt.toLocaleString('es-CO')}</td>
                    <td>{session?.username ?? order.cashierId}</td>
                    <td>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                    <td className="siigo-table-amount">{formatCurrency(order.subtotal.toAmount())}</td>
                    <td className="siigo-table-amount">{formatCurrency(order.total.toAmount())}</td>
                    <td>{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {activeModule === 'cuadre' && (
        <main className="siigo-main">
          <section className="siigo-backoffice-head">
            <div>
              <h2>Cuadre de caja</h2>
              <p>Calcula base inicial, efectivo esperado y diferencia de cierre.</p>
            </div>
            <span className="siigo-status-pill">Turno {shift?.id.slice(0, 8) ?? 'local'}</span>
          </section>

          <section className="siigo-cash-filters">
            <label>Base inicial<input className="siigo-input" type="number" min="0" step="100" value={openingCash} onChange={(event) => setOpeningCash(event.target.value)} /></label>
            <label>Efectivo contado<input className="siigo-input" type="number" min="0" step="100" value={declaredCash} onChange={(event) => setDeclaredCash(event.target.value)} /></label>
            <label>Cajera<input className="siigo-input" value={session?.username ?? 'Sofia'} readOnly /></label>
          </section>

          <section className="siigo-summary-grid">
            <article className="siigo-summary-card"><span>Ventas</span><strong>{completedOrders.length}</strong></article>
            <article className="siigo-summary-card"><span>Total vendido</span><strong>{formatCurrency(salesTotal)}</strong></article>
            <article className="siigo-summary-card"><span>Efectivo esperado</span><strong>{formatCurrency(cashExpected)}</strong></article>
            <article className={`siigo-summary-card ${cashDifference < 0 ? 'siigo-summary-card--warn' : ''}`}><span>Diferencia</span><strong>{formatCurrency(cashDifference)}</strong></article>
          </section>

          <section className="siigo-table-section">
            <h3 className="siigo-section-title">Ventas incluidas</h3>
            <table className="siigo-table">
              <thead>
                <tr><th>Hora</th><th>Venta</th><th>Pago</th><th>Total</th></tr>
              </thead>
              <tbody>
                {completedOrders.length === 0 && <tr><td colSpan={4}>Sin movimientos para cuadrar.</td></tr>}
                {completedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.createdAt.toLocaleTimeString('es-CO')}</td>
                    <td>{order.id.slice(0, 8)}</td>
                    <td>{order.status === 'paid' ? 'Pagado' : 'Pendiente'}</td>
                    <td className="siigo-table-amount">{formatCurrency(order.total.toAmount())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {activeModule === 'usuarios' && (
        <main className="siigo-main">
          <section className="siigo-backoffice-head">
            <div>
              <h2>Usuarios y roles</h2>
              <p>Gestion local de usuarios demo para administradores y cajeros.</p>
            </div>
          </section>

          <div className="siigo-admin-grid">
            <section className="siigo-table-section">
              <h3 className="siigo-section-title">Crear usuario</h3>
              <form className="siigo-user-form" onSubmit={handleCreateUser}>
                <label>Usuario<input className="siigo-input" value={newUser.username} onChange={(event) => setNewUser((user) => ({ ...user, username: event.target.value }))} /></label>
                <label>Clave<input className="siigo-input" type="password" value={newUser.password} onChange={(event) => setNewUser((user) => ({ ...user, password: event.target.value }))} /></label>
                <label>Rol<select className="siigo-select" value={newUser.role} onChange={(event) => setNewUser((user) => ({ ...user, role: event.target.value as LocalUser['role'] }))}><option>CAJERO</option><option>ADMIN</option></select></label>
                <button className="siigo-btn siigo-btn--charge" type="submit">Guardar usuario</button>
              </form>
            </section>

            <section className="siigo-table-section">
              <h3 className="siigo-section-title">Usuarios registrados</h3>
              <table className="siigo-table">
                <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Accion</th></tr></thead>
                <tbody>
                  {localUsers.map((user) => (
                    <tr key={user.username}>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>{user.status}</td>
                      <td><button className="siigo-icon-btn" onClick={() => toggleUserStatus(user.username)}>{user.status === 'Activo' ? 'Bloquear' : 'Activar'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </main>
      )}

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
