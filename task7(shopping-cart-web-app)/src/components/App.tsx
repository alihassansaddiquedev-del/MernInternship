import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { countCategories, reduceCart, totalQuantity, type CartAction, type CartLine, type ReadonlyCart } from '../Cart';
import { createActionHandler } from '../handlers';
import { Product, ProductSchema, type Category } from '../Product';
import { CartDrawer } from './CartDrawer';
import { Hero } from './Hero';
import { ProductGrid, type ProductSort } from './ProductGrid';
import { SiteHeader } from './SiteHeader';
import { StoreFooter } from './StoreFooter';

export function App(): ReactNode {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [sort, setSort] = useState<ProductSort>('featured');
  const [toast, setToast] = useState('');
  const count = totalQuantity(cart);
  const cartSnapshot = useMemo(() => structuredClone(cart) as ReadonlyCart, [cart]);

  const onAction = createActionHandler((action) => setCart((current) => reduceCart(current, action)));
  const notify = (message: string): void => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => { if (event.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const addProduct = (product: Product): void => {
    const validatedProduct = new Product(ProductSchema.parse(product));
    onAction({ type: 'add', product: validatedProduct });
    notify(`${product.name} added to your bag`);
  };

  const checkout = (): void => {
    const collectionCount = countCategories(cart);
    notify(`Lovely choice — ${count} item${count === 1 ? '' : 's'} across ${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'}.`);
    onAction({ type: 'clear' });
    setDrawerOpen(false);
  };

  return <div className="storefront">
    <SiteHeader itemCount={count} onBagOpen={() => setDrawerOpen(true)} />
    <main><Hero /><ProductGrid category={category} sort={sort} onCategoryChange={setCategory} onSortChange={setSort} onAdd={addProduct} /></main>
    <StoreFooter />
    <CartDrawer lines={cartSnapshot} open={drawerOpen} onClose={() => setDrawerOpen(false)} onAction={onAction} onCheckout={checkout} />
    <div className={`toast-message ${toast ? 'is-visible' : ''}`} role="status" aria-live="polite">{toast}</div>
  </div>;
}
