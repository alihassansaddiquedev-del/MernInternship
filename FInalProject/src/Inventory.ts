import { Product, type Category, type ProductUpdate } from './Product';

export type StockStatus = 'In stock' | 'Low stock' | 'Out of stock';
interface AuditConfig {
  readonly topSellerLimit: number;
  readonly statusNames: readonly StockStatus[];
  readonly promoTags: readonly string[];
}
export const AUDIT_CONFIG = {
  topSellerLimit: 3,
  statusNames: ['In stock', 'Low stock', 'Out of stock'],
  promoTags: ['gift', 'seasonal', 'staff-pick'],
} as const satisfies AuditConfig;
export type InventoryAction =
  | { type: 'adjust-stock'; productId: string; delta: number }
  | { type: 'update-product'; productId: string; changes: ProductUpdate }
  | { type: 'record-sale'; productId: string; quantity: number };

function assertNever(action: never): never {
  throw new Error(`Unhandled inventory action: ${JSON.stringify(action)}`);
}

export function stockStatus(product: Product): StockStatus {
  if (product.stock === 0) return 'Out of stock';
  return product.stock <= product.reorderAt ? 'Low stock' : 'In stock';
}

export function reduceInventory(products: readonly Product[], action: InventoryAction): Product[] {
  switch (action.type) {
    case 'adjust-stock': {
      if (!Number.isInteger(action.delta))
        throw new RangeError('Stock adjustments must be whole numbers.');
      const product = products.find((item) => item.id === action.productId);
      if (!product) return [...products];
      const nextStock = product.stock + action.delta;
      if (nextStock < 0) throw new RangeError('Stock cannot fall below zero.');
      const index = products.findIndex((item) => item.id === action.productId);
      return index < 0
        ? [...products]
        : products.with(index, products[index]!.withStock(nextStock));
    }
    case 'update-product': {
      const index = products.findIndex((item) => item.id === action.productId);
      return index < 0
        ? [...products]
        : products.with(index, products[index]!.update(action.changes));
    }
    case 'record-sale': {
      const index = products.findIndex((item) => item.id === action.productId);
      return index < 0
        ? [...products]
        : products.with(index, products[index]!.withSale(action.quantity));
    }
    default:
      return assertNever(action);
  }
}

export function groupInventory<T extends { category: Category }>(
  items: readonly T[],
): Record<Category, T[]> {
  const byCategory = Map.groupBy(items, (item) => item.category);
  const grouped: Record<Category, T[]> = { Home: [], Wearables: [], Stationery: [] };
  for (const category of Object.keys(grouped) as Category[])
    grouped[category] = byCategory.get(category) ?? [];
  return grouped;
}

export function removeInventoryItem<T extends { id: string }>(
  items: readonly T[],
  id: string,
): T[] {
  const index = items.findIndex((item) => item.id === id);
  return index < 0 ? [...items] : items.toSpliced(index, 1);
}

export function inventoryValue<T extends { price: number; stock: number }>(
  items: readonly T[],
): number {
  return items.reduce((total, item) => total + item.price * item.stock, 0);
}
