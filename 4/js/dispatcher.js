const currentUser = database.get('session');
const ordersContainer = document.querySelector('#orders');
const search = document.querySelector('#search');
const statusFilter = document.querySelector('#status-filter');
const money = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const escapeText = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const finishedStatuses = ['Отменён', 'Доставлен', 'Выдан'];
const formatPlannedTime = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('ru-RU') : 'Не назначено';

if (!currentUser || currentUser.role !== 'dispatcher') {
  window.location.replace('index.html');
} else {
  document.querySelector('#account-name').textContent = currentUser.login;
  renderOrders();
}

document.querySelector('#logout').addEventListener('click', () => {
  database.logout();
  window.location.href = 'index.html';
});

function nextStatus(order) {
  const steps = order.delivery === 'delivery'
    ? ['Новый', 'Собирается', 'Передан в доставку', 'Доставлен']
    : ['Новый', 'Собирается', 'Готов к выдаче', 'Выдан'];
  const position = steps.indexOf(order.status);
  return position >= 0 && position < steps.length - 1 ? steps[position + 1] : null;
}

function isBusy(orders, index, employeeId, role) {
  return orders.some((order, otherIndex) => otherIndex !== index && (role === 'picker'
    ? ['Новый', 'Собирается'].includes(order.status) && order.pickerId === employeeId
    : order.delivery === 'delivery' && !finishedStatuses.includes(order.status) && order.driverId === employeeId));
}

function employeeOptions(role, selected, orders, index) {
  return '<option value="">Не назначен</option>' + database.get('employees').filter((employee) => employee.role === role && (employee.active !== false || employee.id === selected)).map((employee) => {
    const busy = isBusy(orders, index, employee.id, role);
    return `<option value="${escapeText(employee.id)}"${employee.id === selected ? ' selected' : ''}${busy || (employee.active === false && employee.id !== selected) ? ' disabled' : ''}>${escapeText(employee.name)}${busy ? ' — занят' : employee.active === false ? ' — уволен' : ''}</option>`;
  }).join('');
}

function employeeName(id) {
  const employee = database.get('employees').find((item) => item.id === id);
  return employee ? employee.name : 'Не назначен';
}

function renderOrders() {
  const query = search.value.trim().toLowerCase();
  const orders = database.get('orders');
  const filtered = orders.map((order, index) => ({ order, index })).reverse().filter(({ order }) => {
    const searchable = [order.id, order.login, order.phone, order.address, ...order.items.map((item) => item.name)].join(' ').toLowerCase();
    return (!statusFilter.value || order.status === statusFilter.value) && searchable.includes(query);
  });
  document.querySelector('#order-count').textContent = `Найдено заказов: ${filtered.length}`;
  ordersContainer.innerHTML = filtered.length ? filtered.map(({ order, index }) => {
    const next = nextStatus(order);
    const finished = finishedStatuses.includes(order.status);
    const pickerActive = ['Новый', 'Собирается'].includes(order.status);
    const timeLabel = order.delivery === 'delivery' ? 'Предполагаемое время доставки' : 'Предполагаемое время готовности';
    const assignment = finished ? `<div class="assignment-summary"><span>Сборщик: ${escapeText(employeeName(order.pickerId))}</span>${order.delivery === 'delivery' ? `<span>Водитель: ${escapeText(employeeName(order.driverId))}</span>` : ''}<span>${timeLabel}: ${escapeText(formatPlannedTime(order.plannedAt))}</span></div>` : `<div class="assignments">${pickerActive ? `<label>Сборщик<select name="picker">${employeeOptions('picker', order.pickerId, orders, index)}</select></label>` : `<div class="assignment-summary">Сборщик: ${escapeText(employeeName(order.pickerId))}</div>`}${order.delivery === 'delivery' ? `<label>Водитель<select name="driver">${employeeOptions('driver', order.driverId, orders, index)}</select></label>` : ''}<label>${timeLabel}<input name="plannedAt" type="datetime-local" value="${escapeText(order.plannedAt || '')}"></label>${order.delivery === 'delivery' ? `<label>Стоимость доставки, ₽<input name="deliveryCost" type="number" min="0" step="0.01" placeholder="Уточняется" value="${order.deliveryCost == null ? '' : escapeText(order.deliveryCost)}"></label>` : ''}<button type="button" class="save-assignment" data-order="${escapeText(order.id)}" data-action="save">Сохранить назначения</button><p class="assignment-message" role="status"></p></div>`;
    return `<article class="order"><div class="order-head"><div><h3>Заказ № ${escapeText(order.id)} · клиент ${escapeText(order.login)}</h3><span class="order-date">${escapeText(new Date(order.createdAt).toLocaleString('ru-RU'))}</span></div><span class="status">${escapeText(order.status)}</span></div><ul class="items">${order.items.map((item) => `<li>${escapeText(item.name)} — ${item.quantity} × ${money(item.price)}</li>`).join('')}</ul><div class="meta"><div><strong>Телефон:</strong> ${escapeText(order.phone)}</div><div><strong>Получение:</strong> ${order.delivery === 'delivery' ? 'Доставка' : 'Самовывоз'}</div>${order.delivery === 'delivery' ? `<div><strong>Адрес:</strong> ${escapeText(order.address)}</div>` : ''}<div><strong>Оплата:</strong> ${order.payment === 'card' ? 'Картой' : 'Наличными'}</div><div><strong>Товары:</strong> ${money(order.itemsTotal ?? order.total)}</div><div><strong>Доставка:</strong> ${order.delivery === 'pickup' ? '0 ₽' : order.deliveryCost == null ? 'Уточняется' : money(order.deliveryCost)}</div></div>${assignment}<div class="order-bottom"><strong class="total">${order.delivery === 'delivery' && order.deliveryCost == null ? 'Без доставки: ' : 'Итого: '}${money(order.total)}</strong><div class="actions">${next ? `<button class="next" type="button" data-order="${escapeText(order.id)}" data-action="next">${escapeText(next)}</button>` : ''}${!finished ? `<button class="cancel" type="button" data-order="${escapeText(order.id)}" data-action="cancel">Отменить заказ</button>` : ''}</div></div></article>`;
  }).join('') : '<div class="empty">Заказы не найдены.</div>';
}

ordersContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || database.get('session')?.role !== 'dispatcher') return;
  const orders = database.get('orders');
  const index = orders.findIndex((item) => item.id === button.dataset.order);
  const order = orders[index];
  if (!order) return;
  const card = button.closest('.order');
  const message = card.querySelector('.assignment-message');
  if (button.dataset.action === 'cancel') {
    if (finishedStatuses.includes(order.status) || !window.confirm('Отменить этот заказ?')) return;
    order.status = 'Отменён';
  } else {
    if (finishedStatuses.includes(order.status)) return;
    const picker = card.querySelector('[name="picker"]');
    const driver = card.querySelector('[name="driver"]');
    const plannedAt = card.querySelector('[name="plannedAt"]');
    const costInput = card.querySelector('[name="deliveryCost"]');
    const costText = costInput ? costInput.value.trim() : '';
    const deliveryCost = order.delivery === 'pickup' ? 0 : costText === '' ? null : Number(costText);
    if (costInput && (costInput.validity.badInput || (deliveryCost !== null && (!Number.isFinite(deliveryCost) || deliveryCost < 0)))) {
      message.textContent = 'Укажите корректную стоимость доставки.';
      return;
    }
    const pickerId = picker ? picker.value : order.pickerId || '';
    const driverId = driver ? driver.value : '';
    const employees = database.get('employees');
    const invalidPicker = pickerId && (!employees.some((item) => item.id === pickerId && item.role === 'picker' && (!picker || item.active !== false || pickerId === order.pickerId)) || (picker && isBusy(orders, index, pickerId, 'picker')));
    const invalidDriver = driverId && (!employees.some((item) => item.id === driverId && item.role === 'driver' && (item.active !== false || driverId === order.driverId)) || isBusy(orders, index, driverId, 'driver'));
    if (invalidPicker || invalidDriver) {
      message.textContent = 'Сотрудник недоступен или уже занят другим заказом. Выберите другого.';
      return;
    }
    const next = button.dataset.action === 'next' ? nextStatus(order) : null;
    if (button.dataset.action === 'next' && !next) return;
    if ((next === 'Собирается' || order.status === 'Собирается') && !pickerId) {
      message.textContent = 'Сначала назначьте сборщика.';
      return;
    }
    if ((next === 'Передан в доставку' || order.status === 'Передан в доставку') && !driverId) {
      message.textContent = 'Сначала назначьте водителя.';
      return;
    }
    if ((plannedAt.validity.badInput || (plannedAt.value && Number.isNaN(new Date(plannedAt.value).getTime())))) {
      message.textContent = 'Укажите корректные дату и время.';
      return;
    }
    if (plannedAt.value && plannedAt.value !== (order.plannedAt || '') && new Date(plannedAt.value).getTime() <= Date.now()) {
      message.textContent = 'Выберите будущие дату и время.';
      return;
    }
    if (next && !plannedAt.value) {
      message.textContent = 'Укажите предполагаемую дату и время получения заказа.';
      return;
    }
    if (next === 'Передан в доставку' && deliveryCost === null) {
      message.textContent = 'Укажите стоимость доставки.';
      return;
    }
    order.itemsTotal = order.itemsTotal ?? order.total;
    order.deliveryCost = deliveryCost;
    order.total = Number(order.itemsTotal) + (deliveryCost ?? 0);
    order.pickerId = pickerId;
    order.driverId = driverId;
    order.plannedAt = plannedAt.value;
    if (next) order.status = next;
  }
  database.set('orders', orders);
  renderOrders();
  if (button.dataset.action === 'save') {
    const savedButton = ordersContainer.querySelector(`[data-action="save"][data-order="${escapeText(order.id)}"]`);
    if (savedButton) {
      const notice = savedButton.closest('.assignments').querySelector('.assignment-message');
      notice.textContent = 'Назначения и время сохранены.';
      notice.classList.add('success');
    }
  }
});
search.addEventListener('input', renderOrders);
statusFilter.addEventListener('change', renderOrders);
window.addEventListener('storage', (event) => {
  if (['stroyka_orders', 'stroyka_employees'].includes(event.key) && database.get('session')?.role === 'dispatcher') renderOrders();
});
