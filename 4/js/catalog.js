let products = database.get('products');
const productList = document.querySelector('#products');
const category = document.querySelector('#category');
const search = document.querySelector('#search');
const cartItems = document.querySelector('#cart-items');
const cartTotal = document.querySelector('#cart-total');
const checkoutForm = document.querySelector('#checkout-form');
const money = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const formatPlannedTime = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('ru-RU') : 'Не назначено';
const escapeText = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const cart = () => database.getCart(client()?.login);
const saveCart = (items) => database.setCart(client()?.login, items);
const session = () => database.get('session');
const client = () => session()?.role === 'client' ? session() : null;

function updateCategories() {
  const selected = category.value;
  category.innerHTML = '<option value="">Все категории</option>';
  [...new Set(products.filter((product) => product.active !== false).map((product) => product.category))].forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    category.append(option);
  });
  if ([...category.options].some((option) => option.value === selected)) category.value = selected;
}
updateCategories();

function showView(name) {
  document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== `${name}-view`; });
  document.querySelectorAll('.nav-button').forEach((button) => { button.classList.toggle('active', button.dataset.view === name); });
  if (name === 'cart') renderCart();
  if (name === 'orders') renderOrders();
  if (name === 'checkout') document.querySelector('#checkout-total').textContent = money(getTotal());
  window.scrollTo(0, 0);
}

function renderAccount() {
  const account = document.querySelector('#account');
  if (client()) {
    account.innerHTML = `<span>${escapeText(client().login)}</span><button type="button" id="logout">Выйти</button>`;
    document.querySelector('#logout').addEventListener('click', () => { database.logout(); renderAccount(); updateCount(); showView('catalog'); });
  } else {
    account.innerHTML = '<a href="index.html">Войти / Регистрация</a>';
  }
}

function renderProducts() {
  const query = search.value.trim().toLowerCase();
  const filtered = products.filter((product) => product.active !== false && (!category.value || product.category === category.value) && product.name.toLowerCase().includes(query));
  document.querySelector('#product-count').textContent = `Найдено товаров: ${filtered.length}`;
  productList.innerHTML = filtered.length ? filtered.map((product) => `<article class="product">${product.image ? `<img class="product-image" src="${escapeText(product.image)}" alt="${escapeText(product.name)}">` : '<div class="image-placeholder">Изображение не добавлено</div>'}<div class="product-body"><span class="product-category">${escapeText(product.category)}</span><h3>${escapeText(product.name)}</h3><div class="product-bottom"><div><span class="price">${money(product.price)}</span><span class="unit">за ${escapeText(product.unit)}</span></div><button class="add" type="button" data-add="${product.id}" aria-label="Добавить ${escapeText(product.name)} в корзину">+</button></div></div></article>`).join('') : '<p class="empty">Товары не найдены. Попробуйте изменить поиск или категорию.</p>';
  productList.querySelectorAll('img').forEach((image) => image.addEventListener('error', () => {
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.textContent = 'Изображение недоступно';
    image.replaceWith(placeholder);
  }));
}

function getTotal() {
  return cart().reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}

function updateCount() {
  document.querySelector('#cart-count').textContent = cart().reduce((total, item) => total + item.quantity, 0);
}

function renderCart() {
  const items = cart();
  cartItems.innerHTML = items.length ? items.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product || product.active === false) return `<div class="cart-item"><div class="cart-item-info"><h3>${escapeText(product?.name || 'Товар')}</h3><span class="muted">Товар больше недоступен</span></div><button class="remove" type="button" data-remove="${item.id}">Удалить</button></div>`;
    return `<div class="cart-item"><div class="cart-item-info"><h3>${escapeText(product.name)}</h3><span class="muted">${money(product.price)} / ${escapeText(product.unit)}</span></div><div class="quantity"><button type="button" data-change="${item.id}" data-delta="-1" aria-label="Уменьшить количество">−</button><span>${item.quantity}</span><button type="button" data-change="${item.id}" data-delta="1" aria-label="Увеличить количество">+</button></div><strong>${money(product.price * item.quantity)}</strong><button class="remove" type="button" data-remove="${item.id}">Удалить</button></div>`;
  }).join('') : '<div class="empty">В корзине пока нет товаров. Выберите нужные материалы в каталоге.</div>';
  cartTotal.textContent = money(getTotal());
  document.querySelector('#checkout-button').disabled = !items.length || items.some((item) => !products.some((product) => product.id === item.id && product.active !== false));
  document.querySelector('#cart-notice').textContent = '';
  updateCount();
}

function renderOrders() {
  const list = document.querySelector('#orders-list');
  if (!client()) {
    list.innerHTML = '<div class="empty">Чтобы посмотреть историю заказов, <a href="index.html">войдите в аккаунт</a>.</div>';
    return;
  }
  const orders = database.get('orders').filter((order) => order.login === client().login).reverse();
  list.innerHTML = orders.length ? orders.map((order) => `<article class="order"><div class="order-head"><strong>Заказ № ${escapeText(order.id)} от ${escapeText(new Date(order.createdAt).toLocaleString('ru-RU'))}</strong><span class="order-status">${escapeText(order.status)}</span></div><ul>${order.items.map((item) => `<li>${escapeText(item.name)} — ${item.quantity} × ${money(item.price)}</li>`).join('')}</ul><div class="order-details">${order.delivery === 'delivery' ? `Доставка: ${escapeText(order.address)}` : 'Самовывоз'}<br>Оплата: ${order.payment === 'card' ? 'картой' : 'наличными'}<br>Телефон: ${escapeText(order.phone)}<br>${order.delivery === 'delivery' ? 'Предполагаемое время доставки' : 'Предполагаемое время готовности'}: ${escapeText(formatPlannedTime(order.plannedAt))}</div><p>Товары: ${money(order.itemsTotal ?? order.total)}<br>Доставка: ${order.delivery === 'pickup' ? '0 ₽' : order.deliveryCost == null ? 'Уточняется' : money(order.deliveryCost)}<br><strong>${order.delivery === 'delivery' && order.deliveryCost == null ? 'Итого без доставки' : 'Итого'}: ${money(order.total)}</strong></p>${order.status === 'Новый' ? `<button type="button" class="remove" data-cancel-order="${escapeText(order.id)}">Отменить заказ</button>` : ''}</article>`).join('') : '<div class="empty">У вас пока нет заказов.</div>';
}

