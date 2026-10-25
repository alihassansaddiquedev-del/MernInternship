import { useMemo, type ReactNode } from 'react';
import { inventory, products } from '../catalog';
import { categories, type Category, type Product } from '../Product';
import { ProductCard } from './ProductCard';

export type ProductSort = 'featured' | 'price-low' | 'price-high';
interface ProductGridProps {
  category: Category | 'All';
  sort: ProductSort;
  onCategoryChange: (category: Category | 'All') => void;
  onSortChange: (sort: ProductSort) => void;
  onAdd: (product: Product) => void;
}

export function ProductGrid({
  category,
  sort,
  onCategoryChange,
  onSortChange,
  onAdd,
}: ProductGridProps): ReactNode {
  const visible = useMemo(() => {
    const selection = category === 'All' ? [...products] : [...inventory[category]];
    if (sort === 'price-low') selection.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') selection.sort((a, b) => b.price - a.price);
    return selection;
  }, [category, sort]);

  return (
    <section className="shop-section container-fluid" id="shop">
      <div className="section-heading row align-items-end">
        <div className="col">
          <p className="eyebrow">The good stuff</p>
          <h2>
            Find your <em>everyday.</em>
          </h2>
        </div>
        <p className="section-aside col-auto">
          Considered essentials for home,
          <br />
          work and everywhere in between.
        </p>
      </div>
      <div className="shop-toolbar d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="category-tabs btn-group" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`btn category-tab ${category === 'All' ? 'is-active' : ''}`}
            onClick={() => onCategoryChange('All')}
          >
            All <span>{products.length}</span>
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`btn category-tab ${category === item ? 'is-active' : ''}`}
              onClick={() => onCategoryChange(item)}
            >
              {item}
              <span>{inventory[item].length}</span>
            </button>
          ))}
        </div>
        <label className="sort-select-label d-flex align-items-center gap-2">
          <span>Sort by</span>
          <select
            className="form-select form-select-sm"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ProductSort)}
            aria-label="Sort products"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="product-grid row row-cols-2 row-cols-md-3 g-4" aria-live="polite">
        {visible.map((product, index) => (
          <div className="col" key={product.id}>
            <ProductCard product={product} index={index} onAdd={onAdd} />
          </div>
        ))}
      </div>
    </section>
  );
}
