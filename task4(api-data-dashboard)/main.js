import { loadDashboard, loadPostDetails, paginate, requestJson } from './api.js';

const $ = selector => document.querySelector(selector);
const statsEl = $('#stats');
const postsEl = $('#posts');
const usersEl = $('#users');
const commentsEl = $('#comments');
const searchInput = $('#search');
const searchStatus = $('#search-status');
const postCount = $('#post-count');
const sentinel = $('#load-sentinel');
const dialog = $('#detail-dialog');
const detailContent = $('#detail-content');
const currency = new Intl.NumberFormat('en-US');

let users = [];
let comments = [];
let allPosts = [];
let visiblePosts = [];
let pageIterator;
let loadingPage = false;
let searchTimer;
let activeSearchController;
let scrollTimer;
let isScrolling = false;
let toastTimer;

function initials(name) {
  return name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function renderStats() {
  const cards = [
    ['Registered users', users.length, 'From the public users endpoint'],
    ['Posts in feed', allPosts.length, `${visiblePosts.length} currently match your search`],
    ['Comments loaded', comments.length, 'Community conversation activity']
  ];
  statsEl.innerHTML = cards.map(([label, value, note]) => `<article class="stat-card"><div><div class="stat-label">${label}</div><div class="stat-value">${currency.format(value)}</div></div><div class="stat-note">${note}</div></article>`).join('');
}

function renderUsers() {
  usersEl.innerHTML = users.slice(0, 6).map(user => `<div class="user-row"><div class="avatar">${initials(user.name)}</div><div><div class="user-name">${user.name}</div><div class="user-detail">${user.company.name} · ${user.address.city}</div></div></div>`).join('');
}

function renderComments() {
  commentsEl.innerHTML = comments.slice(0, 5).map(comment => `<div class="comment-item"><div class="comment-name">${comment.name}</div><div class="comment-email">${comment.email}</div><div class="comment-body">${comment.body}</div></div>`).join('');
}

function renderPosts() {
  const cards = visiblePosts.map(post => {
    const author = users.find(user => user.id === post.userId);
    const count = comments.filter(comment => comment.postId === post.id).length;
    return `<article class="post-card" data-post-id="${post.id}"><div class="post-top"><span class="author">${author?.name ?? `User ${post.userId}`}</span><span class="muted">Post ${post.id}</span></div><h3 class="post-title">${post.title}</h3><p class="post-body">${post.body}</p><div class="post-meta"><span>${count} comments loaded</span><span>Open discussion →</span></div></article>`;
  });
  postsEl.innerHTML = cards.join('') || '<div class="empty">No posts match that search.</div>';
  postCount.textContent = `${visiblePosts.length} loaded`;
  renderStats();
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function debounce(callback, delayMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delayMs);
  };
}

const searchPosts = debounce(async query => {
  activeSearchController?.abort();
  activeSearchController = new AbortController();
  const signal = activeSearchController.signal;
  searchStatus.textContent = 'Searching…';
  try {
    // Search local pages immediately, then simulate an asynchronous search task.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 280);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
    const normalized = query.trim().toLowerCase();
    visiblePosts = allPosts.filter(post => `${post.title} ${post.body}`.toLowerCase().includes(normalized));
    searchStatus.textContent = normalized ? `${visiblePosts.length} matches` : 'Showing all loaded posts';
    renderPosts();
  } catch (error) {
    if (error?.name !== 'AbortError') console.error(error);
  }
}, 250);

function throttle(callback, intervalMs) {
  return (...args) => {
    if (isScrolling) return;
    isScrolling = true;
    callback(...args);
    scrollTimer = setTimeout(() => { isScrolling = false; }, intervalMs);
  };
}

async function loadNextPage() {
  if (loadingPage || !pageIterator) return;
  loadingPage = true;
  sentinel.textContent = 'Loading another page…';
  try {
    const { value, done } = await pageIterator.next();
    if (done) {
      sentinel.textContent = 'You’re all caught up';
      return;
    }
    allPosts = [...allPosts, ...value];
    const query = searchInput.value.trim().toLowerCase();
    visiblePosts = query ? allPosts.filter(post => `${post.title} ${post.body}`.toLowerCase().includes(query)) : [...allPosts];
    renderPosts();
    sentinel.textContent = 'Scroll to load more';
  } catch (error) {
    sentinel.textContent = 'Could not load more posts. Scroll to retry.';
    showToast(error.message);
  } finally {
    loadingPage = false;
  }
}

const onScroll = throttle(() => {
  if (sentinel.getBoundingClientRect().top < window.innerHeight + 220) void loadNextPage();
}, 450);

async function openPost(postId) {
  detailContent.innerHTML = '<p class="muted">Loading post and discussion…</p>';
  dialog.showModal();
  const controller = new AbortController();
  try {
    const { post, user, comments: postComments } = await loadPostDetails(postId, { signal: controller.signal });
    detailContent.innerHTML = `<p class="eyebrow">POST ${post.id}</p><h2>${post.title}</h2><p class="detail-byline">By ${user.name} · ${user.email} · ${user.company.name}</p><p class="detail-body">${post.body}</p><section class="detail-comments"><h3>${postComments.length} comments</h3>${postComments.map(comment => `<div class="detail-comment"><strong>${comment.name} · ${comment.email}</strong>${comment.body}</div>`).join('')}</section>`;
  } catch (error) {
    detailContent.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

async function initialize() {
  postsEl.innerHTML = '<div class="empty">Loading dashboard data…</div>';
  const controller = new AbortController();
  const settled = await loadDashboard({ signal: controller.signal });
  const loaded = Object.fromEntries(settled.map(result => [result.kind, result]));
  users = loaded.users?.data ?? [];
  comments = loaded.comments?.data ?? [];
  if (loaded.users?.error || loaded.comments?.error) showToast('Some dashboard data could not be loaded.');

  renderUsers();
  renderComments();
  allPosts = [];
  visiblePosts = [];
  pageIterator = paginate('/posts', { pageSize: 10, maxPages: 10 })[Symbol.asyncIterator]();
  await loadNextPage();
  renderStats();
}

searchInput.addEventListener('input', event => searchPosts(event.target.value));
window.addEventListener('scroll', onScroll, { passive: true });
postsEl.addEventListener('click', event => {
  const card = event.target.closest('[data-post-id]');
  if (card) void openPost(Number(card.dataset.postId));
});
$('#reload').addEventListener('click', () => {
  activeSearchController?.abort();
  allPosts = [];
  visiblePosts = [];
  users = [];
  comments = [];
  postsEl.innerHTML = '';
  pageIterator = paginate('/posts', { pageSize: 10, maxPages: 10 })[Symbol.asyncIterator]();
  void initialize();
  showToast('Refreshing JSONPlaceholder data…');
});
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

// Keep requestJson available in this module's source as a convenient manual
// endpoint example without making an extra request during page load.
void requestJson;
void initialize();
