import type { CSSProperties, ReactNode } from 'react';
import type { ReadonlyCart } from '../Cart';
import { totalQuantity } from '../Cart';
import type { CartAction } from '../Cart';

interface CartDrawerProps {
  lines: ReadonlyCart;
  open: boolean;
  onClose: () => void;
  onAction: (action: CartAction) => void;
  onCheckout: () => void;
}
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const subtotalFor = (lines: ReadonlyCart): number =>
  lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

export function CartDrawer({
  lines,
  open,
  onClose,
  onAction,
  onCheckout,
}: CartDrawerProps): ReactNode {
  const subtotal = subtotalFor(lines);
  const count = totalQuantity(lines);
  return (
    <>
      <div
        className={`drawer-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`cart-drawer offcanvas offcanvas-end ${open ? 'show' : ''}`}
        aria-label="Shopping bag"
        aria-hidden={!open}
      >
        <div className="drawer-header offcanvas-header">
          <div>
            <p className="eyebrow">Your selection</p>
            <h2 className="offcanvas-title">
              Your bag <span>({count})</span>
            </h2>
          </div>
          <button
            className="btn-close"
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
          />
        </div>
        {lines.length ? (
          <>
            <div className="shipping-progress">
              <div className="shipping-message">
                {subtotal >= 75
                  ? 'You unlocked complimentary shipping ✳'
                  : `You’re ${money.format(75 - subtotal)} away from complimentary shipping`}
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={Math.min(100, (subtotal / 75) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-bar"
                  style={{ width: `${Math.min(100, (subtotal / 75) * 100)}%` }}
                />
              </div>
            </div>
            <div className="cart-lines offcanvas-body">
              {lines.map(({ product, quantity }) => (
                <article className="cart-line" key={product.id}>
                  <div
                    className="line-art"
                    style={{ '--card-color': product.color } as CSSProperties}
                  >
                    {product.icon}
                  </div>
                  <div className="line-detail">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <span className="line-price">{money.format(product.price)}</span>
                    <div className="quantity-control input-group input-group-sm">
                      <button
                        className="btn"
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          onAction({
                            type: 'set-quantity',
                            productId: product.id,
                            quantity: quantity - 1,
                          })
                        }
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        className="btn"
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          onAction({
                            type: 'set-quantity',
                            productId: product.id,
                            quantity: quantity + 1,
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="remove-line btn"
                    type="button"
                    onClick={() => onAction({ type: 'remove', productId: product.id })}
                    aria-label={`Remove ${product.name}`}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
            <div className="drawer-footer">
              <div className="subtotal-row">
                <span>Subtotal</span>
                <strong>{money.format(subtotal)}</strong>
              </div>
              <p>Shipping and taxes calculated at checkout.</p>
              <button className="checkout-button btn" type="button" onClick={onCheckout}>
                Continue to checkout <span>→</span>
              </button>
              <div className="secure-note">✳ A considered choice. Always.</div>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <span className="empty-mark">c</span>
            <h3>A little room for good things.</h3>
            <p>Your bag is waiting for something lovely.</p>
            <button className="text-button btn" onClick={onClose}>
              Keep exploring <span>→</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
