const API_URL = 'http://localhost:5009/api'; 

const currentUserId = localStorage.getItem('userId');
const currentUserName = localStorage.getItem('userName');
const currentUserRole = localStorage.getItem('userRole');

document.getElementById('userNameDisplay').textContent = currentUserName;

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

let allRequests = []; 
let currentFilteredRequests = []; 
let currentFilter = 'all'; 
let currentSortColumn = 'id';
let sortAscending = false; 
window.currentOpenRequestId = null;
let globalPriceList = [];
let estimatedTotal = 0;

let currentPage = 1;
const ITEMS_PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', async () => {
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        dateInput.setAttribute('min', tomorrowStr);
    }

    const opTypeSelect = document.getElementById('operationTypeSelect');
    if (opTypeSelect) {
        opTypeSelect.addEventListener('change', function() {
            const qBlock = document.getElementById('qualityBlock');
            const sBlock = document.getElementById('servicesBlock');
            
            if (this.value === 'Отгрузка с элеватора') {
                qBlock.classList.add('d-none');
                sBlock.classList.add('d-none');
                
                document.getElementById('moistureInput').value = '';
                document.getElementById('weedinessInput').value = '';
                document.getElementById('checkStorage').checked = false;
                document.getElementById('checkTrain').checked = false;
                document.getElementById('storageDaysBlock').classList.add('d-none');
                document.getElementById('storageDaysInput').value = '';
                document.getElementById('calcTotal').textContent = '0.00 ₽';
            } else {
                qBlock.classList.remove('d-none');
                sBlock.classList.remove('d-none');
                calculateEstimate();
            }
        });
    }

    await loadCrops();
    await loadMyRequests();

    try {
        const res = await fetch(`${API_URL}/Services`);
        if (res.ok) globalPriceList = await res.json();
    } catch (e) {}

    document.querySelectorAll('.calc-trigger').forEach(input => {
        input.addEventListener('input', calculateEstimate);
        input.addEventListener('change', calculateEstimate);
    });

    document.getElementById('checkStorage').addEventListener('change', function() {
        const daysBlock = document.getElementById('storageDaysBlock');
        if (this.checked) {
            daysBlock.classList.remove('d-none');
        } else {
            daysBlock.classList.add('d-none');
            document.getElementById('storageDaysInput').value = ''; 
            calculateEstimate(); 
        }
    });
});

function calculateEstimate() {
    if (globalPriceList.length === 0) return;

    const getPrice = (name) => {
        const srv = globalPriceList.find(s => (s.name || s.Name).includes(name));
        return srv ? (srv.price || srv.Price) : 0;
    };

    const priceIntake = getPrice('Приемка');
    const priceDrying = getPrice('Сушка');
    const priceCleaning = getPrice('Очистка');
    const priceStorage = getPrice('Хранение');
    const priceTrain = getPrice('Ж/Д');

    const weight = parseFloat(document.getElementById('weightInput').value) || 0;
    const moisture = parseFloat(document.getElementById('moistureInput').value) || 0;
    const weediness = parseFloat(document.getElementById('weedinessInput').value) || 0;

    const sel = document.getElementById('cropSelect');
    const baseMoisture = parseFloat(sel.options[sel.selectedIndex]?.dataset?.base) || 14;
    const baseWeediness = parseFloat(sel.options[sel.selectedIndex]?.dataset?.weed) || 2; 

    let total = 0;

    if (weight > 0) {
        total += weight * priceIntake;

        if (moisture > baseMoisture) {
            total += (moisture - baseMoisture) * weight * priceDrying;
        }

        if (weediness > baseWeediness) {
            total += (weediness - baseWeediness) * weight * priceCleaning;
        }

        if (document.getElementById('checkStorage').checked) {
            const days = parseInt(document.getElementById('storageDaysInput').value) || 0;
            total += weight * priceStorage * days; 
        }
        if (document.getElementById('checkTrain').checked) {
            total += weight * priceTrain;
        }
    }

    estimatedTotal = total;
    document.getElementById('calcTotal').textContent = total.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
}

