const currentUser = database.get('session');
const search = document.querySelector('#employee-search');
const roleFilter = document.querySelector('#employee-role');
const employeesContainer = document.querySelector('#employees');
const hireForm = document.querySelector('#hire-form');
const hireMessage = document.querySelector('#hire-message');
const finished = ['Доставлен', 'Выдан'];
const closed = [...finished, 'Отменён'];
const money = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const escapeText = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const roleName = (role) => role === 'picker' ? 'Сборщик' : 'Водитель';

if (!currentUser || currentUser.role !== 'admin') {
  window.location.replace('index.html');
} else {
  document.querySelector('#account-name').textContent = currentUser.login;
  renderAll();
}

document.querySelector('#logout').addEventListener('click', () => {
  database.logout();
  window.location.href = 'index.html';
});

function busy(employee, orders) {
  return orders.some((order) => employee.role === 'picker'
    ? order.pickerId === employee.id && ['Новый', 'Собирается'].includes(order.status)
    : order.driverId === employee.id && order.delivery === 'delivery' && !closed.includes(order.status));
}

function renderMetrics(orders, employees, users) {
  const completed = orders.filter((order) => finished.includes(order.status));
  const metrics = [
    ['Всего заказов', orders.length],
    ['В работе', orders.filter((order) => !closed.includes(order.status)).length],
    ['Завершено', completed.length],
    ['Сумма завершённых заказов', money(completed.reduce((sum, order) => sum + (Number(order.total) || 0), 0))],
    ['Клиентов', users.filter((user) => user.role === 'client').length],
    ['Сотрудников', employees.filter((employee) => employee.active !== false).length]
  ];
  document.querySelector('#metrics').innerHTML = metrics.map(([label, value]) => `<div class="metric"><span>${escapeText(label)}</span><strong>${escapeText(value)}</strong></div>`).join('');
}

