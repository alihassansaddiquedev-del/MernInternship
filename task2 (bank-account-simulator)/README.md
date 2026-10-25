# Bank account simulator

Run the demonstration with Node.js:

```sh
npm start
```

`accounts.js` exports `createAccount`, a factory for base, savings, and checking accounts. Balances and event emitters live in module-private `WeakMap`s, while prototype methods provide `deposit`, `withdraw`, and `transfer`. The demo also shows a curried percentage fee calculator, `call`/`apply`/`bind`, `Intl.NumberFormat` currency output, and `node:events` low-balance callbacks.
