import type { CSSProperties, ReactNode } from 'react';
import type { Product } from '../Product';

interface ProductCardProps {
  product: Product;
  index: number;
  onAdd: (product: Product) => void;
}
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductCard({ product, index, onAdd }: ProductCardProps): ReactNode {
  return (
    <article
      className="product-card card border-0"
      style={{ '--card-color': product.color, '--delay': `${index * 65}ms` } as CSSProperties}
    >
      <div className="product-visual card-img-top">
        <div className={`product-shape shape-${product.id}`}>{product.icon}</div>
        {product.badge && <span className="product-badge badge">{product.badge}</span>}
        <button
          className="quick-add btn"
          type="button"
          onClick={() => onAdd(product)}
          aria-label={`Add ${product.name} to bag`}
        >
          <span aria-hidden="true">+</span> Quick add
        </button>
        <span className="visual-index">0{index + 1}</span>
      </div>
      <div className="product-meta card-body px-0">
        <div>
          <p className="product-category">{product.category}</p>
          <h3>{product.name}</h3>
        </div>
        <span className="product-price">{money.format(product.price)}</span>
        <p className="product-description">{product.description}</p>
      </div>
    </article>
  );
}
