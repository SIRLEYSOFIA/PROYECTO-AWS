/**
 * CartStore — in-memory state management for the POS frontend.
 *
 * Emits a `cart:updated` CustomEvent on `document` after every mutation.
 *
 * CartItem shape:
 * {
 *   productId: number,
 *   nombre:    string,
 *   unitPrice: number,   // precio at time of adding
 *   quantity:  number,
 *   lineTotal: number,   // computed: unitPrice * quantity
 * }
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute the lineTotal for a cart item.
 * @param {number} unitPrice
 * @param {number} quantity
 * @returns {number}
 */
function computeLineTotal(unitPrice, quantity) {
  return unitPrice * quantity;
}

/**
 * Dispatch the `cart:updated` event on document.
 */
function emitCartUpdated() {
  document.dispatchEvent(new CustomEvent("cart:updated"));
}

// ---------------------------------------------------------------------------
// CartStore
// ---------------------------------------------------------------------------

const CartStore = {
  /** @type {Array<{productId:number, nombre:string, unitPrice:number, quantity:number, lineTotal:number}>} */
  items: [],

  // -------------------------------------------------------------------------
  // Mutation methods
  // -------------------------------------------------------------------------

  /**
   * Add a product to the cart, or increment it if the product is already present.
   *
   * @param {{ id: number, nombre: string, precio: number }} product
   * @param {number} quantity
   */
  addItem(product, quantity = 1) {
    const amount = Math.max(1, Number.parseInt(quantity, 10) || 1);
    const existing = this.items.find((i) => i.productId === product.id);
    if (existing) {
      existing.quantity += amount;
      existing.lineTotal = computeLineTotal(
        existing.unitPrice,
        existing.quantity
      );
    } else {
      this.items.push({
        productId: product.id,
        nombre: product.nombre,
        unitPrice: product.precio,
        quantity: amount,
        lineTotal: computeLineTotal(product.precio, amount),
      });
    }
    emitCartUpdated();
  },

  /**
   * Remove a cart item by productId.
   * @param {number} productId
   */
  removeItem(productId) {
    this.items = this.items.filter((i) => i.productId !== productId);
    emitCartUpdated();
  },

  /**
   * Set the quantity of a cart item.
   * - n === 0  → removes the item
   * - n < 0   → throws an Error
   *
   * @param {number} productId
   * @param {number} n
   */
  setQuantity(productId, n) {
    if (n < 0) {
      throw new Error(`Quantity must be non-negative, got ${n}`);
    }
    if (n === 0) {
      this.removeItem(productId);
      return; // removeItem already emits
    }
    const item = this.items.find((i) => i.productId === productId);
    if (item) {
      item.quantity = n;
      item.lineTotal = computeLineTotal(item.unitPrice, item.quantity);
    }
    emitCartUpdated();
  },

  /**
   * Clear all items from the cart.
   */
  clearCart() {
    this.items = [];
    emitCartUpdated();
  },

  // -------------------------------------------------------------------------
  // Computed getters
  // -------------------------------------------------------------------------

  /**
   * Sum of (unitPrice * quantity) for every item.
   * @returns {number}
   */
  get subtotal() {
    return this.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  },

  /**
   * Grand total = subtotal.
   * @returns {number}
   */
  get grandTotal() {
    return this.subtotal;
  },
};

export default CartStore;
