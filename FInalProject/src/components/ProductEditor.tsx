import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Product, ProductSchema, type ProductUpdate } from '../Product';

interface ProductEditorProps {
  product: Product | null;
  onClose: () => void;
  onSave: (id: string, changes: ProductUpdate) => void;
}
export function ProductEditor({ product, onClose, onSave }: ProductEditorProps): ReactNode {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setName(product?.name ?? '');
    setPrice(product ? String(product.price) : '');
    setError('');
  }, [product]);
  if (!product) return null;
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const candidate = { ...product.toJSON(), name, price: Number(price) };
    const result = ProductSchema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check the product details.');
      return;
    }
    onSave(product.id, { name: result.data.name, price: result.data.price });
  };
  return (
    <div
      className="modal-backdrop-custom"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="product-modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Product details</p>
            <h2 id="edit-title">Edit product</h2>
          </div>
          <button className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <form onSubmit={submit}>
          <label className="form-label" htmlFor="product-name">
            Product name
          </label>
          <input
            className="form-control"
            id="product-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <label className="form-label mt-3" htmlFor="product-price">
            Unit price
          </label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              className="form-control"
              id="product-price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>
          <div className="form-text mt-2">
            Changes are validated against the product schema before saving.
          </div>
          {error && (
            <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn save-button">
              Save changes <span>→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