async function loadCrops() {
    try {
        const res = await fetch(`${API_URL}/References/crops`);
        const crops = await res.json();
        const select = document.getElementById('cropSelect');
        const filterSelect = document.getElementById('filterCropSelect');
        
        if (select) {
            select.innerHTML = '<option value="" selected disabled>Выберите культуру...</option>';
            crops.forEach(c => { 
                select.innerHTML += `<option value="${c.id || c.Id}" data-base="${c.baseMoisture || c.BaseMoisture}" data-weed="${c.baseWeediness || c.BaseWeediness}">${c.name || c.Name}</option>`; 
            });
            
            select.addEventListener('change', function() {
                const opt = this.options[this.selectedIndex];
                const baseMoisture = parseFloat(opt.dataset?.base) || 14;
                const baseWeed = parseFloat(opt.dataset?.weed) || 2;
                
                document.getElementById('moistureInput').placeholder = `База ${baseMoisture}%`;
                document.getElementById('weedinessInput').placeholder = `База ${baseWeed}%`;
                calculateEstimate();
            });
        }
        
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">Все культуры</option>';
            crops.forEach(c => { filterSelect.innerHTML += `<option value="${c.name || c.Name}">${c.name || c.Name}</option>`; });
            filterSelect.addEventListener('change', () => {
                currentPage = 1;
                renderTable();
            });
        }
    } catch (e) { console.error("Ошибка загрузки культур", e); }
}

