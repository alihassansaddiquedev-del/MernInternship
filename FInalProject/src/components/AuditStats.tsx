import type { ReactNode } from 'react';
import type { Product } from '../Product';
import { inventoryValue } from '../Inventory';

interface AuditStatsProps {
  products: readonly Product[];
}
export function AuditStats({ products }: AuditStatsProps): ReactNode {
  const low = products.filter(
    (product) => product.stock > 0 && product.stock <= product.reorderAt,
  ).length;
  const out = products.filter((product) => product.stock === 0).length;
  const value = inventoryValue(products);
  const stats = [
    {
      label: 'Total inventory value',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value),
      note: 'Across all active products',
      icon: '↗',
      tone: 'green',
    },
    {
      label: 'Active products',
      value: String(products.length).padStart(2, '0'),
      note: 'Across 3 collections',
      icon: '▤',
      tone: 'sand',
    },
    {
      label: 'Low stock alerts',
      value: String(low + out).padStart(2, '0'),
      note: `${low} low · ${out} out of stock`,
      icon: '!',
      tone: 'rose',
    },
    {
      label: 'Units on hand',
      value: new Intl.NumberFormat('en-US').format(
        products.reduce((sum, product) => sum + product.stock, 0),
      ),
      note: 'Ready to fulfill',
      icon: '⌑',
      tone: 'blue',
    },
  ];
  return (
    <div className="row g-3 audit-stats">
      {stats.map((stat) => (
        <div className="col-6 col-xl-3" key={stat.label}>
          <article className="stat-card card h-100">
            <div className="stat-top">
              <span>{stat.label}</span>
              <span className={`stat-icon ${stat.tone}`}>{stat.icon}</span>
            </div>
            <strong className="stat-value">{stat.value}</strong>
            <span className="stat-note">{stat.note}</span>
          </article>
        </div>
      ))}
    </div>
  );
}