function renderChart(chartId, tableId, rows) {
  const chart = document.querySelector(chartId);
  const table = document.querySelector(tableId);
  const max = Math.max(1, ...rows.map((row) => row.count));
  chart.innerHTML = rows.map((row) => `<div class="bar-row" title="${escapeText(row.label)}: ${row.count}"><span class="bar-label">${escapeText(row.label)}</span><div class="bar-track"><div class="bar" style="width:${row.count / max * 100}%"></div></div><span class="bar-value">${row.count}</span></div>`).join('');
  table.innerHTML = `<details class="data-table"><summary>Таблица данных</summary><table><thead><tr><th scope="col">Период или статус</th><th scope="col">Заказов</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeText(row.label)}</td><td>${row.count}</td></tr>`).join('')}</tbody></table></details>`;
}

function renderCharts(orders) {
  const daily = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset--) {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset + 1);
    daily.push({ label: start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }), count: orders.filter((order) => { const date = new Date(order.createdAt); return date >= start && date < end; }).length });
  }
  const statuses = ['Новый', 'Собирается', 'Передан в доставку', 'Доставлен', 'Готов к выдаче', 'Выдан', 'Отменён'];
  const unknown = orders.filter((order) => !statuses.includes(order.status)).length;
  const statusRows = statuses.map((status) => ({ label: status, count: orders.filter((order) => order.status === status).length }));
  if (unknown) statusRows.push({ label: 'Другой статус', count: unknown });
  renderChart('#daily-chart', '#daily-table', daily);
  renderChart('#status-chart', '#status-table', statusRows);
}

function renderEmployees() {
  const orders = database.get('orders');
  const employees = database.get('employees').filter((employee) => employee.active !== false && (!roleFilter.value || employee.role === roleFilter.value) && employee.name.toLowerCase().includes(search.value.trim().toLowerCase()));
  employeesContainer.innerHTML = employees.length ? employees.map((employee) => {
    const occupied = busy(employee, orders);
    return `<div class="employee"><div><strong>${escapeText(employee.name)}</strong><small>${roleName(employee.role)} · ${occupied ? 'Занят' : 'Свободен'}</small></div><button type="button" data-dismiss="${escapeText(employee.id)}" ${occupied ? 'disabled title="Сотрудник назначен на активный заказ"' : ''}>Уволить</button></div>`;
  }).join('') : '<p class="empty">Сотрудники не найдены.</p>';
}

function renderRecent(orders) {
  const recent = orders.slice().reverse().slice(0, 5);
  document.querySelector('#recent-orders').innerHTML = recent.length ? recent.map((order) => `<div class="recent-order"><div><strong>№ ${escapeText(order.id)} · ${escapeText(order.login)}</strong><small>${escapeText(new Date(order.createdAt).toLocaleString('ru-RU'))} · ${escapeText(order.status)}</small></div><span>${money(Number(order.total) || 0)}</span></div>`).join('') : '<p class="empty">Заказов пока нет.</p>';
}

function renderAll() {
  const orders = database.get('orders');
  renderMetrics(orders, database.get('employees'), database.get('users'));
  renderCharts(orders);
  renderEmployees();
  renderProducts();
  renderRecent(orders);
}

function renderProducts() {
  const query = document.querySelector('#product-search').value.trim().toLowerCase();
  const products = database.get('products').filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query));
  document.querySelector('#admin-products').innerHTML = products.length ? products.map((product) => `<div class="employee"><div><strong>${escapeText(product.name)}</strong><small>${escapeText(product.category)} · ${money(product.price)} / ${escapeText(product.unit)}${product.active === false ? ' · Скрыт' : ''}</small></div><div class="product-actions"><button type="button" data-edit-product="${escapeText(product.id)}">Изменить</button><button type="button" data-toggle-product="${escapeText(product.id)}">${product.active === false ? 'Показать' : 'Скрыть'}</button></div></div>`).join('') : '<p class="empty">Товары не найдены.</p>';
}

const productForm = document.querySelector('#product-form');
const productMessage = document.querySelector('#product-message');
function resetProductForm() {
  productForm.reset();
  productForm.elements.productId.value = '';
  document.querySelector('#product-form-title').textContent = 'Добавить товар';
  productMessage.textContent = '';
}
document.querySelector('#product-search').addEventListener('input', renderProducts);
document.querySelector('#reset-product').addEventListener('click', resetProductForm);
document.querySelector('#admin-products').addEventListener('click', (event) => {
  if (database.get('session')?.role !== 'admin') return;
  const edit = event.target.closest('[data-edit-product]');
  const toggle = event.target.closest('[data-toggle-product]');
  if (!edit && !toggle) return;
  const products = database.get('products');
  const product = products.find((item) => String(item.id) === (edit ? edit.dataset.editProduct : toggle.dataset.toggleProduct));
  if (!product) return;
  if (toggle) {
    if (!window.confirm(product.active === false ? 'Вернуть товар в каталог?' : 'Скрыть товар из каталога?')) return;
    product.active = product.active === false;
    database.set('products', products);
    renderProducts();
    return;
  }
  productForm.elements.productId.value = product.id;
  productForm.elements.productName.value = product.name;
  productForm.elements.productCategory.value = product.category;
  productForm.elements.productPrice.value = product.price;
  productForm.elements.productUnit.value = product.unit;
  productForm.elements.productImage.value = product.image || '';
  document.querySelector('#product-form-title').textContent = 'Изменить товар';
  productMessage.textContent = '';
  productForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (database.get('session')?.role !== 'admin') return;
  const name = productForm.elements.productName.value.trim();
  const category = productForm.elements.productCategory.value.trim();
  const priceText = productForm.elements.productPrice.value;
  const price = Number(priceText);
  const unit = productForm.elements.productUnit.value.trim();
  const image = productForm.elements.productImage.value.trim();
  if (!name || !category || !unit || !priceText || !Number.isFinite(price) || price < 0 || (image && !/^(https?:\/\/|images\/)/i.test(image))) {
    productMessage.classList.remove('success');
    productMessage.textContent = 'Заполните поля; фото укажите как ссылку или путь images/.';
    return;
  }
  const products = database.get('products');
  const id = productForm.elements.productId.value;
  const product = id ? products.find((item) => String(item.id) === id) : null;
  if (id && !product) { productMessage.textContent = 'Товар не найден. Обновите страницу.'; return; }
  if (product) Object.assign(product, { name, category, price, unit, image });
  else products.push({ id: Math.max(1000, ...products.map((item) => Number(item.id) || 0)) + 1, name, category, price, unit, image, active: true });
  database.set('products', products);
  resetProductForm();
  productMessage.classList.add('success');
  productMessage.textContent = 'Товар сохранён.';
  renderProducts();
});

hireForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (database.get('session')?.role !== 'admin') return;
  const name = hireForm.elements.name.value.trim();
  const role = hireForm.elements.role.value;
  hireMessage.classList.remove('success');
  if (!name || !['picker', 'driver'].includes(role)) { hireMessage.textContent = 'Укажите имя и должность.'; return; }
  const employees = database.get('employees');
  const id = `employee-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  employees.push({ id, name, role, active: true });
  database.set('employees', employees);
  hireForm.reset();
  hireMessage.textContent = 'Сотрудник добавлен.';
  hireMessage.classList.add('success');
  renderAll();
});

employeesContainer.addEventListener('click', (event) => {
  const button = event.target.closest('[data-dismiss]');
  if (!button || database.get('session')?.role !== 'admin') return;
  const employees = database.get('employees');
  const employee = employees.find((item) => item.id === button.dataset.dismiss && item.active !== false);
  if (!employee) return;
  if (busy(employee, database.get('orders'))) { window.alert('Сотрудник занят активным заказом. Сначала завершите или отмените назначение.'); renderAll(); return; }
  if (!window.confirm(`Уволить сотрудника ${employee.name}?`)) return;
  if (busy(employee, database.get('orders'))) { window.alert('Сотрудник уже назначен на активный заказ.'); renderAll(); return; }
  employee.active = false;
  database.set('employees', employees);
  renderAll();
});
search.addEventListener('input', renderEmployees);
roleFilter.addEventListener('change', renderEmployees);
window.addEventListener('storage', (event) => {
  if (['stroyka_orders', 'stroyka_employees', 'stroyka_users', 'stroyka_products'].includes(event.key) && database.get('session')?.role === 'admin') renderAll();
});
