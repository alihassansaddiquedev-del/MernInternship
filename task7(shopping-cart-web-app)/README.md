# Common Goods Shopping Cart

A standalone React and Bootstrap browser version of the shopping cart. Its UI is split into typed TSX components under `src/components/`. It lives beside the existing CLI and does not change the CLI files.

## Run locally

```sh
npm install
npm run dev
```

Open the local address printed by Vite. `npm run typecheck` checks the TypeScript and `npm run build` creates the production bundle in `dist/`.

The catalog is validated with Zod before products enter the UI. Cart changes use a discriminated action union and an exhaustive reducer. Types include partial product updates, category inventory records, a deeply readonly cart snapshot, generic constrained validators, and inferred action handler types.
