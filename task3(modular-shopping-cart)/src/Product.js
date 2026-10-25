// @ts-check

/** @typedef {{ id: string, name: string, category: string, price: number, stock: number }} ProductData */

/** Represents a product available in the catalog. */
export class Product {
  /** @type {string} */ #id;
  /** @type {string} */ #name;
  /** @type {string} */ #category;
  /** @type {number} */ #price;
  /** @type {number} */ #stock;

  /** @param {ProductData} data */
  constructor({ id, name, category, price, stock }) {
    if (!id || !name || !category) throw new TypeError('Product id, name, and category are required.');
    if (!Number.isFinite(price) || price < 0) throw new RangeError('Product price must be a non-negative number.');
    if (!Number.isInteger(stock) || stock < 0) throw new RangeError('Product stock must be a non-negative integer.');
    this.#id = id;
    this.#name = name;
    this.#category = category;
    this.#price = price;
    this.#stock = stock;
  }

  get id() { return this.#id; }
  get name() { return this.#name; }
  get category() { return this.#category; }
  get price() { return this.#price; }
  get stock() { return this.#stock; }

  /** @returns {ProductData} */
  toJSON() {
    return { id: this.#id, name: this.#name, category: this.#category, price: this.#price, stock: this.#stock };
  }

  /** @param {ProductData[]} rows @returns {Product[]} */
  static fromCatalog(rows) {
    return rows.map((row) => new Product(row));
  }

  /** @param {Product[]} products @param {string} id @returns {Product | undefined} */
  static findById(products, id) {
    return products.find((product) => product.id === id);
  }
}
