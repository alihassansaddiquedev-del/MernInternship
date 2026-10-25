# Common Goods E-commerce Inventory Auditor

A standalone React and Bootstrap browser inventory auditor with an order bag. Its UI is split into typed TSX components under `src/components/`. The JavaScript core is in `src/core/`; it lives beside the existing CLI and does not change the CLI files.

## Run locally

```sh
npm install
npm run dev
```

Open the local address printed by Vite. `npm run typecheck` checks the TypeScript and `npm run build` creates the production bundle in `dist/`.

The catalog loads through a timed `fetch` from `public/products.json` and is validated with Zod. The auditor includes stock thresholds, receiving and bulk adjustments, persistent browser inventory, inventory valuation, low-stock alerts, top sellers, product editing and JSON export. Order bag changes use a discriminated action union and exhaustive reducer; inventory changes use their own exhaustive action union. The TypeScript layer includes partial product updates, category inventory records, a deeply readonly cart snapshot, generic constrained validators, an abstract audit class and a reusable `GenericTable<T>`. Search is debounced, page scroll work is throttled, and product-grid actions use event delegation. ESLint and Prettier are available with `npm run lint`, `npm run format`, and `npm run format:check`.
