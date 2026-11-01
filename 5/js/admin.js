// js/admin.js
let ordersChartInstance = null;
let ordersChartReportInstance = null;
let editingProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('adminName').innerText = user.full_name || user.login;
    
    // Навигация
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // Поиск
    document.getElementById('productSearch').addEventListener('input', renderProducts);
    document.getElementById('inventorySearch').addEventListener('input', renderInventory);
    document.getElementById('employeeSearch').addEventListener('input', renderEmployees);
    
    // Инициализация
    renderDashboard();
    renderProducts();
    renderInventory();
    renderEmployees();
    renderReports();
});

function switchSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(`section-${sectionName}`).classList.add('active');
    document.querySelector(`.nav-item[data-section="${sectionName}"]`).classList.add('active');
    
    if (sectionName === 'dashboard') renderDashboard();
    if (sectionName === 'reports') renderReports();
}

// ===== ДАШБОРД =====
function renderDashboard() {
    const db = getDB();
    
    document.getElementById('kpiProducts').innerText = db.products.length;
    document.getElementById('kpiBatches').innerText = db.inventory.length;
    
    const staff = db.users.filter(u => u.role !== 'buyer');
    document.getElementById('kpiStaff').innerText = staff.length;
    
    document.getElementById('kpiOrders').innerText = db.orders.length;
    
    // Последние заказы
    const recentOrders = db.orders.slice(-5).reverse();
    const recentList = document.getElementById('recentOrdersList');
    recentList.innerHTML = '';
    
    if (recentOrders.length === 0) {
        recentList.innerHTML = '<p class="text-muted">Заказов пока нет</p>';
    } else {
        recentOrders.forEach(o => {
            const statusColors = {
                'completed': '#10b981',
                'assigned': '#3b82f6',
                'new': '#f59e0b'
            };
            const statusNames = {
                'completed': 'Завершён',
                'assigned': 'В доставке',
                'new': 'Новый'
            };
            
            recentList.innerHTML += `
                <div class="d-flex justify-content-between align-items-center mb-3 pb-3" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div class="fw-bold" style="color: #fff;">Заказ #${o.id}</div>
                        <small class="text-muted">${o.delivery_type === 'delivery' ? 'Доставка' : 'Самовывоз'}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold" style="color: ${statusColors[o.status]};">${statusNames[o.status]}</div>
                        <small class="text-muted">${o.total_sum.toLocaleString('ru-RU')} ₽</small>
                    </div>
                </div>
            `;
        });
    }
    
    // График
    const ctx = document.getElementById('ordersChart').getContext('2d');
    if (ordersChartInstance) ordersChartInstance.destroy();
    
    const completed = db.orders.filter(o => o.status === 'completed').length;
    const assigned = db.orders.filter(o => o.status === 'assigned').length;
    const newOrders = db.orders.filter(o => o.status === 'new').length;
    
    ordersChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Завершённые', 'В доставке', 'Новые'],
            datasets: [{
                data: [completed, assigned, newOrders],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8' }
                }
            }
        }
    });
}

// ===== КАТАЛОГ ТОВАРОВ =====
function renderProducts() {
    const db = getDB();
    const grid = document.getElementById('productsGrid');
    const search = document.getElementById('productSearch').value.toLowerCase();
    
    grid.innerHTML = '';
    
    const filtered = db.products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.description.toLowerCase().includes(search)
    );
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-5">Товары не найдены</div>';
        return;
    }
    
    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${p.image || 'img/placeholder.png'}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200'">
                <div class="product-card-body">
                    <h5 class="product-card-title">${p.name}</h5>
                    <p class="product-card-desc">${p.description}</p>
                    <div class="product-card-footer">
                        <span class="badge bg-secondary">${p.fat_content}</span>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="editProduct(${p.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function openProductModal() {
    editingProductId = null;
    document.getElementById('productForm').reset();
    document.querySelector('#productModal .modal-title').innerText = 'Новый товар';
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function editProduct(id) {
    const db = getDB();
    const product = db.products.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodFat').value = product.fat_content;
    document.getElementById('prodDesc').value = product.description;
    document.getElementById('prodImgUrl').value = product.image || '';
    
    document.querySelector('#productModal .modal-title').innerText = 'Редактировать товар';
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function saveProduct(event) {
    event.preventDefault();
    const name = document.getElementById('prodName').value;
    const fat = document.getElementById('prodFat').value;
    const desc = document.getElementById('prodDesc').value;
    const urlInput = document.getElementById('prodImgUrl').value;
    
    const db = getDB();
    const imgPath = urlInput.trim() !== '' ? urlInput : 'img/1.png';
    
    if (editingProductId) {
        const productIndex = db.products.findIndex(p => p.id === editingProductId);
        if (productIndex !== -1) {
            db.products[productIndex].name = name;
            db.products[productIndex].fat_content = fat;
            db.products[productIndex].description = desc;
            db.products[productIndex].image = imgPath;
        }
    } else {
        const newId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
        db.products.push({ id: newId, name, description: desc, fat_content: fat, image: imgPath });
    }
    
    saveDB(db);
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    renderProducts();
    renderDashboard();
}

function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    const db = getDB();
    db.products = db.products.filter(p => p.id !== id);
    saveDB(db);
    renderProducts();
    renderDashboard();
}

