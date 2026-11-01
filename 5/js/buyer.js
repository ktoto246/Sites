// js/buyer.js
let cart = [];
let currentSelectedProductId = null;

let currentFilters = {
    search: '',
    category: 'all',
    fat: 'all',
    priceMin: null,
    priceMax: null,
    sort: 'default',
    available: false
};

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    updateAuthButtons(user);
    
    if (user) {
        const welcomeEl = document.getElementById('welcomeUser');
        if (welcomeEl) {
            welcomeEl.innerText = `Привет, ${user.full_name || user.login}`;
        }
    }
    
    renderCatalog();
    bindFilterEvents();
});

function updateAuthButtons(user) {
    const authButtons = document.getElementById('authButtons');
    if (user) {
        authButtons.innerHTML = `
            <span class="text-white me-3">Привет, ${user.full_name || user.login}</span>
            <button class="btn btn-outline-light btn-sm" onclick="logout()">Выйти</button>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="index.html" class="btn btn-outline-light btn-sm">
                <i class="bi bi-person-circle me-1"></i> Войти
            </a>
        `;
    }
}

function bindFilterEvents() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase().trim();
        clearBtn.classList.toggle('d-none', !e.target.value);
        renderCatalog();
    });
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentFilters.search = '';
        clearBtn.classList.add('d-none');
        renderCatalog();
    });

    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            const filter = chip.dataset.filter;
            currentFilters.category = 'all';
            currentFilters.available = false;
            
            if (filter === 'cheese' || filter === 'butter') {
                currentFilters.category = filter;
            } else if (filter === 'available') {
                currentFilters.available = true;
            }
            
            renderCatalog();
        });
    });

    document.querySelectorAll('.fat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilters.fat = btn.dataset.fat;
            renderCatalog();
        });
    });

    document.getElementById('priceMin').addEventListener('input', (e) => {
        currentFilters.priceMin = e.target.value ? parseInt(e.target.value) : null;
        renderCatalog();
    });
    
    document.getElementById('priceMax').addEventListener('input', (e) => {
        currentFilters.priceMax = e.target.value ? parseInt(e.target.value) : null;
        renderCatalog();
    });

    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        renderCatalog();
    });

    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

function resetFilters() {
    currentFilters = {
        search: '',
        category: 'all',
        fat: 'all',
        priceMin: null,
        priceMax: null,
        sort: 'default',
        available: false
    };
    
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.add('d-none');
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('sortBy').value = 'default';
    
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.filter-chip[data-filter="all"]').classList.add('active');
    
    document.querySelectorAll('.fat-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.fat-btn[data-fat="all"]').classList.add('active');
    
    renderCatalog();
}

function getProductCategory(product) {
    const name = product.name.toLowerCase();
    if (name.includes('масло')) return 'butter';
    return 'cheese';
}

function parseFat(fatStr) {
    return parseInt(fatStr.replace('%', ''));
}

function getProductMinPriceAndStock(productId) {
    const db = getDB();
    const batches = db.inventory.filter(i => i.product_id === productId);
    
    if (batches.length === 0) {
        return { minPrice: 0, totalStock: 0 };
    }
    
    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
    const minPrice = Math.min(...batches.map(b => b.price));
    
    return { minPrice, totalStock };
}

function getAvailableOptions(productId) {
    const db = getDB();
    const inv = db.inventory.filter(i => i.product_id === productId && i.quantity > 0);
    const options = {};
    inv.forEach(item => {
        if (!options[item.weight]) {
            options[item.weight] = { weight: item.weight, price: item.price, totalQty: 0 };
        }
        options[item.weight].totalQty += item.quantity;
    });
    return Object.values(options);
}

