import type { ReactNode } from 'react';
import type { AuditSummary } from '../Audit';
import { stockStatus } from '../Inventory';

interface AuditInsightsProps {
  summary: AuditSummary;
  onReviewAlerts: () => void;
}
export function AuditInsights({ summary, onReviewAlerts }: AuditInsightsProps): ReactNode {
  return (
    <section className="row g-3 audit-insights" aria-label="Inventory insights">
      <div className="col-lg-7">
        <article className="insight-card card h-100">
          <div className="insight-heading">
            <div>
              <p className="eyebrow">SELL-THROUGH</p>
              <h2>Top sellers</h2>
            </div>
            <span className="insight-period">All time</span>
          </div>
          <div className="seller-list">
            {summary.topSellers.map((product, index) => (
              <div className="seller-row" key={product.id}>
                <span className="seller-rank">0{index + 1}</span>
                <span className="seller-name">{product.name}</span>
                <div className="seller-bar">
                  <i
                    style={{
                      width: `${summary.topSellers[0] ? (product.unitsSold / summary.topSellers[0].unitsSold) * 100 : 0}%`,
                    }}
                  />
                </div>
                <strong>
                  {product.unitsSold}
                  <small> units</small>
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="col-lg-5">
        <article className="insight-card alert-insight card h-100">
          <div className="insight-heading">
            <div>
              <p className="eyebrow">STOCK WATCH</p>
              <h2>Restock alerts</h2>
            </div>
            <button className="insight-link btn" type="button" onClick={onReviewAlerts}>
              View all →
            </button>
          </div>
          <div className="alert-product-list">
            {summary.lowStockAlerts.slice(0, 3).map((product) => (
              <div className="alert-product" key={product.id}>
                <span className="alert-product-icon">{product.icon}</span>
                <span>
                  <strong>{product.name}</strong>
                  <small>
                    {stockStatus(product)} · {product.stock} left
                  </small>
                </span>
                <span className={`alert-level ${product.stock === 0 ? 'is-out' : ''}`}>
                  {product.stock === 0 ? 'Urgent' : 'Low'}
                </span>
              </div>
            ))}
          </div>
          <div className="tag-summary">
            Tag coverage <strong>{summary.uniqueTagCount} unique</strong>
            <span> · {summary.promoTagCount} promo</span>
          </div>
        </article>
      </div>
    </section>
  );
}
