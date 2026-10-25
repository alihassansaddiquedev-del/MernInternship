// @ts-check

/** @typedef {{ id: string, name: string, category: string, price: number }} CartProduct */
/** @typedef {{ product: CartProduct, quantity: number }} CartItem */

/** Shopping cart operations. Cart items are plain objects so structuredClone can deep-clone them. */
export class Cart {
  /** @type {CartItem[]} */ #items = [];

  /** @returns {CartItem[]} */
  get items() {
    // Return a copy to prevent callers from mutating internal cart state.
    return this.#items.map(({ product, quantity }) => ({ product: { ...product }, quantity }));
  }

  /** @param {CartProduct} product @param {number} [quantity=1] */
  add(product, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError('Quantity must be a positive integer.');
    const existing = this.#items.find((item) => item.product.id === product.id);
    if (existing) {
      this.#items = this.#items.map((item) => item.product.id === product.id
        ? { ...item, quantity: item.quantity + quantity }
        : item);
    } else {
      this.#items = [...this.#items, { product: { ...product }, quantity }];
    }
    return this;
  }

  /** @param {string} productId @param {number} [quantity=1] */
  remove(productId, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError('Quantity must be a positive integer.');
    this.#items = this.#items.flatMap(({ product, quantity: current }) => {
      if (product.id !== productId) return [{ product, quantity: current }];
      const remaining = current - quantity;
      return remaining > 0 ? [{ product, quantity: remaining }] : [];
    });
    return this;
  }

  /** @param {string} productId @param {number} quantity */
  setQuantity(productId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 0) throw new RangeError('Quantity must be a non-negative integer.');
    if (quantity === 0) return this.remove(productId, Number.MAX_SAFE_INTEGER);
    let found = false;
    this.#items = this.#items.map((item) => {
      if (item.product.id !== productId) return item;
      found = true;
      return { ...item, quantity };
    });
    if (!found) throw new Error(`Product ${productId} is not in the cart.`);
    return this;
  }

  clear() { this.#items = []; return this; }

  /** @returns {number} */
  get itemCount() { return this.#items.reduce((sum, { quantity }) => sum + quantity, 0); }

  /** @returns {number} */
  get total() { return this.#items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0); }

  /** Returns a deep-cloned, plain-data snapshot. @returns {CartItem[]} */
  snapshot() { return structuredClone(this.#items); }

  /** @returns {{ itemCount: number, total: number, items: CartItem[] }} */
  toJSON() { return { itemCount: this.itemCount, total: this.total, items: this.snapshot() }; }
}