async function loadMyRequests() {
    const tbody = document.getElementById('requestsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-success" role="status"></div></td></tr>';

    try {
        const res = await fetch(`${API_URL}/Requests?userId=${currentUserId}`);
        allRequests = await res.json();
        updateDashboardStats(); 
        window.sortTable(currentSortColumn, true);
    } catch (e) { console.error("Ошибка загрузки заявок", e); }
}

function updateDashboardStats() {
    if (!allRequests) return;
    const total = allRequests.length;
    let done = 0, active = 0, toPay = 0;
    
    allRequests.forEach(req => {
        const status = req.StatusName || req.statusName;
        const payStatus = req.PaymentStatus || req.paymentStatus;
        
        if (status === 'Выполнена') done++;
        else if (status !== 'Отклонена') active++; 
        
        if (payStatus === 'Ожидает оплаты') toPay++;
    });
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statDone').textContent = done;
    
    const elToPay = document.getElementById('statToPay');
    if (elToPay) elToPay.textContent = toPay;
}

window.setFilter = function(filterType, btnElement) {
    currentFilter = filterType;
    currentPage = 1;
    const buttons = btnElement.parentElement.querySelectorAll('.btn');
    buttons.forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    renderTable();
};

window.sortTable = function(column, preserveDirection = false) {
    if (!preserveDirection) {
        if (currentSortColumn === column) sortAscending = !sortAscending;
        else { currentSortColumn = column; sortAscending = true; }
    }

    allRequests.sort((a, b) => {
        let valA, valB;
        if (column === 'id') { valA = parseInt(a.Id || a.id || 0); valB = parseInt(b.Id || b.id || 0); }
        else if (column === 'date') { valA = new Date(a.DesiredDate || a.desiredDate || 0).getTime(); valB = new Date(b.DesiredDate || b.desiredDate || 0).getTime(); }
        else if (column === 'crop') { valA = a.CropName || a.cropName || ''; valB = b.CropName || b.cropName || ''; }
        else if (column === 'weight') { valA = parseFloat(a.Weight || a.weight || 0); valB = parseFloat(b.Weight || b.weight || 0); }
        else if (column === 'payment') { valA = a.PaymentStatus || a.paymentStatus || ''; valB = b.PaymentStatus || b.paymentStatus || ''; }
        
        if (valA < valB) return sortAscending ? -1 : 1;
        if (valA > valB) return sortAscending ? 1 : -1;
        return 0;
    });
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    const selectedCrop = document.getElementById('filterCropSelect')?.value || 'all';

    currentFilteredRequests = allRequests.filter(req => {
        const cropName = req.CropName || req.cropName;
        if (selectedCrop !== 'all' && cropName !== selectedCrop) return false;

        const status = req.StatusName || req.statusName;
        if (currentFilter === 'all') return true;
        if (currentFilter === 'new') return status === 'Новая';
        if (currentFilter === 'done') return status === 'Выполнена';
        if (currentFilter === 'rejected') return status === 'Отклонена';
        if (currentFilter === 'active') return status !== 'Новая' && status !== 'Выполнена' && status !== 'Отклонена';
        if (currentFilter === 'topay') return (req.PaymentStatus || req.paymentStatus) === 'Ожидает оплаты';
        return true;
    });

    const exportBtn = document.querySelector('button[onclick="exportToExcel()"]');
    if (exportBtn) exportBtn.disabled = currentFilteredRequests.length === 0;

    const totalItems = currentFilteredRequests.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    renderPagination(totalPages);

    if (totalItems === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state p-4 text-center text-muted"><i class="bi bi-search fs-1"></i><h5 class="mt-2">Пусто</h5></div></td></tr>`;
        return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRequests = currentFilteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    paginatedRequests.forEach(req => {
        const id = req.Id || req.id || '???'; 
        const statusName = req.StatusName || req.statusName || 'Неизвестно';
        const desiredDate = req.DesiredDate || req.desiredDate;
        const cropName = req.CropName || req.cropName || 'Не указана';
        const fWeight = req.FactWeight || req.factWeight;
        const planWeight = req.Weight || req.weight || 0;
        const displayWeight = fWeight ? 
            `<span class="text-success fw-bold">${fWeight}т</span> <br><small class="text-muted">(факт)</small>` : 
            `${planWeight}т <br><small class="text-muted">(план)</small>`;
        const stageName = req.StageName || req.stageName || 'Не начат';
        const stagePercent = req.StagePercent || req.stagePercent || 0;

        const payStat = req.PaymentStatus || req.paymentStatus || 'Не рассчитано';
        let payBadge = '<span class="badge bg-secondary bg-opacity-25 text-secondary">Нет</span>';
        if (payStat === 'Ожидает оплаты') payBadge = '<span class="badge bg-warning text-dark border border-warning shadow-sm"><i class="bi bi-exclamation-circle"></i> Счёт</span>';
        if (payStat === 'Оплачено') payBadge = '<span class="badge bg-success bg-opacity-25 text-success"><i class="bi bi-check"></i> Оплачено</span>';

        let colorClass = 'bg-secondary';
        if (stagePercent > 0 && stagePercent < 100) colorClass = 'bg-info progress-bar-striped progress-bar-animated';
        if (stagePercent === 100 && statusName === 'Выполнена') colorClass = 'bg-success';
        if (statusName === 'Отклонена') colorClass = 'bg-danger';

        const progressBarHtml = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-bold text-dark">${stageName}</span>
                <span class="small text-muted fw-bold">${stagePercent}%</span>
            </div>
            <div class="progress" style="height: 6px; border-radius: 4px;">
                <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${stagePercent}%;"></div>
            </div>`;

        let dateStr = 'Нет даты';
        if (desiredDate) {
            const d = new Date(desiredDate);
            if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('ru-RU');
        }

        tbody.innerHTML += `
            <tr onclick="showDetails(${id === '???' ? 0 : id})" style="cursor: pointer; transition: background-color 0.2s;" class="table-row-hover">
                <td class="text-muted fw-bold">№ ${id}</td>
                <td>${dateStr}</td>
                <td class="fw-semibold">${cropName}</td>
                <td>${displayWeight}</td>
                <td>${payBadge}</td>
                <td>${progressBarHtml}</td>
            </tr>`;
    });

    const tfoot = document.getElementById('requestsTableFoot');
    if (tfoot) {
        if (totalItems > 0) {
            const totalWeight = currentFilteredRequests.reduce((sum, r) => {
                const w = parseFloat(r.FactWeight || r.factWeight || r.Weight || r.weight || 0);
                return sum + w;
            }, 0).toFixed(2);
            
            tfoot.innerHTML = `<tr><td colspan="3" class="text-end text-muted fw-bold">Итого (факт/план):</td><td class="fw-bold text-dark fs-5">${totalWeight}т</td><td colspan="2"></td></tr>`;
        } else { tfoot.innerHTML = ''; }
    }
}

function renderPagination(totalPages) {
    const pag = document.getElementById('requestsPagination');
    if (!pag) return;
    pag.innerHTML = '';
    
    if (totalPages <= 1) return;

    pag.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Пред.</a></li>`;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    if (startPage > 1) {
        pag.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1); return false;">1</a></li>`;
        if (startPage > 2) pag.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    for (let i = startPage; i <= endPage; i++) {
        pag.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a></li>`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pag.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        pag.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a></li>`;
    }
    pag.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">След.</a></li>`;
}

window.changePage = function(page) {
    currentPage = page;
    renderTable();
};

window.exportToExcel = function() {
    if (currentFilteredRequests.length === 0) return alert('Нет данных для выгрузки!');
    let csvContent = "\uFEFF№ Заявки;Дата завоза;Культура;Вес (т);Влажность (%);Сорность (%);Статус;Производственный этап;Комментарий\n";
    currentFilteredRequests.forEach(req => {
        const id = req.Id || req.id || '';
        const desiredDate = req.DesiredDate || req.desiredDate;
        let dateStr = '';
        if (desiredDate) {
            const d = new Date(desiredDate);
            if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('ru-RU');
        }

        const cropName = req.CropName || req.cropName || '';
        const weight = `="${(req.Weight || req.weight || 0).toString().replace('.', ',')}"`;
        const moisture = `="${(req.Moisture || req.moisture || '').toString().replace('.', ',')}"`;
        const weediness = `="${(req.Weediness || req.weediness || '').toString().replace('.', ',')}"`;
        const statusName = req.StatusName || req.statusName || '';
        const stageName = req.StageName || req.stageName || '';
        const rawComment = req.Comments || req.comments || '';
        const safeComment = rawComment.replace(/;/g, ',').replace(/\r?\n/g, ' '); 

        csvContent += `${id};${dateStr};${cropName};${weight};${moisture};${weediness};${statusName};${stageName};${safeComment}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Мои_заявки_${new Date().toLocaleDateString('ru-RU')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.showDetails = function(id) {
    if (id === 0) return;
    const req = allRequests.find(r => (r.Id || r.id) === id);
    if (!req) return;

    window.currentOpenRequestId = id;

    document.getElementById('modalReqId').textContent = id;
    document.getElementById('modalCrop').textContent = req.CropName || req.cropName || 'Не указана';
    
    let dateStr = 'Нет даты';
    const desiredDate = req.DesiredDate || req.desiredDate;
    if (desiredDate) {
        const d = new Date(desiredDate);
        if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('ru-RU');
    }
    document.getElementById('modalDate').textContent = dateStr;
    
    const fWeight = req.FactWeight || req.factWeight;
    const fMoist = req.FactMoisture || req.factMoisture;
    const fWeed = req.FactWeediness || req.factWeediness;

    document.getElementById('modalWeight').innerHTML = fWeight ? `<span class="text-success fw-bold">${fWeight}</span> <small class="text-muted">(План: ${req.Weight || req.weight})</small>` : (req.Weight || req.weight || 0);
    document.getElementById('modalMoisture').innerHTML = fMoist ? `<span class="text-success fw-bold">${fMoist}%</span> <small class="text-muted">(План: ${req.Moisture || req.moisture || '—'}%)</small>` : (req.Moisture || req.moisture || '—') + '%';
    document.getElementById('modalWeediness').innerHTML = fWeed ? `<span class="text-success fw-bold">${fWeed}%</span> <small class="text-muted">(План: ${req.Weediness || req.weediness || '—'}%)</small>` : (req.Weediness || req.weediness || '—') + '%';
    document.getElementById('modalComment').textContent = req.Comments || req.comments || 'Комментарий отсутствует';
    
    const adminComment = req.AdminComment || req.adminComment;
    const adminBlock = document.getElementById('adminCommentBlock');
    if (adminComment) {
        adminBlock.classList.remove('d-none');
        document.getElementById('modalAdminComment').textContent = adminComment;
    } else {
        adminBlock.classList.add('d-none');
    }

    const statusName = req.StatusName || req.statusName || 'Неизвестно';
    let badgeClass = 'bg-secondary';
    if (statusName === 'Новая') badgeClass = 'bg-primary';
    if (statusName === 'Принята в работу' || statusName === 'В процессе обработки') badgeClass = 'bg-info text-dark';
    if (statusName === 'Ожидает завоза') badgeClass = 'bg-warning text-dark';
    if (statusName === 'Выполнена') badgeClass = 'bg-success';
    if (statusName === 'Отклонена') badgeClass = 'bg-danger';
    
    const badgeEl = document.getElementById('modalStatusBadge');
    if(badgeEl) badgeEl.innerHTML = `<span class="badge ${badgeClass} fs-6">${statusName}</span>`;

    const stageName = req.StageName || req.stageName || 'Не начат';
    const stagePercent = req.StagePercent || req.stagePercent || 0;
    
    const elStageName = document.getElementById('modalStageName');
    const elStagePercent = document.getElementById('modalStagePercent');
    const elProgressBar = document.getElementById('modalProgressBar');
    
    if(elStageName) elStageName.textContent = stageName;
    if(elStagePercent) elStagePercent.textContent = stagePercent + '%';
    if(elProgressBar) {
        elProgressBar.style.width = stagePercent + '%';
        elProgressBar.className = 'progress-bar bg-agro';
        if (statusName === 'Отклонена') elProgressBar.className = 'progress-bar bg-danger';
        if (statusName === 'Выполнена') elProgressBar.className = 'progress-bar bg-success';
    }

    const btnCancel = document.getElementById('btnCancelRequest');
    if (btnCancel) {
        if (statusName === 'Новая') btnCancel.classList.remove('d-none'); 
        else btnCancel.classList.add('d-none');
    }

    const paymentStatus = req.PaymentStatus || req.paymentStatus || 'Не рассчитано';
    const totalAmount = req.TotalAmount || req.totalAmount || 0;
    
    document.getElementById('modalPaymentStatus').textContent = paymentStatus;
    document.getElementById('modalTotalAmount').textContent = totalAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2 });

   const btnPay = document.getElementById('btnPayRequest');
    const btnAct = document.getElementById('btnDownloadAct');
    
    if (btnPay) {
        if (paymentStatus === 'Ожидает оплаты') {
            btnPay.classList.remove('d-none');
            btnPay.disabled = false;
            if(btnAct) btnAct.classList.remove('d-none'); 
        } else if (paymentStatus === 'Оплачено') {
            btnPay.classList.add('d-none');
            if(btnAct) btnAct.classList.remove('d-none'); 
        } else {
            btnPay.classList.add('d-none');
            if(btnAct) btnAct.classList.add('d-none'); 
        }
    }

    const servicesWrapper = document.getElementById('modalServicesWrapper');
    const servicesList = document.getElementById('modalServicesList');
    if (servicesWrapper && servicesList) {
        servicesList.innerHTML = '<li class="list-group-item text-center text-muted border-0"><div class="spinner-border spinner-border-sm"></div></li>';
        servicesWrapper.classList.remove('d-none');

        fetch(`${API_URL}/Requests/${id}/services`)
            .then(res => res.json())
            .then(services => {
                if (!services || services.length === 0) {
                    servicesWrapper.classList.add('d-none');
                    return;
                }
                servicesList.innerHTML = '';
                services.forEach(s => {
                    servicesList.innerHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-color-translucent">
                            <div>
                                <span class="fw-bold text-dark">${s.name || s.Name}</span>
                                <small class="d-block text-muted">Объем: ${s.volume || s.Volume}</small>
                            </div>
                            <span class="fw-bold">${(s.sum || s.Sum).toFixed(2)} ₽</span>
                        </li>`;
                });
            })
            .catch(() => servicesWrapper.classList.add('d-none'));
    }

    const modalEl = document.getElementById('requestDetailModal');
    if (modalEl) {
        const myModal = new bootstrap.Modal(modalEl);
        myModal.show();
    }
};

window.cancelCurrentRequest = async function() {
    if (!window.currentOpenRequestId) return;
    if (!confirm('Вы уверены, что хотите отменить эту заявку? Это действие необратимо.')) return;
    
    try {
        const response = await fetch(`${API_URL}/Requests/${window.currentOpenRequestId}?userId=${currentUserId}`, { method: 'DELETE' });
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('requestDetailModal')).hide();
            await loadMyRequests(); 
        } else {
            const errData = await response.json();
            alert(errData.message || 'Ошибка при отмене заявки.');
        }
    } catch (e) { alert('Ошибка соединения с сервером.'); }
};

