import { Product, type Category } from './Product';

const incomingProducts: unknown[] = [
  { id: 'mug', name: 'Forma ceramic mug', category: 'Home', price: 28, description: 'A hand-finished stoneware mug for slow mornings.', color: '#e9ddd0', badge: 'Bestseller', icon: '☕' },
  { id: 'throw', name: 'Sunday cotton throw', category: 'Home', price: 86, description: 'Soft, breathable cotton with a relaxed woven texture.', color: '#dce5db', badge: 'New', icon: '▤' },
  { id: 'tote', name: 'Market day tote', category: 'Wearables', price: 42, description: 'A sturdy everyday carryall made for the long way home.', color: '#e8e5c9', icon: '◩' },
  { id: 'cap', name: 'Weekend canvas cap', category: 'Wearables', price: 34, description: 'An easy, unstructured cap in washed organic cotton.', color: '#e3d8d0', icon: '⌂' },
  { id: 'notebook', name: 'Field notes set', category: 'Stationery', price: 18, description: 'Three pocket notebooks for lists, sketches and ideas.', color: '#d9e4e8', badge: 'Set of 3', icon: '▧' },
  { id: 'pen', name: 'Everyday brass pen', category: 'Stationery', price: 24, description: 'A balanced, refillable pen that feels good to hold.', color: '#e8dfc7', icon: '✎' }
];

export const products = incomingProducts.map((data) => new Product(data));
export const inventory: Record<Category, Product[]> = {
  Home: products.filter((product) => product.category === 'Home'),
  Wearables: products.filter((product) => product.category === 'Wearables'),
  Stationery: products.filter((product) => product.category === 'Stationery')
};
