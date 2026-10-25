import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  countCategories,
  reduceCart,
  totalQuantity,
  type CartAction,
  type CartLine,
  type ReadonlyCart,
} from '../Cart';
import { groupInventory, reduceInventory, stockStatus, type InventoryAction } from '../Inventory';
import { InventoryAudit, createAuditCounter } from '../Audit';
import { createActionHandler } from '../handlers';
import { Product, ProductSchema, categories, type Category, type ProductUpdate } from '../Product';
import { products as catalogProducts } from '../catalog';
import { fetchCatalog } from '../core/api';
import { debounce, throttle } from '../core/utils.js';
import { AuditStats } from './AuditStats';
import { AuditInsights } from './AuditInsights';
import { AuditorSidebar } from './AuditorSidebar';
import { BulkEditBar } from './BulkEditBar';
import { CartDrawer } from './CartDrawer';
import { InventoryTable } from './InventoryTable';
import { ProductEditor } from './ProductEditor';

type StockFilter = 'all' | 'attention' | 'in-stock';
const dateLabel = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date());

function loadSavedInventory(): Product[] | null {
  try {
    const saved = localStorage.getItem('common-goods-inventory-v1');
    if (!saved) return null;
    const input: unknown = JSON.parse(saved);
    if (!Array.isArray(input)) return null;
    return input.map((product: unknown) => new Product(ProductSchema.parse(product)));
  } catch {
    return null;
  }
}

