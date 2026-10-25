import { dedupeById } from './utils.js';
import { CatalogItem, isRecordArray } from './data.js';
import { Product, ProductSchema } from '../Product';

export async function fetchCatalog(timeoutMs = 5_000): Promise<Product[]> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException('Catalog request timed out', 'TimeoutError')),
    timeoutMs,
  );
  try {
    const response = await fetch('/products.json', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    const payload: unknown = await response.json();
    if (!isRecordArray(payload))
      throw new TypeError('Catalog response must be an array of product records.');
    const validated = payload.map((item: unknown) => ProductSchema.parse(item));
    return dedupeById(validated).map((item) => {
      const coreItem = new CatalogItem(item);
      return new Product({ ...item, ...coreItem.toJSON() });
    });
  } finally {
    window.clearTimeout(timeout);
  }
}
