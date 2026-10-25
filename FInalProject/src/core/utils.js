// @ts-check

/**
 * Deduplicate product-like records by id, keeping their first occurrence.
 * @template {{ id: string }} T
 * @param {readonly T[]} records
 * @returns {T[]}
 */
export function dedupeById(records) {
  const byId = new Map();
  for (const record of records) if (!byId.has(record.id)) byId.set(record.id, record);
  return [...byId.values()];
}

/** @param {readonly { tags: readonly string[] }[]} products @returns {Set<string>} */
export function collectTags(products) {
  return products.reduce((all, product) => all.union(new Set(product.tags)), new Set());
}

/** Return promo tags present in the catalog, with Set intersection semantics. @param {Set<string>} productTags @param {Set<string>} promoTags */
export function findPromoTags(productTags, promoTags) {
  return productTags.intersection(promoTags);
}

/** @template {(...args: any[]) => void} Callback @param {Callback} callback @param {number} delay @returns {(...args: Parameters<Callback>) => void} */
export function debounce(callback, delay = 250) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

/** @template {(...args: any[]) => void} Callback @param {Callback} callback @param {number} interval @returns {(...args: Parameters<Callback>) => void} */
export function throttle(callback, interval = 100) {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun < interval) return;
    lastRun = now;
    callback(...args);
  };
}