function renderCatalog() {
    const db = getDB();
    const grid = document.getElementById('catalogGrid');
    const resultsCount = document.getElementById('resultsCount');
    
    let filtered = db.products.filter(p => {
        if (currentFilters.search) {
            const q = currentFilters.search;
            if (!p.name.toLowerCase().includes(q) && 
                !p.description.toLowerCase().includes(q)) {
                return false;
            }
        }
        
        if (currentFilters.category !== 'all') {
            if (getProductCategory(p) !== currentFilters.category) return false;
        }
        
        if (currentFilters.fat !== 'all') {
            const fat = parseFat(p.fat_content);
            if (currentFilters.fat === 'low' && fat > 45) return false;
            if (currentFilters.fat === 'mid' && (fat < 45 || fat > 60)) return false;
            if (currentFilters.fat === 'high' && fat <= 60) return false;
        }
        
        const { minPrice } = getProductMinPriceAndStock(p.id);
        
        if (currentFilters.priceMin !== null && minPrice < currentFilters.priceMin) return false;
        if (currentFilters.priceMax !== null && minPrice > currentFilters.priceMax) return false;
        
        if (currentFilters.available) {
            const { totalStock } = getProductMinPriceAndStock(p.id);
            if (totalStock === 0) return false;
        }
        
        return true;
    });
    
    filtered = sortProducts(filtered);
    
    resultsCount.innerText = `Найдено товаров: ${filtered.length}`;
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center mt-5 text-muted">
                <h4>Ничего не найдено</h4>
                <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
                <button class="btn btn-primary mt-3" onclick="document.getElementById('resetFilters').click()">
                    Сбросить фильтры
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    filtered.forEach(p => {
        const options = getAvailableOptions(p.id);
        const isAvailable = options.length > 0;
        
        grid.innerHTML += `
            <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                <div class="card h-100 product-card shadow-sm">
                    <img src="${p.image}" class="card-img-top" alt="${p.name}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${p.name}</h5>
                        <p class="card-text text-muted small mb-2">${p.description.substring(0, 60)}...</p>
                        <div class="mb-2">
                            <span class="badge bg-secondary">${p.fat_content}</span>
                            ${isAvailable ? '<span class="badge bg-success ms-1">В наличии</span>' : '<span class="badge bg-danger ms-1">Нет</span>'}
                        </div>
                        <div class="mt-auto">
                            ${isAvailable 
                                ? `<button class="btn btn-outline-primary w-100" onclick="openProductModal(${p.id})">Выбрать фасовку</button>`
                                : `<button class="btn btn-outline-secondary w-100" disabled>Нет в наличии</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function sortProducts(products) {
    const sorted = [...products];
    
    switch (currentFilters.sort) {
        case 'price_asc':
            sorted.sort((a, b) => {
                const pa = getProductMinPriceAndStock(a.id).minPrice;
                const pb = getProductMinPriceAndStock(b.id).minPrice;
                return pa - pb;
            });
            break;
        case 'price_desc':
            sorted.sort((a, b) => {
                const pa = getProductMinPriceAndStock(a.id).minPrice;
                const pb = getProductMinPriceAndStock(b.id).minPrice;
                return pb - pa;
            });
            break;
        case 'name_asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            break;
        case 'fat_desc':
            sorted.sort((a, b) => parseFat(b.fat_content) - parseFat(a.fat_content));
            break;
    }
    
    return sorted;
}

function openProductModal(id) {
    const db = getDB();
    const product = db.products.find(p => p.id === id);
    currentSelectedProductId = id;
    
    document.getElementById('modalProductName').innerText = product.name;
    document.getElementById('modalProductDesc').innerText = product.description;
    document.getElementById('modalProductFat').innerText = product.fat_content;
    document.getElementById('modalProductImg').src = product.image;
    
    const select = document.getElementById('modalWeightSelect');
    select.innerHTML = '';
    
    const options = getAvailableOptions(id);
    options.forEach(opt => {
        select.innerHTML += `<option value="${opt.weight}" data-price="${opt.price}" data-max="${opt.totalQty}">
            Фасовка ${opt.weight} г. — ${opt.price} ₽ (В наличии: ${opt.totalQty} шт)
        </option>`;
    });
    
    document.getElementById('modalQty').value = 1;
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function addToCart() {
    const db = getDB();
    const select = document.getElementById('modalWeightSelect');
    const selectedOption = select.options[select.selectedIndex];
    
    const weight = parseInt(selectedOption.value);
    const price = parseInt(selectedOption.getAttribute('data-price'));
    const maxAvailable = parseInt(selectedOption.getAttribute('data-max'));
    let qty = parseInt(document.getElementById('modalQty').value);
    
    if (qty <= 0) qty = 1;
    if (qty > maxAvailable) {
        alert('На складе нет столько товара!');
        return;
    }
    
    const product = db.products.find(p => p.id === currentSelectedProductId);
    const existing = cart.find(i => i.productId === product.id && i.weight === weight);
    
    if (existing) {
        if (existing.qty + qty > maxAvailable) {
            alert('С учетом добавленного в корзину, вы превышаете остаток на складе!');
            return;
        }
        existing.qty += qty;
    } else {
        cart.push({ productId: product.id, name: product.name, weight, price, qty });
    }
    
    updateCartUI();
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartBadge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    
    cartItems.innerHTML = '';
    
    let total = 0;
    let count = 0;
    
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        count += item.qty;
        
        cartItems.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div class="flex-grow-1 me-2">
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">${item.weight} г.</small>
                    <div class="input-group input-group-sm mt-2" style="max-width: 110px;">
                        <button class="btn btn-outline-secondary fw-bold" onclick="decreaseQty(${index})">-</button>
                        <input type="text" class="form-control text-center px-1" value="${item.qty}" readonly>
                        <button class="btn btn-outline-secondary fw-bold" onclick="increaseQty(${index})">+</button>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold mb-2">${item.price * item.qty} ₽</div>
                    <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none" onclick="removeFromCart(${index})">🗑 Удалить</button>
                </div>
            </div>
        `;
    });
    
    cartBadge.innerText = count;
    cartTotal.innerText = total;
    
    if (cart.length > 0) {
        checkoutForm.classList.remove('d-none');
        checkoutBtn.disabled = false;
    } else {
        checkoutForm.classList.add('d-none');
        checkoutBtn.disabled = true;
    }
}

function increaseQty(index) {
    const item = cart[index];
    const options = getAvailableOptions(item.productId);
    const option = options.find(o => o.weight === item.weight);
    
    if (option && item.qty < option.totalQty) {
        item.qty++;
        updateCartUI();
    } else {
        alert('Максимальное количество! На складе больше нет этого товара.');
    }
}

function decreaseQty(index) {
    if (cart[index].qty > 1) {
        cart[index].qty--;
        updateCartUI();
    } else {
        removeFromCart(index);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function toggleAddress() {
    const isDelivery = document.getElementById('delCourier').checked;
    document.getElementById('addressBlock').classList.toggle('d-none', !isDelivery);
}

function checkout() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert('Для оформления заказа необходимо войти в систему или зарегистрироваться.');
        window.location.href = 'index.html';
        return;
    }
    
    if (cart.length === 0) return;
    
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const address = document.getElementById('orderAddress').value;
    const cardNum = document.getElementById('orderCardNum').value;
    const cardExp = document.getElementById('orderCardExp').value;
    const cardCVC = document.getElementById('orderCardCVC').value;
    
    if (deliveryType === 'delivery' && address.trim() === '') {
        alert('Введите адрес доставки!');
        return;
    }
    
    if (cardNum.length !== 16 || cardExp.length < 4 || cardCVC.length !== 3) {
        alert('Заполните данные карты корректно!');
        return;
    }
    
    const db = getDB();
    let totalSum = 0;
    
    cart.forEach(cartItem => {
        totalSum += cartItem.price * cartItem.qty;
        
        let neededQty = cartItem.qty;
        let batches = db.inventory
            .filter(i => i.product_id === cartItem.productId && i.weight === cartItem.weight && i.quantity > 0)
            .sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date));
        
        for (let batch of batches) {
            if (neededQty <= 0) break;
            
            if (batch.quantity >= neededQty) {
                batch.quantity -= neededQty;
                neededQty = 0;
            } else {
                neededQty -= batch.quantity;
                batch.quantity = 0;
            }
        }
    });
    
    const newOrderId = db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1000;
    
    let eta = new Date();
    eta.setMinutes(eta.getMinutes() + 45);
    let timeStr = eta.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    db.orders.push({
        id: newOrderId,
        buyer_id: user.id,
        courier_id: null,
        status: 'new',
        delivery_type: deliveryType,
        address: deliveryType === 'delivery' ? address : '',
        total_sum: totalSum,
        payment_card: '**** ' + cardNum.substring(12, 16),
        eta_time: deliveryType === 'delivery' ? timeStr : null
    });
    
    saveDB(db);
    
    if (deliveryType === 'delivery') {
        alert(`Заказ #${newOrderId} успешно оформлен!\nОриентировочное время доставки: ${timeStr}`);
    } else {
        alert(`Заказ #${newOrderId} оформлен!\nМожете забирать со склада.`);
    }
    
    if (confirm(`Заказ #${newOrderId} успешно оформлен!\nСумма: ${totalSum} ₽\n\nХотите сразу скачать чек в формате PDF?`)) {
        downloadOrderReceipt(newOrderId);
    }
    
    cart = [];
    updateCartUI();
    renderCatalog();
    bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas')).hide();
}

function downloadOrderReceipt(orderId) {
    const db = getDB();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Товарный чек #${order.id}</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
                .header h2 { margin: 0; color: #0f172a; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                .total { margin-top: 30px; border-top: 2px solid #0f172a; padding-top: 15px; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>«Масло-сыр комбинат»</h2>
                <p>Товарный чек № ${order.id}</p>
            </div>
            <div class="info-row">
                <span>Тип получения:</span>
                <strong>${order.delivery_type === 'delivery' ? 'Доставка курьером' : 'Самовывоз со склада'}</strong>
            </div>
            ${order.address ? `<div class="info-row"><span>Адрес доставки:</span><strong>${order.address}</strong></div>` : ''}
            ${order.eta_time ? `<div class="info-row"><span>Время доставки:</span><strong>${order.eta_time}</strong></div>` : ''}
            <div class="info-row">
                <span>Способ оплаты:</span>
                <strong>Банковская карта (${order.payment_card})</strong>
            </div>
            <div class="total">
                <span>Итого к оплате:</span>
                <span>${order.total_sum.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div class="footer">
                <p>Спасибо за покупку! Продукция сертифицирована по ГОСТ.</p>
                <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Сохранить в PDF / Напечатать</button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function logout() {
    localStorage.removeItem('currentUser');
    updateAuthButtons(null);
    renderCatalog();
}