// ===== СКЛАД =====
function renderInventory() {
    const db = getDB();
    const tbody = document.getElementById('inventoryTableBody');
    const search = document.getElementById('inventorySearch').value.toLowerCase();
    
    tbody.innerHTML = '';
    
    const filtered = db.inventory.filter(i => {
        const prod = db.products.find(p => p.id === i.product_id);
        const prodName = prod ? prod.name.toLowerCase() : '';
        return prodName.includes(search);
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Партии не найдены</td></tr>';
        return;
    }
    
    const today = new Date();
    
    filtered.forEach(i => {
        const prod = db.products.find(p => p.id === i.product_id);
        const prodName = prod ? prod.name : 'Неизвестный товар';
        
        const expDate = new Date(i.exp_date);
        const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        let statusBadge = '';
        let rowClass = '';
        
        if (i.quantity === 0) {
            statusBadge = '<span class="badge-status badge-danger">Нет в наличии</span>';
            rowClass = 'opacity-50';
        } else if (daysLeft < 0) {
            statusBadge = '<span class="badge-status badge-danger">Просрочено</span>';
            rowClass = 'opacity-50';
        } else if (daysLeft < 30 || i.quantity < 10) {
            statusBadge = '<span class="badge-status badge-warning">Внимание</span>';
        } else {
            statusBadge = '<span class="badge-status badge-ok">Норма</span>';
        }
        
        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td class="fw-bold">#${i.id}</td>
                <td>${prodName}</td>
                <td>${i.weight} г.</td>
                <td class="fw-bold">${i.price} ₽</td>
                <td>${i.quantity} шт.</td>
                <td>${i.exp_date}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBatch(${i.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function openBatchModal() {
    const db = getDB();
    const select = document.getElementById('batchProdId');
    select.innerHTML = '';
    db.products.forEach(p => { 
        select.innerHTML += `<option value="${p.id}">${p.name}</option>`; 
    });
    document.getElementById('batchForm').reset();
    new bootstrap.Modal(document.getElementById('batchModal')).show();
}

function saveBatch(event) {
    event.preventDefault();
    const product_id = parseInt(document.getElementById('batchProdId').value);
    const weight = parseInt(document.getElementById('batchWeight').value);
    const price = parseInt(document.getElementById('batchPrice').value);
    const quantity = parseInt(document.getElementById('batchQty').value);
    const exp_date = document.getElementById('batchExp').value;
    
    const db = getDB();
    const newId = db.inventory.length > 0 ? Math.max(...db.inventory.map(i => i.id)) + 1 : 1;
    
    db.inventory.push({ id: newId, product_id, weight, price, quantity, exp_date });
    saveDB(db);
    
    bootstrap.Modal.getInstance(document.getElementById('batchModal')).hide();
    renderInventory();
    renderDashboard();
}

function deleteBatch(id) {
    if (!confirm('Списать эту партию?')) return;
    const db = getDB();
    db.inventory = db.inventory.filter(i => i.id !== id);
    saveDB(db);
    renderInventory();
    renderDashboard();
}

// ===== СОТРУДНИКИ =====
function renderEmployees() {
    const db = getDB();
    const tbody = document.getElementById('employeesTableBody');
    const search = document.getElementById('employeeSearch').value.toLowerCase();
    
    tbody.innerHTML = '';
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const staff = db.users.filter(u => u.role !== 'buyer' && u.id !== currentUser.id);
    
    const filtered = staff.filter(u => 
        (u.full_name || '').toLowerCase().includes(search) || 
        u.login.toLowerCase().includes(search)
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Сотрудники не найдены</td></tr>';
        return;
    }
    
    const roleNames = {
        'admin': '<span class="badge bg-dark">Директор</span>',
        'dispatcher': '<span class="badge bg-primary">Диспетчер</span>',
        'courier': '<span class="badge bg-success">Курьер</span>'
    };
    
    filtered.forEach(u => {
        let statusBadge = '—';
        if (u.role === 'courier') {
            statusBadge = u.status === 'busy' 
                ? '<span class="badge bg-warning">На заказе</span>' 
                : '<span class="badge bg-info">Свободен</span>';
        }
        
        tbody.innerHTML += `
            <tr>
                <td class="text-muted">#${u.id}</td>
                <td class="fw-bold">${u.full_name || '—'}</td>
                <td>${u.login}</td>
                <td>${roleNames[u.role] || u.role}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="fireEmployee(${u.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function openEmployeeModal() {
    document.getElementById('employeeForm').reset();
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

function saveEmployee(event) {
    event.preventDefault();
    const fullName = document.getElementById('empFullName').value;
    const login = document.getElementById('empLogin').value;
    const password = document.getElementById('empPassword').value;
    const role = document.getElementById('empRole').value;
    
    const db = getDB();
    
    if (db.users.find(u => u.login === login)) {
        alert('Этот логин уже занят!');
        return;
    }
    
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    
    db.users.push({
        id: newId,
        login,
        password,
        role,
        full_name: fullName,
        status: 'free'
    });
    
    saveDB(db);
    bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
    renderEmployees();
    renderDashboard();
}

function fireEmployee(id) {
    if (!confirm('Уволить сотрудника?')) return;
    
    const db = getDB();
    const hasActiveOrders = db.orders.some(o => o.courier_id === id && o.status === 'assigned');
    
    if (hasActiveOrders) {
        alert('Невозможно уволить: на сотруднике висят активные заказы!');
        return;
    }
    
    db.users = db.users.filter(u => u.id !== id);
    saveDB(db);
    renderEmployees();
    renderDashboard();
}

// ===== ОТЧЁТЫ =====
function getFilteredOrders() {
    const db = getDB();
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    
    return db.orders.filter(o => {
        if (!o.date) return true;
        if (dateFrom && o.date < dateFrom) return false;
        if (dateTo && o.date > dateTo) return false;
        return true;
    });
}

function renderReports() {
    const orders = getFilteredOrders();
    const db = getDB();
    
    let totalRevenue = 0;
    let completedOrders = 0;
    let assignedOrders = 0;
    let newOrders = 0;
    const productStats = {};
    
    orders.forEach(o => {
        if (o.status === 'completed') {
            totalRevenue += o.total_sum;
            completedOrders++;
        } else if (o.status === 'assigned') {
            assignedOrders++;
        } else if (o.status === 'new') {
            newOrders++;
        }
        
        if (o.items && Array.isArray(o.items) && o.items.length > 0) {
            o.items.forEach(item => {
                if (!productStats[item.product_id]) {
                    productStats[item.product_id] = { qty: 0, revenue: 0 };
                }
                productStats[item.product_id].qty += item.quantity;
                productStats[item.product_id].revenue += item.price * item.quantity;
            });
        } else if (o.status === 'completed' && db.products.length > 0) {
            const dummyProd = db.products[o.id % db.products.length];
            if (!productStats[dummyProd.id]) {
                productStats[dummyProd.id] = { qty: 0, revenue: 0 };
            }
            productStats[dummyProd.id].qty += 1;
            productStats[dummyProd.id].revenue += o.total_sum;
        }
    });
    
    const avgCheck = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;
    
    document.getElementById('reportRevenue').innerText = totalRevenue.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('reportOrdersCount').innerText = completedOrders;
    document.getElementById('reportAvgCheck').innerText = avgCheck.toLocaleString('ru-RU') + ' ₽';
    
    const topTbody = document.getElementById('topProductsTableBody');
    topTbody.innerHTML = '';
    
    const sortedTop = Object.entries(productStats).sort((a, b) => b[1].qty - a[1].qty);
    
    if (sortedTop.length === 0) {
        topTbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Нет данных о продажах за период</td></tr>';
    } else {
        sortedTop.forEach(([prodId, stat]) => {
            const prod = db.products.find(p => p.id == prodId);
            const name = prod ? prod.name : `Товар #${prodId}`;
            topTbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${name}</td>
                    <td class="text-center"><span class="badge bg-primary">${stat.qty} шт.</span></td>
                    <td class="text-end fw-bold">${stat.revenue.toLocaleString('ru-RU')} ₽</td>
                </tr>
            `;
        });
    }
    
    const ctx = document.getElementById('ordersChartReport').getContext('2d');
    if (ordersChartReportInstance) ordersChartReportInstance.destroy();
    
    ordersChartReportInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Завершённые', 'В доставке', 'Новые'],
            datasets: [{
                label: 'Количество заказов',
                data: [completedOrders, assignedOrders, newOrders],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}