document.querySelector('#orders-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-cancel-order]');
  if (!button || !client() || !window.confirm('Отменить заказ?')) return;
  const orders = database.get('orders');
  const order = orders.find((item) => item.id === button.dataset.cancelOrder && item.login === client().login);
  if (!order || order.status !== 'Новый') { window.alert('Заказ уже изменился, отменить его нельзя.'); renderOrders(); return; }
  order.status = 'Отменён';
  database.set('orders', orders);
  renderOrders();
});

productList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  const items = cart();
  const id = Number(button.dataset.add);
  const existing = items.find((item) => item.id === id);
  if (existing) existing.quantity += 1; else items.push({ id, quantity: 1 });
  saveCart(items);
  updateCount();
});

cartItems.addEventListener('click', (event) => {
  const change = event.target.closest('[data-change]');
  const remove = event.target.closest('[data-remove]');
  if (!change && !remove) return;
  let items = cart();
  if (remove) items = items.filter((item) => item.id !== Number(remove.dataset.remove));
  if (change) {
    const item = items.find((entry) => entry.id === Number(change.dataset.change));
    if (item) item.quantity += Number(change.dataset.delta);
    items = items.filter((entry) => entry.quantity > 0);
  }
  saveCart(items);
  renderCart();
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (button) showView(button.dataset.view);
});
search.addEventListener('input', renderProducts);
category.addEventListener('change', renderProducts);
document.querySelector('#checkout-button').addEventListener('click', () => {
  if (!client()) {
    document.querySelector('#cart-notice').innerHTML = 'Для оформления заказа <a href="index.html">войдите или зарегистрируйтесь</a>. Корзина сохранится.';
    return;
  }
  showView('checkout');
});
checkoutForm.addEventListener('change', () => {
  const delivery = checkoutForm.elements.delivery.value === 'delivery';
  document.querySelector('#address-field').hidden = !delivery;
  checkoutForm.elements.address.required = delivery;
  const card = checkoutForm.elements.payment.value === 'card';
  document.querySelector('#card-fields').hidden = !card;
  ['cardNumber', 'cardExpiry', 'cardCode'].forEach((name) => {
    checkoutForm.elements[name].required = card;
    if (!card) checkoutForm.elements[name].value = '';
  });
});
checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!client() || !cart().length) return;
  const phone = checkoutForm.elements.phone.value.trim();
  const address = checkoutForm.elements.address.value.trim();
  const delivery = checkoutForm.elements.delivery.value;
  if (!/^\+?[\d\s()\-]+$/.test(phone) || ![10, 11].includes(phone.replace(/\D/g, '').length)) {
    document.querySelector('#checkout-message').textContent = 'Введите корректный номер телефона: 10 или 11 цифр.';
    return;
  }
  if (delivery === 'delivery' && !address) {
    document.querySelector('#checkout-message').textContent = 'Укажите адрес доставки.';
    return;
  }
  products = database.get('products');
  if (cart().some((item) => !products.some((product) => product.id === item.id && product.active !== false))) {
    document.querySelector('#checkout-message').textContent = 'Некоторые товары недоступны. Вернитесь в корзину и удалите их.';
    return;
  }
  const items = cart().map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return product ? { id: product.id, name: product.name, price: product.price, quantity: item.quantity } : null;
  }).filter(Boolean);
  const orders = database.get('orders');
  orders.push({ id: database.newOrderId(), login: client().login, createdAt: new Date().toISOString(), status: 'Новый', items, itemsTotal: getTotal(), deliveryCost: delivery === 'pickup' ? 0 : null, total: getTotal(), phone, delivery, address: delivery === 'delivery' ? address : '', payment: checkoutForm.elements.payment.value });
  database.set('orders', orders);
  saveCart([]);
  checkoutForm.reset();
  document.querySelector('#address-field').hidden = true;
  checkoutForm.elements.address.required = false;
  document.querySelector('#card-fields').hidden = false;
  ['cardNumber', 'cardExpiry', 'cardCode'].forEach((name) => { checkoutForm.elements[name].required = true; });
  updateCount();
  showView('orders');
});

window.addEventListener('storage', (event) => {
  if (event.key === 'stroyka_orders' && !document.querySelector('#orders-view').hidden) renderOrders();
  if (event.key === 'stroyka_products') { products = database.get('products'); updateCategories(); renderProducts(); if (!document.querySelector('#cart-view').hidden) renderCart(); }
  if (event.key === 'stroyka_carts_v2' || event.key === 'stroyka_session') { renderAccount(); updateCount(); if (!document.querySelector('#cart-view').hidden) renderCart(); if (!document.querySelector('#orders-view').hidden) renderOrders(); }
});

renderAccount();
renderProducts();
updateCount();