document.getElementById('requestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgBox = document.getElementById('formMessage');
    msgBox.className = 'small mb-3 d-none text-center fw-bold'; 

    const dateInput = document.getElementById('dateInput').value;
    const today = new Date().toISOString().split('T')[0];
    
    if (dateInput <= today) {
        msgBox.textContent = "Ошибка: Выберите дату начиная с завтрашнего дня!";
        msgBox.classList.add('text-danger', 'alert', 'alert-danger', 'py-2');
        msgBox.classList.remove('d-none');
        return;
    }

    const cropId = document.getElementById('cropSelect').value;
    if (!cropId) {
        msgBox.textContent = "Ошибка: Пожалуйста, выберите культуру!";
        msgBox.classList.add('text-danger', 'alert', 'alert-danger', 'py-2');
        msgBox.classList.remove('d-none');
        return;
    }

    const weightVal = parseFloat(document.getElementById('weightInput').value);
    if (weightVal < 5) {
        msgBox.textContent = "Ошибка: Минимальная партия зерна — 5 тонн!";
        msgBox.classList.add('text-danger', 'alert', 'alert-danger', 'py-2');
        msgBox.classList.remove('d-none');
        return;
    }

    const checkStorage = document.getElementById('checkStorage').checked;
    const storageDays = checkStorage ? (parseInt(document.getElementById('storageDaysInput').value) || null) : null;
    const checkTrain = document.getElementById('checkTrain').checked;
    const opType = document.getElementById('operationTypeSelect').value;
    const rawComment = document.getElementById('commentInput').value.trim();
    const userComment = `[${opType}]\n${rawComment}`;

    const data = {
        userId: parseInt(currentUserId),
        cropId: parseInt(cropId),
        weight: parseFloat(document.getElementById('weightInput').value),
        moisture: parseFloat(document.getElementById('moistureInput').value) || null,
        weediness: parseFloat(document.getElementById('weedinessInput').value) || null,
        desiredDate: dateInput,
        comments: userComment,
        requestStorage: checkStorage, 
        storageDays: storageDays,
        requestTrain: checkTrain
    };

    try {
        const response = await fetch(`${API_URL}/Requests`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Заявка успешно отправлена!');
            document.getElementById('requestForm').reset();
            document.getElementById('calcTotal').textContent = '0.00 ₽';
            estimatedTotal = 0;
            const allBtn = document.querySelector('.btn-group button:first-child');
            if(allBtn) setFilter('all', allBtn);
            await loadMyRequests(); 
        } else {
            showToast('Ошибка при сохранении.', true);
        }
    } catch (error) { showToast('Ошибка сети.', true); }
});

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    const updateIcon = (theme) => toggleBtn.innerHTML = theme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
    updateIcon(localStorage.getItem('theme') || 'light');
    toggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });
});

