// js/dispatcher.js
let currentAssignOrderId = null;
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('dispName').innerText = `Диспетчер: ${user.full_name || user.login}`;
    
    renderKPI();
    renderOrders();
    bindFilters();
});

// ===== KPI =====
function renderKPI() {
    const db = getDB();
    const newOrders = db.orders.filter(o => o.status === 'new');
    
    const deliveryCount = newOrders.filter(o => o.delivery_type === 'delivery').length;
    const pickupCount = newOrders.filter(o => o.delivery_type === 'pickup').length;
    
    document.getElementById('kpiQueue').innerText = newOrders.length;
    document.getElementById('kpiDelivery').innerText = deliveryCount;
    document.getElementById('kpiPickup').innerText = pickupCount;
}

// ===== ФИЛЬТРЫ =====
function bindFilters() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderOrders();
        });
    });
}

// ===== РЕНДЕР ТАБЛИЦЫ =====
function renderOrders() {
    const db = getDB();
    const tbody = document.getElementById('ordersTableBody');
    const countBadge = document.getElementById('orderCountBadge');
    
    tbody.innerHTML = '';
    
    let newOrders = db.orders.filter(o => o.status === 'new');
    
    if (currentFilter !== 'all') {
        newOrders = newOrders.filter(o => o.delivery_type === currentFilter);
    }
    
    countBadge.innerText = newOrders.length;
    
    if (newOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <i class="bi bi-check-circle text-success fs-1 d-block mb-2 opacity-50"></i>
                    <span class="text-muted">Очередь пуста. Все заказы обработаны!</span>
                </td>
            </tr>
        `;
        return;
    }
    
    newOrders.forEach(o => {
        let actionBtn = '';
        if (o.delivery_type === 'delivery') {
            actionBtn = `<button class="btn btn-assign" onclick="openAssignModal(${o.id})">
                <i class="bi bi-truck me-1"></i> Назначить
            </button>`;
        } else {
            actionBtn = `<button class="btn btn-pickup" onclick="completePickup(${o.id})">
                <i class="bi bi-box-seam me-1"></i> Готов к выдаче
            </button>`;
        }
        
        const typeBadge = o.delivery_type === 'delivery' 
            ? '<span class="badge bg-info bg-opacity-10 text-info rounded-pill"><i class="bi bi-truck me-1"></i>Доставка</span>' 
            : '<span class="badge bg-secondary bg-opacity-10 text-light rounded-pill"><i class="bi bi-box-seam me-1"></i>Самовывоз</span>';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold text-warning">#${o.id}</td>
            <td>${typeBadge}</td>
            <td class="text-muted small">${o.address || 'Склад МСК'}</td>
            <td class="fw-bold">${o.total_sum.toLocaleString('ru-RU')} ₽</td>
            <td class="text-end">${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ===== НАЗНАЧЕНИЕ КУРЬЕРА =====
function openAssignModal(orderId) {
    const db = getDB();
    // ФИЛЬТРАЦИЯ: только курьеры со статусом 'free' (на смене)
    const freeCouriers = db.users.filter(u => u.role === 'courier' && u.status === 'free');
    const select = document.getElementById('courierSelect');
    select.innerHTML = '';
    
    if (freeCouriers.length === 0) {
        select.innerHTML = '<option disabled selected>Нет свободных курьеров на смене!</option>';
    } else {
        freeCouriers.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.full_name} (${c.phone || ''})</option>`;
        });
    }
    
    currentAssignOrderId = orderId;
    document.getElementById('modalOrderId').innerText = `#${orderId}`;
    new bootstrap.Modal(document.getElementById('assignCourierModal')).show();
}

function confirmAssign() {
    const courierId = parseInt(document.getElementById('courierSelect').value);
    if (!courierId) {
        alert('Выберите курьера!');
        return;
    }
    
    const db = getDB();
    const orderIndex = db.orders.findIndex(o => o.id === currentAssignOrderId);
    db.orders[orderIndex].status = 'assigned';
    db.orders[orderIndex].courier_id = courierId;
    
    const courierIndex = db.users.findIndex(u => u.id === courierId);
    db.users[courierIndex].status = 'busy';
    
    saveDB(db);
    bootstrap.Modal.getInstance(document.getElementById('assignCourierModal')).hide();
    
    renderKPI();
    renderOrders();
}

// ===== САМОВЫВОЗ =====
function completePickup(orderId) {
    if(!confirm('Отметить заказ как выданный клиенту?')) return;
    
    const db = getDB();
    const orderIndex = db.orders.findIndex(o => o.id === orderId);
    db.orders[orderIndex].status = 'completed';
    
    saveDB(db);
    renderKPI();
    renderOrders();
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}