// js/courier.js
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('courierName').innerText = user.full_name || user.login;
    
    updateShiftUI(user);
    renderKPI();
    renderCurrentOrder();
    renderHistory();
});

// ===== ПЕРЕКЛЮЧАТЕЛЬ СМЕНЫ =====
function updateShiftUI(user) {
    const btn = document.getElementById('shiftToggleBtn');
    const status = document.getElementById('shiftStatus');
    
    if (user.status === 'free') {
        btn.classList.remove('off');
        btn.classList.add('on');
        btn.innerHTML = '<i class="bi bi-power"></i><span>На смене</span>';
        status.innerText = 'Смена открыта';
        status.style.color = '#10b981';
    } else {
        btn.classList.remove('on');
        btn.classList.add('off');
        btn.innerHTML = '<i class="bi bi-power"></i><span>Начать смену</span>';
        status.innerText = 'Смена не открыта';
        status.style.color = '#ef4444';
    }
}

function toggleShift() {
    const db = getDB();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userIndex = db.users.findIndex(u => u.id === user.id);
    
    if (db.users[userIndex].status === 'free') {
        db.users[userIndex].status = 'off';
    } else {
        db.users[userIndex].status = 'free';
    }
    
    saveDB(db);
    updateShiftUI(db.users[userIndex]);
    localStorage.setItem('currentUser', JSON.stringify(db.users[userIndex]));
}

// ===== KPI =====
function renderKPI() {
    const db = getDB();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    const delivered = db.orders.filter(o => o.courier_id === user.id && o.status === 'completed').length;
    const active = db.orders.filter(o => o.courier_id === user.id && o.status === 'assigned').length;
    
    document.getElementById('kpiDelivered').innerText = delivered;
    document.getElementById('kpiActive').innerText = active;
}

// ===== ПЕРЕКЛЮЧЕНИЕ ТАБОВ =====
function switchTab(tabName) {
    if (tabName === 'active') {
        document.getElementById('tabActive').classList.add('active');
        document.getElementById('tabHistory').classList.remove('active');
        document.getElementById('activeOrderView').classList.remove('d-none');
        document.getElementById('historyOrderView').classList.add('d-none');
    } else {
        document.getElementById('tabHistory').classList.add('active');
        document.getElementById('tabActive').classList.remove('active');
        document.getElementById('historyOrderView').classList.remove('d-none');
        document.getElementById('activeOrderView').classList.add('d-none');
    }
}

// ===== АКТИВНЫЙ ЗАКАЗ =====
function renderCurrentOrder() {
    const db = getDB();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const container = document.getElementById('orderContainer');
    
    const activeOrder = db.orders.find(o => o.courier_id === user.id && o.status === 'assigned');
    
    if (!activeOrder) {
        container.innerHTML = `
            <div class="empty-state">
                <h1>📦</h1>
                <h4>Заказов пока нет</h4>
                <p>Вы свободны. Ожидайте новых назначений от диспетчера.</p>
            </div>
        `;
        return;
    }
    
    const timeDisplay = activeOrder.eta_time 
        ? `<span class="label mt-3">Доставить к: <strong style="color: #f59e0b;">${activeOrder.eta_time}</strong></span>` 
        : '';
    
    container.innerHTML = `
        <div class="order-card">
            <span class="label">Заказ #${activeOrder.id}</span>
            <div class="address">${activeOrder.address}</div>
            <div class="price">${activeOrder.total_sum.toLocaleString('ru-RU')} ₽</div>
            ${timeDisplay}
            
            <button class="btn-action success" onclick="completeDelivery(${activeOrder.id})">
                <i class="bi bi-house-check me-2"></i>Доставлено
            </button>
        </div>
    `;
}

function completeDelivery(orderId) {
    if (!confirm('Подтверждаете передачу заказа клиенту?')) return;
    
    const db = getDB();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    const orderIndex = db.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        db.orders[orderIndex].status = 'completed';
    }
    
    const userIndex = db.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        db.users[userIndex].status = 'free';
    }
    
    saveDB(db);
    renderKPI();
    renderCurrentOrder();
    renderHistory();
    
    localStorage.setItem('currentUser', JSON.stringify(db.users[userIndex]));
    updateShiftUI(db.users[userIndex]);
}

// ===== ИСТОРИЯ =====
function renderHistory() {
    const db = getDB();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const container = document.getElementById('historyContainer');
    
    container.innerHTML = '';
    
    const history = db.orders.filter(o => o.courier_id === user.id && o.status === 'completed');
    
    if (history.length === 0) {
        container.innerHTML = '<p class="text-center text-muted mt-5">Вы еще не доставили ни одного заказа.</p>';
        return;
    }
    
    history.reverse().forEach(o => {
        container.innerHTML += `
            <div class="history-card">
                <div class="h-header">
                    <span>Заказ #${o.id}</span>
                    <span style="color: #10b981;">✓ Доставлен</span>
                </div>
                <div class="h-address">${o.address}</div>
                <div class="h-footer">
                    <span>${o.date || '—'}</span>
                    <span class="fw-bold">${o.total_sum.toLocaleString('ru-RU')} ₽</span>
                </div>
            </div>
        `;
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}