export function App(): ReactNode {
  const [savedInventory] = useState(loadSavedInventory);
  const [inventoryItems, setInventoryItems] = useState<Product[]>(
    savedInventory ?? catalogProducts,
  );
  const [isLoading, setIsLoading] = useState(savedInventory === null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sort, setSort] = useState<'name' | 'stock' | 'price'>('name');
  const [editing, setEditing] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [toast, setToast] = useState('');
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [scrollCompact, setScrollCompact] = useState(false);
  const auditCounter = useRef(createAuditCounter());

  const grouped = useMemo(() => groupInventory(inventoryItems), [inventoryItems]);
  const auditSummary = useMemo(() => new InventoryAudit(inventoryItems).run(), [inventoryItems]);
  const lowStockCount = auditSummary.lowStockAlerts.length;
  const count = totalQuantity(cart);
  const cartSnapshot = useMemo(
    () =>
      cart.map(({ product, quantity }) => ({
        product: product.toJSON(),
        quantity,
      })) as ReadonlyCart,
    [cart],
  );
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return inventoryItems
      .filter((product) => {
        const matchesCategory = category === 'All' || product.category === category;
        const matchesSearch =
          !term ||
          `${product.name} ${product.id} ${product.category} ${product.supplier}`
            .toLocaleLowerCase()
            .includes(term);
        const status = stockStatus(product);
        const attentionOnly = onlyAttention || stockFilter === 'attention';
        const matchesStock = attentionOnly
          ? status !== 'In stock'
          : stockFilter === 'in-stock'
            ? status === 'In stock'
            : true;
        return matchesCategory && matchesSearch && matchesStock;
      })
      .toSorted((left, right) =>
        sort === 'stock'
          ? left.stock - right.stock
          : sort === 'price'
            ? left.price - right.price
            : left.name.localeCompare(right.name),
      );
  }, [category, inventoryItems, onlyAttention, search, sort, stockFilter]);

  const applyCartAction = useMemo(
    () =>
      createActionHandler((action: CartAction) =>
        setCart((current) => reduceCart(current, action)),
      ),
    [],
  );
  const applyInventoryAction = useMemo(
    () =>
      createActionHandler((action: InventoryAction) =>
        setInventoryItems((current) => reduceInventory(current, action)),
      ),
    [],
  );
  const notify = useCallback((message: string): void => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }, []);

  useEffect(() => {
    if (savedInventory) return;
    let active = true;
    fetchCatalog()
      .then((loaded) => {
        if (active) setInventoryItems(loaded);
      })
      .catch(() => {
        if (active) notify('Could not load the mock API; showing the bundled catalog.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [savedInventory, notify]);
  useEffect(() => {
    if (!isLoading)
      localStorage.setItem(
        'common-goods-inventory-v1',
        JSON.stringify(inventoryItems.map((item) => item.toJSON())),
      );
  }, [inventoryItems, isLoading]);
  const debouncedSearch = useMemo(() => debounce((value: string) => setSearch(value), 240), []);
  useEffect(() => {
    const onScroll = throttle(() => setScrollCompact(window.scrollY > 18), 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setBagOpen(false);
        setEditing(null);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const adjustStock = useCallback(
    (productId: string, delta: number): void => {
      try {
        applyInventoryAction({ type: 'adjust-stock', productId, delta });
        auditCounter.current.record('stock-adjustment');
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Unable to adjust stock.');
      }
    },
    [applyInventoryAction, notify],
  );
  const saveProduct = (id: string, changes: ProductUpdate): void => {
    applyInventoryAction({ type: 'update-product', productId: id, changes });
    auditCounter.current.record('product-edit');
    setEditing(null);
    notify('Product details updated.');
  };
  const addToBag = useCallback(
    (product: Product): void => {
      const reserved = cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
      if (reserved >= product.stock) {
        notify(`Only ${product.stock} units are available.`);
        return;
      }
      applyCartAction({ type: 'add', product });
      auditCounter.current.record('bag-add');
      notify(`${product.name} added to order bag.`);
    },
    [applyCartAction, cart, notify],
  );
  useEffect(() => {
    const grid = document.getElementById('inventory-product-grid');
    if (!grid) return;
    const handleDelegatedClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(
        '[data-audit-action][data-product-id]',
      );
      if (!button || button.disabled) return;
      const product = inventoryItems.find((item) => item.id === button.dataset.productId);
      if (!product) return;
      switch (button.dataset.auditAction) {
        case 'receive':
          adjustStock(product.id, 1);
          break;
        case 'deduct':
          adjustStock(product.id, -1);
          break;
        case 'edit':
          setEditing(product);
          break;
        case 'order':
          addToBag(product);
          break;
      }
    };
    grid.addEventListener('click', handleDelegatedClick);
    return () => grid.removeEventListener('click', handleDelegatedClick);
  }, [inventoryItems, isLoading, addToBag, adjustStock]);
  const handleCartAction = (action: CartAction): void => {
    if (action.type === 'set-quantity') {
      const product = inventoryItems.find((item) => item.id === action.productId);
      if (product && action.quantity > product.stock) {
        notify(`Only ${product.stock} units are available.`);
        return;
      }
    }
    applyCartAction(action);
  };
  const completeOrder = (): void => {
    const orderedUnits = totalQuantity(cart);
    let nextInventory: Product[];
    try {
      nextInventory = cart.reduce(
        (current, line) =>
          reduceInventory(current, {
            type: 'record-sale',
            productId: line.product.id,
            quantity: line.quantity,
          }),
        inventoryItems,
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not record this order.');
      return;
    }
    setInventoryItems(nextInventory);
    auditCounter.current.record('order-recorded');
    applyCartAction({ type: 'clear' });
    setBagOpen(false);
    notify(
      `Order recorded · ${orderedUnits} unit${orderedUnits === 1 ? '' : 's'} across ${countCategories(cart)} collections.`,
    );
  };
  const handleSelect = (id: string, checked: boolean): void => {
    setSelectedIds((current) =>
      checked ? current.union(new Set([id])) : current.difference(new Set([id])),
    );
  };
  const selectVisible = (checked: boolean): void => {
    const visibleIds = new Set(filteredProducts.map((product) => product.id));
    setSelectedIds((current) =>
      checked ? current.union(visibleIds) : current.difference(visibleIds),
    );
  };
  const applyBulkEdit = (formData: FormData): void => {
    const operation = formData.get('operation');
    const quantity = Number(formData.get('quantity'));
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      (operation !== 'receive' && operation !== 'deduct')
    ) {
      notify('Choose a whole number of units and a stock action.');
      return;
    }
    const delta = operation === 'receive' ? quantity : -quantity;
    const selectedProducts = inventoryItems.filter((product) => selectedIds.has(product.id));
    if (delta < 0 && selectedProducts.some((product) => product.stock < quantity)) {
      notify('The deduction is higher than at least one selected stock level.');
      return;
    }
    setInventoryItems((current) =>
      selectedProducts.reduce(
        (items, product) =>
          reduceInventory(items, { type: 'adjust-stock', productId: product.id, delta }),
        current,
      ),
    );
    auditCounter.current.record('bulk-stock-adjustment');
    setSelectedIds(new Set());
    notify(`Bulk stock update applied to ${selectedProducts.length} products.`);
  };
  const selectSearch = (value: string): void => {
    setSearchInput(value);
    debouncedSearch(value);
  };
  const navigate = (view: string): void => {
    setActiveView(view);
    if (view === 'overview' || view === 'inventory')
      document
        .getElementById(view === 'overview' ? 'overview' : 'inventory')
        ?.scrollIntoView({ behavior: 'smooth' });
    else
      notify(`${view[0].toUpperCase()}${view.slice(1)} workspace is ready for your next report.`);
  };

  const attentionText =
    lowStockCount === 1 ? '1 product needs attention' : `${lowStockCount} products need attention`;
  return (
    <div className="auditor-app">
      <AuditorSidebar active={activeView} lowStockCount={lowStockCount} onNavigate={navigate} />
      <main className="auditor-main" id="overview">
        <header className={`topbar ${scrollCompact ? 'is-scrolled' : ''}`}>
          <div className="mobile-brand">
            <span className="brand-mark">c</span> common<span className="brand-light">goods</span>
          </div>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>Inventory</strong>
          </div>
          <div className="topbar-actions">
            <span className="audit-event-count">{auditCounter.current.total()} audit actions</span>
            <span className="today-label">{dateLabel}</span>
            <button
              className="notification-button"
              type="button"
              aria-label={`${lowStockCount} stock alerts`}
            >
              ♧{lowStockCount > 0 && <i />}
            </button>
            <button className="btn top-order-button" type="button" onClick={() => setBagOpen(true)}>
              Order bag <span className="badge">{count}</span>
            </button>
          </div>
        </header>
        <div className="dashboard-content">
          <section className="page-intro">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-dot" /> YOUR STORE AT A GLANCE
              </p>
              <h1>
                Inventory <em>overview</em>
              </h1>
              <p className="intro-copy">
                A clear view of what you have, what needs attention, and what’s moving.
              </p>
            </div>
            <button
              type="button"
              className="btn export-button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(inventoryItems, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = 'common-goods-inventory.json';
                anchor.click();
                URL.revokeObjectURL(url);
                notify('Inventory snapshot downloaded.');
              }}
            >
              <span>↓</span> Export inventory
            </button>
          </section>
          <AuditStats products={inventoryItems} />
          <section className="attention-banner">
            <div className="attention-icon">!</div>
            <div>
              <strong>{attentionText}</strong>
              <span>Review stock levels and replenish before you run out.</span>
            </div>
            <button
              className="btn attention-button"
              type="button"
              onClick={() => {
                setStockFilter('attention');
                setOnlyAttention(true);
                setActiveView('inventory');
                document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Review alerts <span>→</span>
            </button>
            <div className="banner-orbit" />
          </section>
          <AuditInsights
            summary={auditSummary}
            onReviewAlerts={() => {
              setStockFilter('attention');
              setOnlyAttention(false);
              document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <section className="inventory-section" id="inventory">
            <div className="inventory-heading">
              <div>
                <p className="eyebrow">THE COLLECTION</p>
                <h2>
                  Product inventory <span>{inventoryItems.length}</span>
                </h2>
              </div>
              <button
                className="btn audit-button"
                type="button"
                onClick={() =>
                  setOnlyAttention((value) => {
                    const next = !value;
                    setStockFilter(next ? 'attention' : 'all');
                    return next;
                  })
                }
              >
                ⌁ <span>{onlyAttention ? 'Show all stock' : 'Audit stock'}</span>
              </button>
            </div>
            <div className="inventory-controls">
              <div className="filter-tabs" role="group" aria-label="Filter inventory">
                <button
                  className={`btn ${stockFilter === 'all' && !onlyAttention ? 'active' : ''}`}
                  onClick={() => {
                    setStockFilter('all');
                    setOnlyAttention(false);
                  }}
                >
                  All items <span>{inventoryItems.length}</span>
                </button>
                <button
                  className={`btn ${stockFilter === 'attention' || onlyAttention ? 'active' : ''}`}
                  onClick={() => {
                    setStockFilter('attention');
                    setOnlyAttention(false);
                  }}
                >
                  Needs attention <span>{lowStockCount}</span>
                </button>
                <button
                  className={`btn ${stockFilter === 'in-stock' && !onlyAttention ? 'active' : ''}`}
                  onClick={() => {
                    setStockFilter('in-stock');
                    setOnlyAttention(false);
                  }}
                >
                  In stock
                </button>
              </div>
              <div className="control-right">
                <label className="search-field">
                  <span aria-hidden="true">⌕</span>
                  <input
                    className="form-control"
                    value={searchInput}
                    onChange={(event) => selectSearch(event.target.value)}
                    placeholder="Search products..."
                    aria-label="Search products"
                  />
                </label>
                <select
                  className="form-select category-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as Category | 'All')}
                  aria-label="Filter category"
                >
                  <option value="All">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item} · {grouped[item].length}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select sort-select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  aria-label="Sort inventory"
                >
                  <option value="name">Name A–Z</option>
                  <option value="stock">Stock: lowest</option>
                  <option value="price">Price: lowest</option>
                </select>
              </div>
            </div>
            <BulkEditBar
              selectedCount={selectedIds.size}
              onApply={applyBulkEdit}
              onClear={() => setSelectedIds(new Set())}
            />
            {isLoading ? (
              <div className="loading-state">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />{' '}
                Loading catalog from the mock API…
              </div>
            ) : (
              <InventoryTable
                products={filteredProducts}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={selectVisible}
              />
            )}
            <div className="table-footnote">
              <span>
                Showing <strong>{filteredProducts.length}</strong> of{' '}
                <strong>{inventoryItems.length}</strong> products
              </span>
              <span>Stock alerts trigger at each product’s reorder point.</span>
            </div>
          </section>
          <footer className="dashboard-footer">
            <span>Common Goods inventory · Changes save automatically in this browser.</span>
            <span>
              Last audited just now <i />
            </span>
          </footer>
        </div>
      </main>
      <ProductEditor product={editing} onClose={() => setEditing(null)} onSave={saveProduct} />
      <CartDrawer
        lines={cartSnapshot}
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        onAction={handleCartAction}
        onCheckout={completeOrder}
      />
      <div
        className={`toast-message ${toast ? 'is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
