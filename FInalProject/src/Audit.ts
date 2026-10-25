import { collectTags, findPromoTags } from './core/utils.js';
import { Product } from './Product';
import { AUDIT_CONFIG, stockStatus, type StockStatus } from './Inventory';

export interface AuditSummary {
  totalSkus: number;
  totalUnits: number;
  inventoryValue: number;
  statusCounts: Record<StockStatus, number>;
  topSellers: Array<{ id: string; name: string; unitsSold: number }>;
  lowStockAlerts: Product[];
  uniqueTagCount: number;
  promoTagCount: number;
}

export abstract class Audit<Source> {
  protected constructor(protected readonly source: Source) {}
  abstract run(): AuditSummary;
}

export class InventoryAudit extends Audit<readonly Product[]> {
  constructor(products: readonly Product[]) {
    super(products);
  }

  run(): AuditSummary {
    const grouped = Object.groupBy(this.source, (product) => stockStatus(product));
    const statusCounts = (Object.keys(grouped) as StockStatus[]).reduce<
      Record<StockStatus, number>
    >(
      (counts, status) => {
        counts[status] = grouped[status]?.length ?? 0;
        return counts;
      },
      { 'In stock': 0, 'Low stock': 0, 'Out of stock': 0 },
    );
    const promoTags = new Set(AUDIT_CONFIG.promoTags);
    const allTags = collectTags(this.source);
    return {
      totalSkus: this.source.length,
      totalUnits: this.source.reduce((sum, product) => sum + product.stock, 0),
      inventoryValue: this.source.reduce((sum, product) => sum + product.stock * product.price, 0),
      statusCounts,
      topSellers: this.source
        .toSorted((left, right) => right.soldUnits - left.soldUnits)
        .slice(0, AUDIT_CONFIG.topSellerLimit)
        .map(({ id, name, soldUnits }) => ({ id, name, unitsSold: soldUnits })),
      lowStockAlerts: this.source.filter((product) => stockStatus(product) !== 'In stock'),
      uniqueTagCount: allTags.size,
      promoTagCount: findPromoTags(allTags, promoTags).size,
    };
  }
}

export interface AuditCounter {
  record(event: string): number;
  total(): number;
  events(): ReadonlyMap<string, number>;
}

/** Encapsulates audit event state in a closure. */
export function createAuditCounter(): AuditCounter {
  let total = 0;
  const counts = new Map<string, number>();
  return {
    record(event) {
      total += 1;
      counts.set(event, (counts.get(event) ?? 0) + 1);
      return total;
    },
    total: () => total,
    events: () => new Map(counts),
  };
}
