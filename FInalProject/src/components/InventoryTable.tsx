import type { CSSProperties, ReactNode } from 'react';
import type { Product } from '../Product';
import { stockStatus } from '../Inventory';
import { GenericTable, type GenericTableColumn } from './GenericTable';

interface InventoryTableProps {
  products: readonly Product[];
  selectedIds: ReadonlySet<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function InventoryTable({
  products,
  selectedIds,
  onSelect,
  onSelectAll,
}: InventoryTableProps): ReactNode {
  if (!products.length)
    return (
      <div className="empty-results">
        <span>⌕</span>
        <strong>No products match these filters.</strong>
        <p>Try another category or search term.</p>
      </div>
    );

  const columns: GenericTableColumn<Product>[] = [
    {
      id: 'select',
      heading: (
        <input
          className="form-check-input"
          type="checkbox"
          aria-label="Select all visible products"
          checked={products.length > 0 && products.every((item) => selectedIds.has(item.id))}
          onChange={(event) => onSelectAll(event.target.checked)}
        />
      ),
      className: 'select-cell',
      render: (product) => (
        <input
          className="form-check-input product-select"
          type="checkbox"
          aria-label={`Select ${product.name}`}
          checked={selectedIds.has(product.id)}
          onChange={(event) => onSelect(product.id, event.target.checked)}
        />
      ),
    },
    {
      id: 'product',
      heading: 'PRODUCT',
      render: (product) => (
        <div className="product-cell">
          <span
            className="product-thumb"
            style={{ '--card-color': product.color } as CSSProperties}
          >
            {product.icon}
          </span>
          <span>
            <strong>{product.name}</strong>
            <small>{product.description}</small>
          </span>
        </div>
      ),
    },
    {
      id: 'sku',
      heading: 'SKU',
      render: (product) => (
        <code className="sku-code">CG-{product.id.toUpperCase().slice(0, 5)}</code>
      ),
    },
    {
      id: 'category',
      heading: 'CATEGORY',
      render: (product) => <span className="category-label">{product.category}</span>,
    },
    {
      id: 'price',
      heading: 'UNIT PRICE',
      render: (product) => <span className="price-cell">{money.format(product.price)}</span>,
    },
    {
      id: 'stock',
      heading: 'STOCK LEVEL',
      render: (product) => {
        const status = stockStatus(product);
        const width = `${Math.min(100, (product.stock / Math.max(product.reorderAt * 3, 1)) * 100)}%`;
        return (
          <>
            <div className="stock-count">
              <strong>{product.stock}</strong>
              <span> / {product.reorderAt} min</span>
            </div>
            <div className="stock-track">
              <span
                className={
                  status === 'In stock'
                    ? 'stock-good'
                    : status === 'Low stock'
                      ? 'stock-low'
                      : 'stock-none'
                }
                style={{ width }}
              />
            </div>
          </>
        );
      },
    },
    {
      id: 'status',
      heading: 'STATUS',
      render: (product) => {
        const status = stockStatus(product);
        const tone =
          status === 'In stock'
            ? 'status-good'
            : status === 'Low stock'
              ? 'status-low'
              : 'status-out';
        return (
          <span className={`status-pill ${tone}`}>
            <i />
            {status}
          </span>
        );
      },
    },
    {
      id: 'supplier',
      heading: 'SUPPLIER',
      render: (product) => <span className="supplier-cell">{product.supplier}</span>,
    },
    {
      id: 'actions',
      heading: 'ACTIONS',
      render: (product) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-sm adjust-button"
            data-audit-action="receive"
            data-product-id={product.id}
            aria-label={`Receive one ${product.name}`}
            title="Receive one"
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-sm adjust-button"
            data-audit-action="deduct"
            data-product-id={product.id}
            disabled={product.stock === 0}
            aria-label={`Remove one ${product.name}`}
            title="Remove one"
          >
            −
          </button>
          <button
            type="button"
            className="btn btn-sm edit-button"
            data-audit-action="edit"
            data-product-id={product.id}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm order-button"
            data-audit-action="order"
            data-product-id={product.id}
            disabled={product.stock === 0}
          >
            Add to bag
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="table-responsive inventory-table-wrap" id="inventory-product-grid">
      <GenericTable
        rows={products}
        columns={columns}
        rowKey={(product) => product.id}
        rowClassName={(product) => (stockStatus(product) === 'Out of stock' ? 'row-out' : '')}
        className="inventory-table"
      ></GenericTable>
    </div>
  );
}
