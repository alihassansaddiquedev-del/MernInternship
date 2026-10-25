const API_BASE = 'https://jsonplaceholder.typicode.com';
const responseCache = new WeakMap();

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class HttpError extends ApiError {
  constructor(url, status, options = {}) {
    super(`Request failed (${status}) for ${url}`, options);
    this.status = status;
    this.url = url;
  }
}

export class RequestTimeoutError extends ApiError {
  constructor(url, timeoutMs, options = {}) {
    super(`Request timed out after ${timeoutMs} ms: ${url}`, options);
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}

export class NetworkError extends ApiError {
  constructor(url, options = {}) {
    super(`Could not load ${url}`, options);
    this.url = url;
  }
}

function cacheKey(url) {
  // Cache entries are keyed by an object so WeakMap can own their lifetime.
  return Object.freeze({ url });
}

export async function requestJson(path, { signal, timeoutMs = 8000 } = {}) {
  const url = new URL(path, API_BASE).href;
  const key = cacheKey(url);
  // The key object is intentionally retained in a companion map during this
  // dashboard session; WeakMap itself never exposes cache contents or keys.
  const existingKey = keyByUrl.get(url);
  if (existingKey && responseCache.has(existingKey)) return structuredClone(responseCache.get(existingKey));

  const controller = new AbortController();
  let timedOut = false;
  const relayAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) relayAbort();
  else signal?.addEventListener('abort', relayAbort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error('Timeout'));
  }, timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new HttpError(url, response.status);
    const data = await response.json();
    responseCache.set(key, data);
    keyByUrl.set(url, key);
    return structuredClone(data);
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    if (timedOut) throw new RequestTimeoutError(url, timeoutMs, { cause });
    if (signal?.aborted) throw cause;
    throw new NetworkError(url, { cause });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', relayAbort);
  }
}

// URL lookup does not retain response payloads; payloads remain in WeakMap.
const keyByUrl = new Map();

export async function loadDashboard({ signal } = {}) {
  const results = await Promise.allSettled([
    requestJson('/users', { signal }),
    requestJson('/posts', { signal }),
    requestJson('/comments', { signal })
  ]);
  return results.map((result, index) => {
    if (result.status === 'fulfilled') return { kind: ['users', 'posts', 'comments'][index], data: result.value };
    return { kind: ['users', 'posts', 'comments'][index], error: result.reason };
  });
}

/** Promise chain: fetch a post, then fetch the user and comments related to it. */
export function loadPostDetails(postId, { signal } = {}) {
  return requestJson(`/posts/${postId}`, { signal })
    .then(post => Promise.all([
      Promise.resolve(post),
      requestJson(`/users/${post.userId}`, { signal }),
      requestJson(`/posts/${post.id}/comments`, { signal })
    ]))
    .then(([post, user, comments]) => ({ post, user, comments }));
}

export async function* paginate(path, { pageSize = 10, signal, maxPages = 10 } = {}) {
  for (let page = 1; page <= maxPages; page += 1) {
    const items = await requestJson(`${path}?_page=${page}&_limit=${pageSize}`, { signal });
    if (!Array.isArray(items) || items.length === 0) return;
    yield items;
    if (items.length < pageSize) return;
  }
}
