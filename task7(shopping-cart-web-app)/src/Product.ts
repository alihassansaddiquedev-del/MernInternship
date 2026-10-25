import { z } from 'zod';

export const categories = ['Home', 'Wearables', 'Stationery'] as const;
export type Category = typeof categories[number];

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  category: z.enum(categories),
  price: z.number().finite().positive('Price must be greater than zero'),
  description: z.string().min(1),
  color: z.string().min(1),
  badge: z.string().optional(),
  icon: z.string().min(1)
}).strict();

export type ProductInput = z.input<typeof ProductSchema>;
export type ProductUpdate = Partial<Pick<Product, 'name' | 'price'>>;

export function validateProperty<T extends object, Key extends keyof T>(
  value: T,
  key: Key,
  isValid: (field: T[Key]) => boolean
): value is T & Record<Key, T[Key]> {
  return isValid(value[key]);
}

export class Product {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly price: number;
  readonly description: string;
  readonly color: string;
  readonly badge?: string;
  readonly icon: string;

  constructor(data: unknown) {
    const parsed = ProductSchema.parse(data);
    Object.assign(this, parsed);
    this.id = parsed.id;
    this.name = parsed.name;
    this.category = parsed.category;
    this.price = parsed.price;
    this.description = parsed.description;
    this.color = parsed.color;
    this.badge = parsed.badge;
    this.icon = parsed.icon;
  }

  update(changes: ProductUpdate): Product {
    return new Product({ ...this, ...changes });
  }
}
