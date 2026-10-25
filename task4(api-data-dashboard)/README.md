# API Data Dashboard

Run `npm start` and open [http://localhost:4173](http://localhost:4173). The dashboard loads users, posts, and comments from JSONPlaceholder, shows per-endpoint results with `Promise.allSettled`, and fetches nested post details through chained promises.

The data layer includes request timeouts and `AbortController` cancellation, custom API error classes that preserve `cause`, an async generator for paged posts, and an in-memory `WeakMap` cache. The UI demonstrates debounced search with `setTimeout` and throttled scroll loading.