window.showToast = function(message, isError = false) {
    const toastEl = document.getElementById('liveToast');
    if (!toastEl) return;
    document.getElementById('toastMessage').textContent = message;
    toastEl.className = `toast align-items-center text-bg-${isError ? 'danger' : 'success'} border-0`;
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
};

window.showPriceList = async function() {
    const tbody = document.getElementById('priceListTableBody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3"><div class="spinner-border spinner-border-sm text-warning"></div> Загрузка...</td></tr>';
    const modal = new bootstrap.Modal(document.getElementById('priceListModal'));
    modal.show();

    try {
        const res = await fetch(`${API_URL}/Services`);
        if (!res.ok) throw new Error('Network error');
        const services = await res.json();
        
        tbody.innerHTML = '';
        services.forEach(srv => {
            const name = srv.name || srv.Name;
            const unit = srv.unit || srv.Unit;
            const price = srv.price || srv.Price;
            tbody.innerHTML += `
                <tr>
                    <td class="fw-medium">${name}</td>
                    <td class="text-end text-muted small">${unit}</td>
                    <td class="text-end fw-bold text-dark">${price.toFixed(2)}</td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-3">Не удалось загрузить прайс-лист.</td></tr>';
        showToast('Ошибка загрузки прайса', true);
    }
};

window.payRequest = async function() {
    if (!window.currentOpenRequestId) return;
    const btn = document.getElementById('btnPayRequest');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Обработка...';

    try {
        const res = await fetch(`${API_URL}/Requests/${window.currentOpenRequestId}/pay`, { method: 'PUT' });
        if (res.ok) {
            showToast('Оплата успешно проведена!');
            bootstrap.Modal.getInstance(document.getElementById('requestDetailModal')).hide();
            await loadMyRequests(); 
        } else {
            const err = await res.json();
            showToast(err.message || 'Ошибка оплаты', true);
        }
    } catch (e) { showToast('Ошибка соединения с сервером', true); } 
    finally {
        btn.disabled = false;
        btn.textContent = 'Оплатить';
    }
};

window.downloadAct = async function() {
    if (!window.currentOpenRequestId) return;
    const req = allRequests.find(r => (r.Id || r.id) === window.currentOpenRequestId);
    if (!req) return;

    try {
        const res = await fetch(`${API_URL}/Requests/${req.Id || req.id}/services`);
        const services = await res.json();
        
        let servicesRows = '';
        services.forEach((s, idx) => {
            servicesRows += `
                <tr>
                    <td style="border: 1px solid #000; padding: 5px;">${idx + 1}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${s.name || s.Name}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${s.volume || s.Volume}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${(s.sum || s.Sum).toFixed(2)} руб.</td>
                </tr>`;
        });

        const actHtml = `
            <html>
            <head>
                <meta charset="utf-8">
                <title>Акт выполненных работ №${req.Id || req.id}</title>
                <style>body { font-family: Arial, sans-serif; padding: 40px; color: #000; }</style>
            </head>
            <body>
                <h2 style="text-align: center;">АКТ ВЫПОЛНЕННЫХ РАБОТ № ${req.Id || req.id}</h2>
                <p style="text-align: center;">от ${new Date().toLocaleDateString('ru-RU')}</p>
                <hr>
                <p><b>Исполнитель:</b> АО "Балашовская Хлебная База"</p>
                <p><b>Заказчик:</b> ${currentUserName}</p>
                <p><b>Культура:</b> ${req.CropName || req.cropName}</p>
                <p><b>Фактический вес (нетто):</b> ${req.FactWeight || req.factWeight || '-'} т</p>
                
                <h4 style="margin-top: 30px;">Детализация оказанных услуг:</h4>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: #f0f0f0;">
                        <tr>
                            <th style="border: 1px solid #000; padding: 5px;">№</th>
                            <th style="border: 1px solid #000; padding: 5px;">Услуга</th>
                            <th style="border: 1px solid #000; padding: 5px;">Объем (т/%/дн)</th>
                            <th style="border: 1px solid #000; padding: 5px;">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>${servicesRows}</tbody>
                </table>
                <h3 style="text-align: right; margin-top: 20px;">ИТОГО К ОПЛАТЕ: ${(req.TotalAmount || req.totalAmount || 0).toLocaleString('ru-RU')} руб.</h3>
                
                <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                    <div><p>Исполнитель ______________ /Директор/</p><p>М.П.</p></div>
                    <div><p>Заказчик ______________ /Представитель/</p><p>М.П.</p></div>
                </div>
            </body>
            </html>`;

        const blob = new Blob([actHtml], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Акт_услуг_БХБ_Заявка_${req.Id || req.id}.html`;
        link.click();
        
    } catch (e) {
        alert("Не удалось загрузить данные акта");
    }
};