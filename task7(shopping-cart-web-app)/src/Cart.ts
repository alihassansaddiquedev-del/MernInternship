import { Product, type Category } from './Product';

export interface CartLine {
  product: Product;
  quantity: number;
}

export type DeepReadonly<T> = T extends (...args: never[]) => unknown ? T
  : T extends readonly (infer Item)[] ? readonly DeepReadonly<Item>[]
  : T extends object ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
  : T;
export type ReadonlyCart = DeepReadonly<CartLine[]>;

export type CartAction =
  | { type: 'add'; product: Product; quantity?: number }
  | { type: 'remove'; productId: string }
  | { type: 'set-quantity'; productId: string; quantity: number }
  | { type: 'clear' };

function assertNever(action: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(action)}`);
}

export function reduceCart(lines: readonly CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const count = action.quantity ?? 1;
      if (!Number.isInteger(count) || count < 1) throw new RangeError('Choose at least one item.');
      const existing = lines.find(({ product }) => product.id === action.product.id);
      return existing
        ? lines.map((line) => line.product.id === existing.product.id ? { ...line, quantity: line.quantity + count } : line)
        : [...lines, { product: action.product, quantity: count }];
    }
    case 'remove': return lines.filter(({ product }) => product.id !== action.productId);
    case 'set-quantity':
      if (!Number.isInteger(action.quantity) || action.quantity < 0) throw new RangeError('Quantity cannot be negative.');
      return action.quantity === 0
        ? lines.filter(({ product }) => product.id !== action.productId)
        : lines.map((line) => line.product.id === action.productId ? { ...line, quantity: action.quantity } : line);
    case 'clear': return [];
    default: return assertNever(action);
  }
}

export function totalQuantity(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function countCategories(lines: readonly CartLine[]): number {
  return new Set(lines.map(({ product }) => product.category satisfies Category)).size;
}
