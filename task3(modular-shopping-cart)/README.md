# Modular Shopping Cart (Node.js 24 LTS)

A small shopping-cart project demonstrating modern JavaScript ES modules and APIs.

## Requirements
- Node.js 24 LTS recommended (supports JSON import attributes, `Map.groupBy`, `structuredClone`, and `toSorted`).
- npm

## Run
```bash
npm start
```

## Optional type checking
```bash
npm install
npm run check
```

The project uses JSDoc types and `// @ts-check` in JavaScript files. The type-check command uses TypeScript and Node.js type definitions as development dependencies.

## Project structure
```text
src/
  Cart.js          Add/remove/update items, totals, deep-clone snapshots
  Product.js       Product class with #private fields and static helpers
  Utils.js         Sorting, Map.groupBy, Set-based unique categories, price formatting, JSON summary
  main.js          JSON import attribute, dynamic imports, demo
  data/catalog.json
```

## Concepts demonstrated
- ES modules: `import` / `export` and dynamic `import()`
- JSON import attributes: `with { type: 'json' }`
- Destructuring and spread syntax for item operations
- Classes, `#private` fields, getters, and static methods
- JSDoc annotations and `// @ts-check`
- `Map.groupBy`, `Set`, `toSorted`, and `structuredClone`
- `Intl.NumberFormat` for PKR currency formatting
- Template literals to produce a JSON summary

All prices in the sample catalog are in Pakistani rupees (PKR).
