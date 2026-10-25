// @ts-check

/** @constructor @param {{ name: string }} data */
function CatalogBase(data) {
  /** @type {string} */
  this.label = data.name;
}

CatalogBase.prototype.describe = function () {
  return `Catalog item: ${this.label}`;
};

/**
 * Product item with immutable public fields, prototype behavior and a runtime-private key.
 * @template {{ id: string, name: string, price: number, stock: number }} T
 */
export class CatalogItem extends CatalogBase {
  /** @type {string} */ #id;
  /** @type {string} */ #name;
  /** @type {number} */ #price;
  /** @type {number} */ #stock;

  /** @param {T} data */
  constructor(data) {
    super(data);
    this.#id = data.id;
    this.#name = data.name;
    this.#price = data.price;
    this.#stock = data.stock;
  }

  get id() {
    return this.#id;
  }
  get name() {
    return this.#name;
  }
  get price() {
    return this.#price;
  }
  get stock() {
    return this.#stock;
  }

  /** @returns {{ id: string, name: string, price: number, stock: number }} */
  toJSON() {
    return { id: this.#id, name: this.#name, price: this.#price, stock: this.#stock };
  }
}

/** @param {unknown} payload @returns {payload is Record<string, unknown>[]} */
export function isRecordArray(payload) {
  return (
    Array.isArray(payload) && payload.every((item) => item !== null && typeof item === 'object')
  );
}
