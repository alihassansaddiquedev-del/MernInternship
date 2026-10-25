// @ts-check

/** @typedef {{ id: string, name: string, category: string, price: number }} CartProduct */
/** @typedef {{ product: CartProduct, quantity: number }} CartItem */

/** @param {CartItem[]} items @param {'name'|'price'|'quantity'} [key='name'] @returns {CartItem[]} */
export function sortItems(items, key = 'name') {
  return items.toSorted((a, b) => {
    if (key === 'price') return a.product.price - b.product.price;
    if (key === 'quantity') return a.quantity - b.quantity;
    return a.product.name.localeCompare(b.product.name);
  });
}

/** Groups cart lines by product category using Map.groupBy. @param {CartItem[]} items @returns {Map<string, CartItem[]>} */
export function groupByCategory(items) {
  return Map.groupBy(items, ({ product }) => product.category);
}

/** @param {CartItem[]} items @returns {string[]} */
export function uniqueCategories(items) {
  return [...new Set(items.map(({ product }) => product.category))].toSorted((a, b) => a.localeCompare(b));
}

/** @param {number} amount @param {string} [locale='en-PK'] @param {string} [currency='PKR'] @returns {string} */
export function formatPrice(amount, locale = 'en-PK', currency = 'PKR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

/** @param {import('./Cart.js').Cart} cart @param {string} [createdAt] @returns {string} */
export function createJsonSummary(cart, createdAt = new Date().toISOString()) {
  const snapshot = structuredClone(cart.toJSON());
  const itemLines = snapshot.items.map(({ product, quantity }) =>
    `    {"id":"${product.id}","name":"${product.name}","quantity":${quantity},"unitPrice":${product.price},"lineTotal":${product.price * quantity}}`
  ).join(',\n');
  // Template literal deliberately produces a readable JSON summary.
  return `{
  "createdAt": "${createdAt}",
  "itemCount": ${snapshot.itemCount},
  "total": ${snapshot.total},
  "items": [
${itemLines}
  ]
}`;
}
