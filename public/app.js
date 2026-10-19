'use strict';

(function () {
  const $ = (id) => document.getElementById(id);

  const STORAGE_TEXT = {
    postgres: 'Saved in Postgres',
    memory: 'Saved in memory — add a database to keep orders',
  };
  const STORAGE_SHORT = { postgres: 'Saved in Postgres', memory: 'Saved in memory' };

  function setStorage(kind) {
    if (!STORAGE_TEXT[kind]) return;
    const pill = $('storage-pill');
    pill.dataset.storage = kind;
    pill.querySelector('.pill-text').textContent = STORAGE_TEXT[kind];
    const footer = $('footer-pill');
    footer.dataset.storage = kind;
    footer.querySelector('.pill-text').textContent = STORAGE_SHORT[kind];
  }

  async function loadInfo() {
    try {
      const res = await fetch('/api/info', { cache: 'no-store' });
      const info = await res.json();
      const badge = $('version-badge');
      badge.textContent = info.version;
      badge.hidden = false;
      $('footer-version').textContent = `Juniper ${info.version}`;
      setStorage(info.storage);
    } catch {
      /* the page still works without it */
    }
  }

  /* ---------- Orders list ---------- */

  const seen = new Set();
  let firstRender = true;

  function timeAgo(iso) {
    const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 45) return 'just now';
    if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
    return new Date(iso).toLocaleDateString();
  }

  function orderRow(order) {
    const li = document.createElement('li');
    if (!firstRender && !seen.has(order.id)) li.className = 'is-new';

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = (order.name.trim()[0] || '?').toUpperCase();

    const main = document.createElement('div');
    main.className = 'o-main';
    const name = document.createElement('p');
    name.className = 'o-name';
    name.textContent = order.name;
    const item = document.createElement('p');
    item.className = 'o-item';
    item.textContent = order.item;
    main.append(name, item);

    const time = document.createElement('div');
    time.className = 'o-time';
    const pickup = document.createElement('p');
    pickup.className = 'o-pickup';
    pickup.textContent = order.pickupTime;
    const ago = document.createElement('p');
    ago.className = 'o-ago';
    ago.textContent = timeAgo(order.createdAt);
    time.append(pickup, ago);

    li.append(avatar, main, time);
    li.setAttribute('aria-label', `${order.name}, ${order.item}, pickup ${order.pickupTime}`);
    return li;
  }

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const list = $('orders');
      list.replaceChildren(...data.orders.map(orderRow));
      data.orders.forEach((o) => seen.add(o.id));
      firstRender = false;

      $('orders-empty').hidden = data.orders.length > 0;
      $('today-count').textContent = String(data.todayCount);
      $('today-label').textContent = data.todayCount === 1 ? 'order today' : 'orders today';
      setStorage(data.storage);
    } catch {
      /* keep whatever is on screen; next poll will retry */
    }
  }

  /* ---------- Order form ---------- */

  function defaultPickup() {
    const select = $('f-time');
    const now = new Date();
    const target = now.getHours() * 60 + now.getMinutes() + 20; // ~20 minutes from now
    const match = Array.from(select.options).find((opt) => {
      const [h, m] = opt.value.split(':').map(Number);
      return h * 60 + m >= target;
    });
    if (match) select.value = match.value;
  }

  function clearErrors() {
    ['name', 'item', 'pickupTime'].forEach((field) => {
      $(`err-${field}`).textContent = '';
    });
    document.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    $('form-error').hidden = true;
  }

  function showFieldErrors(fields) {
    const inputs = { name: 'f-name', item: 'f-item', pickupTime: 'f-time' };
    let first = null;
    Object.entries(fields || {}).forEach(([field, message]) => {
      const err = $(`err-${field}`);
      const input = $(inputs[field]);
      if (!err || !input) return;
      err.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      first = first || input;
    });
    if (first) first.focus();
  }

  async function submitOrder(event) {
    event.preventDefault();
    clearErrors();
    $('confirm').hidden = true;

    const payload = {
      name: $('f-name').value.trim(),
      item: $('f-item').value,
      pickupTime: $('f-time').value,
    };
    if (!payload.name) {
      showFieldErrors({ name: 'Please tell us your name.' });
      return;
    }

    const button = $('submit-btn');
    button.disabled = true;
    button.textContent = 'Placing order…';
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) showFieldErrors(data.fields);
        else {
          $('form-error').textContent = data.error || 'We couldn’t place that order. Please try again.';
          $('form-error').hidden = false;
        }
        return;
      }

      const { order } = data;
      const text = $('confirm-text');
      const strongName = document.createElement('strong');
      strongName.textContent = order.name;
      const strongItem = document.createElement('strong');
      strongItem.textContent = order.item;
      const strongTime = document.createElement('strong');
      strongTime.textContent = order.pickupTime;
      text.replaceChildren(
        'Thank you, ', strongName, '. Your ', strongItem,
        ' will be wrapped and waiting at ', strongTime, '.',
      );
      $('confirm').hidden = false;
      $('f-name').value = '';
      await loadOrders();
    } catch {
      $('form-error').textContent = 'We couldn’t reach the bakery. Check your connection and try again.';
      $('form-error').hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = 'Place order';
    }
  }

  $('order-form').addEventListener('submit', submitOrder);
  defaultPickup();
  loadInfo();
  loadOrders();

  // Keep "Today at the counter" live while the tab is visible.
  setInterval(() => {
    if (!document.hidden) loadOrders();
  }, 10000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadOrders();
  });
})();
