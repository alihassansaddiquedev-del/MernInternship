import { z } from 'zod';

export const categories = ['Home', 'Wearables', 'Stationery'] as const;
export type Category = (typeof categories)[number];

export const ProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    category: z.enum(categories),
    price: z.number().finite().positive('Price must be greater than zero'),
    description: z.string().min(1),
    color: z.string().min(1),
    stock: z.number().int().nonnegative(),
    reorderAt: z.number().int().positive(),
    supplier: z.string().min(1),
    soldUnits: z.number().int().nonnegative().default(0),
    tags: z.array(z.string()).default([]),
    badge: z.string().optional(),
    icon: z.string().min(1),
  })
  .strict();

export type ProductInput = z.input<typeof ProductSchema>;
export type ProductUpdate = Partial<Pick<Product, 'name' | 'price'>>;

export function validateProperty<T extends object, Key extends keyof T>(
  value: T,
  key: Key,
  isValid: (field: T[Key]) => boolean,
): value is T & Record<Key, T[Key]> {
  return isValid(value[key]);
}

export class Product {
  readonly #id: string;
  readonly #name: string;
  readonly #category: Category;
  readonly #price: number;
  readonly #description: string;
  readonly #color: string;
  readonly #stock: number;
  readonly #reorderAt: number;
  readonly #supplier: string;
  readonly #soldUnits: number;
  readonly #tags: Set<string>;
  readonly #badge?: string;
  readonly #icon: string;

  constructor(data: unknown) {
    const parsed = ProductSchema.parse(data);
    this.#id = parsed.id;
    this.#name = parsed.name;
    this.#category = parsed.category;
    this.#price = parsed.price;
    this.#description = parsed.description;
    this.#color = parsed.color;
    this.#stock = parsed.stock;
    this.#reorderAt = parsed.reorderAt;
    this.#supplier = parsed.supplier;
    this.#soldUnits = parsed.soldUnits;
    this.#tags = new Set(parsed.tags);
    this.#badge = parsed.badge;
    this.#icon = parsed.icon;
  }

  get id(): string {
    return this.#id;
  }
  get name(): string {
    return this.#name;
  }
  get category(): Category {
    return this.#category;
  }
  get price(): number {
    return this.#price;
  }
  get description(): string {
    return this.#description;
  }
  get color(): string {
    return this.#color;
  }
  get stock(): number {
    return this.#stock;
  }
  get reorderAt(): number {
    return this.#reorderAt;
  }
  get supplier(): string {
    return this.#supplier;
  }
  get soldUnits(): number {
    return this.#soldUnits;
  }
  get tags(): string[] {
    return [...this.#tags];
  }
  get badge(): string | undefined {
    return this.#badge;
  }
  get icon(): string {
    return this.#icon;
  }

  update(changes: ProductUpdate): Product {
    return new Product({ ...this.toJSON(), ...changes });
  }

  withStock(stock: number): Product {
    return new Product({ ...this.toJSON(), stock });
  }

  withSale(quantity: number): Product {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > this.#stock) {
      throw new RangeError('The sale quantity must fit the current stock.');
    }
    return new Product({
      ...this.toJSON(),
      stock: this.#stock - quantity,
      soldUnits: this.#soldUnits + quantity,
    });
  }

  toJSON(): ProductInput {
    return {
      id: this.#id,
      name: this.#name,
      category: this.#category,
      price: this.#price,
      description: this.#description,
      color: this.#color,
      stock: this.#stock,
      reorderAt: this.#reorderAt,
      supplier: this.#supplier,
      soldUnits: this.#soldUnits,
      tags: [...this.#tags],
      badge: this.#badge,
      icon: this.#icon,
    };
  }
}
