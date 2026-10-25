// @ts-check

// JSON import attributes are supported by modern Node.js (Node 22+; use Node 24 LTS).
import catalogRows from './data/catalog.json' with { type: 'json' };
import { Product } from './Product.js';
import { formatPrice } from './Utils.js';

const catalog = Product.fromCatalog(catalogRows);

// Demonstrate dynamic ES module imports.
const [{ Cart }, utils] = await Promise.all([
  import('./Cart.js'),
  import('./Utils.js')
]);

const cart = new Cart();
const mouse = Product.findById(catalog, 'p100');
const keyboard = Product.findById(catalog, 'p101');
const lamp = Product.findById(catalog, 'p201');
if (!mouse || !keyboard || !lamp) throw new Error('Demo products are missing from the catalog.');

cart.add(mouse.toJSON(), 2).add(keyboard.toJSON()).add(lamp.toJSON(), 2);
cart.remove('p201', 1); // Remove one lamp.

console.log('\n=== CATALOG ===');
for (const product of catalog) {
  console.log(`${product.name.padEnd(22)} ${formatPrice(product.price)} | stock: ${product.stock}`);
}

console.log('\n=== CART (sorted by price) ===');
for (const { product, quantity } of utils.sortItems(cart.items, 'price')) {
  console.log(`${product.name} × ${quantity} = ${formatPrice(product.price * quantity)}`);
}

console.log('\n=== GROUPED BY CATEGORY (Map.groupBy) ===');
for (const [category, items] of utils.groupByCategory(cart.items)) {
  console.log(`${category}: ${items.map(({ product }) => product.name).join(', ')}`);
}
console.log(`Unique categories (Set): ${utils.uniqueCategories(cart.items).join(', ')}`);
console.log(`Items in cart: ${cart.itemCount}`);
console.log(`Cart total: ${formatPrice(cart.total)}`);

// structuredClone creates an independent snapshot; changing it won't change the cart.
const clonedCart = structuredClone(cart.snapshot());
if (clonedCart[0]) clonedCart[0].quantity += 10;
console.log(`Original cart first quantity (clone changed separately): ${cart.items[0]?.quantity ?? 0}`);

console.log('\n=== JSON SUMMARY ===');
console.log(utils.createJsonSummary(cart));
