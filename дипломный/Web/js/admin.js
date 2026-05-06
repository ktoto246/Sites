const API_URL = 'http://localhost:5009/api'; 

const currentUserId = localStorage.getItem('userId');
const currentUserName = localStorage.getItem('userName');
const currentUserRole = localStorage.getItem('userRole');

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

let statusesList = [];
let globalCropsList = [];
let stagesList = [];
let globalServicesList = [];

let allRequests = [];
let currentFilteredRequests = [];
let currentFilter = 'all';

let currentPage = 1;
const ITEMS_PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', async () => {
    const roleNames = { 'admin': 'Админ', 'manager': 'Менеджер' };
    document.getElementById('userNameDisplay').textContent = currentUserName + ` (${roleNames[currentUserRole] || ''})`;

    await loadDictionaries();

    loadFinanceStats(); 
    loadAllRequests();
    
    document.getElementById('searchName').addEventListener('input', renderAdminTable);
    document.getElementById('filterDateFrom').addEventListener('change', renderAdminTable);
    document.getElementById('filterDateTo').addEventListener('change', renderAdminTable);

    setInterval(() => {
        if (document.querySelector('.modal.show') || document.querySelector('.admin-select:focus') || document.activeElement === document.getElementById('searchName')) return;
        loadAllRequests(false);
    }, 15000);
});

async function loadDictionaries() {
    const resSrv = await fetch(`${API_URL}/References/services`);
    if (resSrv.ok) globalServicesList = await resSrv.json();
    try {
        const resStat = await fetch(`${API_URL}/References/statuses`);
        if (resStat.ok) statusesList = await resStat.json();
        
        const resStage = await fetch(`${API_URL}/References/stages`);
        if (resStage.ok) stagesList = await resStage.json();

        const resCrops = await fetch(`${API_URL}/References/crops`);
        if (resCrops.ok) globalCropsList = await resCrops.json();
    } catch (e) { 
        console.error("Ошибка загрузки справочников", e); 
    }
}

async function loadFinanceStats() {
    try {
        const res = await fetch(`${API_URL}/Finance/stats`);
        const stats = await res.json();
        
        const earned = stats.totalEarned || stats.TotalEarned || 0;
        const pending = stats.pendingAmount || stats.PendingAmount || 0;
        
        document.getElementById('statEarned').textContent = earned.toLocaleString('ru-RU') + ' ₽';
        document.getElementById('statPending').textContent = pending.toLocaleString('ru-RU') + ' ₽';
    } catch (e) { console.error("Ошибка загрузки финансов", e); }
}

window.resetFilters = function() {
    document.getElementById('searchName').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    currentPage = 1;
    renderAdminTable();
};

async function loadAllRequests(showSpinner = true) {
    const tbody = document.getElementById('adminTableBody');
    if (showSpinner && tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Загрузка...</span></div></td></tr>';
    }

    try {
        const res = await fetch(`${API_URL}/Requests`);
        allRequests = await res.json();
       allRequests.sort((a, b) => {
            const dateA = new Date(a.DesiredDate || a.desiredDate).getTime();
            const dateB = new Date(b.DesiredDate || b.desiredDate).getTime();
            
            if (dateA !== dateB) {
                return dateA - dateB;
            }
            return parseInt(a.Id || a.id) - parseInt(b.Id || b.id);
        });
        updateAdminStats();
        renderAdminTable();
        renderAdminCharts();
    } catch (e) { console.error("Ошибка загрузки", e); }
}

let cropWeightChartInstance = null;
let paymentChartInstance = null;
let stageChartInstance = null;

function renderAdminCharts() {
    const cropWeights = {};
    const paymentCounts = {};
    const stageCounts = {};

    // Собираем стату
    allRequests.forEach(req => {
        // 1. Тоннаж по культурам (Берем факт, если нет — план)
        const c = req.CropName || req.cropName || 'Неизвестна';
        const weight = parseFloat(req.FactWeight || req.factWeight || req.Weight || req.weight || 0);
        cropWeights[c] = (cropWeights[c] || 0) + weight;

        // 2. Статусы оплаты
        const p = req.PaymentStatus || req.paymentStatus || 'Не рассчитано';
        paymentCounts[p] = (paymentCounts[p] || 0) + 1;

        // 3. Этапы (воронка производства)
        const st = req.StageName || req.stageName || 'Не начат';
        stageCounts[st] = (stageCounts[st] || 0) + 1;
    });

    // Отрисовка 1: Тоннаж (Bar)
    const cwCtx = document.getElementById('cropWeightChart');
    if (cwCtx) {
        if (cropWeightChartInstance) cropWeightChartInstance.destroy();
        cropWeightChartInstance = new Chart(cwCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(cropWeights),
                datasets: [{
                    label: 'Суммарный вес (т)',
                    data: Object.values(cropWeights),
                    backgroundColor: '#198754',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Отрисовка 2: Оплаты (Doughnut)
    const pCtx = document.getElementById('paymentChart');
    if (pCtx) {
        if (paymentChartInstance) paymentChartInstance.destroy();
        paymentChartInstance = new Chart(pCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(paymentCounts),
                datasets: [{
                    data: Object.values(paymentCounts),
                    // Зеленый (оплачено), желтый (ожидает), серый (не рассчитано)
                    backgroundColor: ['#198754', '#ffc107', '#6c757d', '#0d6efd', '#dc3545'] 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, animation: false }
        });
    }

    // Отрисовка 3: Этапы (Horizontal Bar)
    const stCtx = document.getElementById('stageChart');
    if (stCtx) {
        if (stageChartInstance) stageChartInstance.destroy();
        stageChartInstance = new Chart(stCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(stageCounts),
                datasets: [{
                    label: 'Заявок на этапе',
                    data: Object.values(stageCounts),
                    backgroundColor: '#0d6efd',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // Делает график горизонтальным
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { legend: { display: false } }
            }
        });
    }
}

function updateAdminStats() {
    let newReq = 0, active = 0, done = 0;
    allRequests.forEach(req => {
        const status = req.StatusName || req.statusName;
        if (status === 'Новая') newReq++;
        else if (status === 'Выполнена') done++;
        else if (status !== 'Отклонена') active++;
    });
    document.getElementById('adminStatNew').textContent = newReq;
    document.getElementById('adminStatActive').textContent = active;
    document.getElementById('adminStatDone').textContent = done;
}

window.setAdminFilter = function(filterType, btnElement) {
    currentFilter = filterType;
    currentPage = 1;
    const buttons = btnElement.parentElement.querySelectorAll('.btn');
    buttons.forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    renderAdminTable();
};

function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = ''; 

    currentFilteredRequests = allRequests.filter(req => {
        const status = req.StatusName || req.statusName;
        const nameQuery = document.getElementById('searchName')?.value.toLowerCase() || '';
        const userName = (req.UserName || req.userName || '').toLowerCase();
        if (nameQuery && !userName.includes(nameQuery)) return false;

        const reqDateStr = req.DesiredDate || req.desiredDate;
        if (reqDateStr) {
            const reqDate = new Date(reqDateStr).getTime();
            const fromStr = document.getElementById('filterDateFrom')?.value;
            const toStr = document.getElementById('filterDateTo')?.value;
            
            if (fromStr && reqDate < new Date(fromStr).getTime()) return false;
            if (toStr && reqDate > new Date(toStr).getTime()) return false;
        }

        if (currentFilter === 'new') return status === 'Новая';
        if (currentFilter === 'active') return status !== 'Новая' && status !== 'Выполнена' && status !== 'Отклонена';
        return true; 
    });

    const exportBtn = document.querySelector('button[onclick="exportToExcel()"]');
    if (exportBtn) exportBtn.disabled = currentFilteredRequests.length === 0;

    const totalItems = currentFilteredRequests.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    renderAdminPagination(totalPages);

    if (totalItems === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><i class="bi bi-inbox fs-2"></i><br>Нет заявок по данному фильтру</td></tr>';
        return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRequests = currentFilteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    paginatedRequests.forEach(req => {
        const id = req.Id || req.id;
        const userName = req.UserName || req.userName;
        const cropName = req.CropName || req.cropName;
        const desiredDate = req.DesiredDate || req.desiredDate;
        
        const weight = req.Weight || req.weight;
        const moisture = req.Moisture || req.moisture || '-';
        const weediness = req.Weediness || req.weediness || '-';
        
        const fWeight = req.FactWeight || req.factWeight;
        const fMoist = req.FactMoisture || req.factMoisture;
        const fWeed = req.FactWeediness || req.factWeediness;
        
        const displayWeight = fWeight ? `<span class="text-success">${fWeight}т (факт)</span>` : `${weight}т (план)`;
        const displayMoist = fMoist ? `<span class="text-success">${fMoist}%</span>` : `${moisture}%`;
        const displayWeed = fWeed ? `<span class="text-success">${fWeed}%</span>` : `${weediness}%`;

        const currentStatusName = req.StatusName || req.statusName;
        const currentStageName = req.StageName || req.stageName || 'Не начат';
        const dateStr = new Date(desiredDate).toLocaleDateString('ru-RU');

        const currentStatusId = parseInt(statusesList.find(x => (x.name || x.Name) === currentStatusName)?.id || statusesList.find(x => (x.name || x.Name) === currentStatusName)?.Id || 1);
        const currentStageId = parseInt(stagesList.find(x => (x.name || x.Name) === currentStageName)?.id || stagesList.find(x => (x.name || x.Name) === currentStageName)?.Id || 1);

        let statusSelect = `<select class="form-select admin-select border-secondary" id="status_sel_${id}" onchange="syncSelects(${id}, 'status')">`;
        statusesList.forEach(s => {
            const sName = s.name || s.Name;
            const sId = parseInt(s.id || s.Id);
            
            const disableStr = (sId < currentStatusId && sId !== 6) ? 'disabled' : '';
            statusSelect += `<option value="${sId}" ${sName === currentStatusName ? 'selected' : ''} ${disableStr}>${sName}</option>`;
        });
        statusSelect += `</select>`;

        let stageSelect = `<select class="form-select admin-select border-secondary" id="stage_sel_${id}" onchange="syncSelects(${id}, 'stage')">`;
        stagesList.forEach(s => {
            const sName = s.name || s.Name;
            const sId = parseInt(s.id || s.Id);
            
            const disableStr = (sId < currentStageId) ? 'disabled' : '';
            stageSelect += `<option value="${sId}" ${sName === currentStageName ? 'selected' : ''} ${disableStr}>${sName}</option>`;
        });
        stageSelect += `</select>`;

        const rowClass = (currentStatusName === 'Новая') ? 'row-new-request' : '';
        const paymentStatus = req.PaymentStatus || req.paymentStatus || 'Не рассчитано';
        let actionButtons = `<button class="btn btn-success btn-sm fw-bold shadow-sm d-block w-100 mb-1" onclick="saveRow(${id})">Применить</button>`;
        actionButtons += `<button class="btn btn-outline-info btn-sm fw-bold w-100 mt-1" onclick="openHistoryModal(${id})"><i class="bi bi-clock-history"></i> Журнал</button>`;
        if (paymentStatus === 'Не рассчитано') {
            const hasLabData = (fMoist !== null && fMoist !== undefined) && (fWeed !== null && fWeed !== undefined);
            const isFinishedProcessing = currentStageName === 'Выгружен в силос';

            if (hasLabData && isFinishedProcessing) {
                actionButtons += `<button class="btn btn-warning btn-sm fw-bold shadow-sm d-block w-100 text-dark" onclick="openCalcModal(${id})"><i class="bi bi-cash"></i> Выставить счет</button>`;
            } else if (!hasLabData) {
                actionButtons += `<button class="btn btn-secondary btn-sm fw-bold shadow-sm d-block w-100 disabled" style="opacity: 0.6;" disabled title="Ждем данные лаборатории"><i class="bi bi-hourglass-split"></i> Ждем лабу</button>`;
            } else {
                actionButtons += `<button class="btn btn-secondary btn-sm fw-bold shadow-sm d-block w-100 disabled" style="opacity: 0.6;" disabled title="Зерно в процессе сушки/очистки"><i class="bi bi-gear-wide-connected"></i> Идет обработка</button>`;
            }
        } else if (paymentStatus === 'Ожидает оплаты') {
            actionButtons += `<div class="badge bg-warning text-dark w-100 mt-1">Ожидает оплаты</div>`;
        } else if (paymentStatus === 'Оплачено') {
            actionButtons += `<div class="badge bg-success w-100 mt-1">Оплачено</div>`;
        }

        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td class="fw-bold text-muted">№${id}</td>
                <td class="fw-bold text-wrap" style="max-width: 200px;">${userName}</td>
                <td>${dateStr}</td>
                <td class="text-wrap" style="max-width: 150px;">${cropName}</td>
                <td class="small">
                    <strong>${displayWeight}</strong><br>
                    <span class="text-muted">Вл: ${displayMoist} | Ср: ${displayWeed}</span>
                </td>
                <td>${statusSelect}</td>
                <td>${stageSelect}</td>
                <td>${actionButtons}</td>
            </tr>`;
    });
}

function renderAdminPagination(totalPages) {
    const pag = document.getElementById('adminPagination');
    if (!pag) return;
    pag.innerHTML = '';
    if (totalPages <= 1) return;

    pag.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeAdminPage(${currentPage - 1}); return false;">Пред.</a></li>`;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    if (startPage > 1) {
        pag.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changeAdminPage(1); return false;">1</a></li>`;
        if (startPage > 2) pag.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        pag.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="changeAdminPage(${i}); return false;">${i}</a></li>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pag.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        pag.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changeAdminPage(${totalPages}); return false;">${totalPages}</a></li>`;
    }

    pag.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeAdminPage(${currentPage + 1}); return false;">След.</a></li>`;
}

window.changeAdminPage = function(page) {
    currentPage = page;
    renderAdminTable();
};

window.exportToExcel = function() {
    if (currentFilteredRequests.length === 0) return alert('Нет данных для выгрузки!');

    let csvContent = "\uFEFF№ Заявки;Контрагент;Дата завоза;Культура;Вес (План);Влажн. (План);Сорн. (План);Вес (Факт);Влажн. (Факт);Сорн. (Факт);Статус;Этап на элеваторе\n";

    currentFilteredRequests.forEach(req => {
        const id = req.Id || req.id;
        const userName = req.UserName || req.userName;
        const dateStr = new Date(req.DesiredDate || req.desiredDate).toLocaleDateString('ru-RU');
        const cropName = req.CropName || req.cropName;
        
        const weight = `="${(req.Weight || req.weight || 0).toString().replace('.', ',')}"`;
        const moisture = `="${(req.Moisture || req.moisture || '').toString().replace('.', ',')}"`;
        const weediness = `="${(req.Weediness || req.weediness || '').toString().replace('.', ',')}"`;
        
        const fWeight = req.FactWeight || req.factWeight || '';
        const fMoist = req.FactMoisture || req.factMoisture || '';
        const fWeed = req.FactWeediness || req.factWeediness || '';
        
        const strFWeight = fWeight ? `="${fWeight.toString().replace('.', ',')}"` : '';
        const strFMoist = fMoist ? `="${fMoist.toString().replace('.', ',')}"` : '';
        const strFWeed = fWeed ? `="${fWeed.toString().replace('.', ',')}"` : '';

        const statusName = req.StatusName || req.statusName;
        const stageName = req.StageName || req.stageName || 'Не начат';
        
        const safeUserName = userName.replace(/;/g, ''); 

        csvContent += `${id};${safeUserName};${dateStr};${cropName};${weight};${moisture};${weediness};${strFWeight};${strFMoist};${strFWeed};${statusName};${stageName}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Реестр_Заявок_БХБ_${new Date().toLocaleDateString('ru-RU')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

let pendingSaveId = null;
let pendingSaveData = null;

window.saveRow = async function(id) {
    const statusId = parseInt(document.getElementById(`status_sel_${id}`).value);
    const stageId = parseInt(document.getElementById(`stage_sel_${id}`).value);

    if (statusId === 6) {
        pendingSaveId = id;
        pendingSaveData = { statusId: statusId, stageId: stageId, adminComment: '' };
        document.getElementById('rejectComment').value = '';
        const modal = new bootstrap.Modal(document.getElementById('rejectModal'));
        modal.show();
        return;
    }

    await performSave(id, { statusId: statusId, stageId: stageId, adminComment: null });
}

document.getElementById('confirmRejectBtn').addEventListener('click', async () => {
    const reason = document.getElementById('rejectComment').value.trim();
    if (!reason) return alert('Вам необходимо указать причину отказа!');
    
    pendingSaveData.adminComment = reason;
    bootstrap.Modal.getInstance(document.getElementById('rejectModal')).hide();
    
    await performSave(pendingSaveId, pendingSaveData);
});

async function performSave(id, payload) {
    try {
        const response = await fetch(`${API_URL}/Requests/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast(`Заявка №${id} обновлена!`);
            await loadAllRequests();
        } else {
            showToast('Ошибка сохранения!', true);
        }
    } catch (error) { showToast('Ошибка соединения.', true); }
}

let pendingCalcId = null;

window.openCalcModal = function(id) {
    pendingCalcId = id;
    document.getElementById('calcReqId').textContent = id;
    
    const req = allRequests.find(r => (r.Id || r.id) == id);
    
    let factsInfo = "";
    if (req.FactIntakeWeight || req.factIntakeWeight) factsInfo += `\nВес (Весовая): ${req.FactIntakeWeight || req.factIntakeWeight} т`;
    if (req.FactWeight || req.factWeight) {
        factsInfo += `\n[ЛАБОРАТОРИЯ]\nФакт. вес: ${req.FactWeight || req.factWeight} т\nФакт. влажность: ${req.FactMoisture || req.factMoisture}%\nФакт. сорность: ${req.FactWeediness || req.factWeediness}%`;
    }
    
    document.getElementById('calcClientComment').textContent = ((req.Comments || req.comments) || 'Комментариев нет') + factsInfo;
    
    document.getElementById('calcServicesTable').innerHTML = '';
    document.getElementById('calcTotalSumText').textContent = '0.00 ₽';

    const fWeight = parseFloat(req.FactWeight || req.factWeight || 0);
    const fMoist = parseFloat(req.FactMoisture || req.factMoisture || 0);
    const fWeed = parseFloat(req.FactWeediness || req.factWeediness || 0);

    const crop = globalCropsList.find(c => (c.name || c.Name) === (req.CropName || req.cropName));
    const baseMoist = crop ? parseFloat(crop.baseMoisture || crop.BaseMoisture) : 14;
    const baseWeed = crop ? parseFloat(crop.baseWeediness || crop.BaseWeediness) : 2;

    const getServiceId = (namePart) => {
        const s = globalServicesList.find(x => (x.name || x.Name).toLowerCase().includes(namePart));
        return s ? (s.id || s.Id) : null;
    };

    let addedServices = false;

    if (fWeight > 0) {
        const srvIntake = getServiceId('приемка');
        if (srvIntake) { addCalcServiceRow(srvIntake, fWeight); addedServices = true; }

        if (fMoist > baseMoist) {
            const srvDry = getServiceId('сушка');
            if (srvDry) { addCalcServiceRow(srvDry, fWeight * (fMoist - baseMoist)); addedServices = true; }
        }

        if (fWeed > baseWeed) {
            const srvClean = getServiceId('очистка');
            if (srvClean) { addCalcServiceRow(srvClean, fWeight * (fWeed - baseWeed)); addedServices = true; }
        }

        if (req.RequestStorage || req.requestStorage) {
            const srvStorage = getServiceId('хранение');
            const days = parseInt(req.StorageDays || req.storageDays || 1);
            if (srvStorage) { addCalcServiceRow(srvStorage, fWeight * days); addedServices = true; }
        }

        if (req.RequestTrain || req.requestTrain) {
            const srvTrain = getServiceId('ж/д');
            if (srvTrain) { addCalcServiceRow(srvTrain, fWeight); addedServices = true; }
        }
    }

    if (!addedServices) addCalcServiceRow(); 

    recalcSum();
    new bootstrap.Modal(document.getElementById('calcModal')).show();
};

window.addCalcServiceRow = function(defaultSrvId = null, defaultVol = 0) {
    const tbody = document.getElementById('calcServicesTable');
    const tr = document.createElement('tr');
    
    let options = `<option value="" disabled ${!defaultSrvId ? 'selected' : ''}>Выберите...</option>`;
    globalServicesList.forEach(s => {
        const sId = s.id || s.Id;
        const isSel = (sId == defaultSrvId) ? 'selected' : '';
        options += `<option value="${sId}" data-price="${s.price || s.Price}" ${isSel}>${s.name || s.Name} (${s.price || s.Price}р)</option>`;
    });

    const volStr = defaultVol ? defaultVol.toFixed(2) : '0';

    tr.innerHTML = `
        <td><select class="form-select form-select-sm srv-select" onchange="recalcSum()">${options}</select></td>
        <td><input type="number" class="form-control form-control-sm srv-volume" min="0" step="0.1" value="${volStr}" oninput="recalcSum()"></td>
        <td><input type="number" class="form-control form-control-sm srv-sum" readonly value="0.00"></td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove(); recalcSum()"><i class="bi bi-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
};

window.recalcSum = function() {
    let total = 0;
    document.querySelectorAll('#calcServicesTable tr').forEach(tr => {
        const sel = tr.querySelector('.srv-select');
        const vol = parseFloat(tr.querySelector('.srv-volume').value) || 0;
        const price = parseFloat(sel.options[sel.selectedIndex]?.dataset?.price) || 0;
        
        const sum = vol * price;
        tr.querySelector('.srv-sum').value = sum.toFixed(2);
        total += sum;
    });
    document.getElementById('calcTotalSumText').textContent = total.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) + ' ₽';
    return total;
};

document.getElementById('confirmCalcBtn').addEventListener('click', async () => {
    const totalAmount = recalcSum();
    if (totalAmount <= 0) return alert('Сумма счета должна быть больше нуля!');
    
    const services = [];
    document.querySelectorAll('#calcServicesTable tr').forEach(tr => {
        const srvId = parseInt(tr.querySelector('.srv-select').value);
        const vol = parseFloat(tr.querySelector('.srv-volume').value) || 0;
        const sum = parseFloat(tr.querySelector('.srv-sum').value) || 0;
        if (srvId && vol > 0) services.push({ serviceId: srvId, volume: vol, sum: sum });
    });

    if (services.length === 0) return alert('Добавьте хотя бы одну услугу!');

    const btn = document.getElementById('confirmCalcBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';

    try {
        const res = await fetch(`${API_URL}/Requests/${pendingCalcId}/calculate`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalAmount: totalAmount, services: services })
        });
        
        if (res.ok) {
            showToast('Счет выставлен клиенту!');
            bootstrap.Modal.getInstance(document.getElementById('calcModal')).hide();
            await loadAllRequests();
            await loadFinanceStats();
        } else {
            const errData = await res.json();
            showToast(errData.message || 'Ошибка', true);
        }
    } catch (e) { showToast('Ошибка сети', true); } 
    finally { btn.disabled = false; btn.textContent = 'Сохранить и выставить счет'; }
});

document.getElementById('confirmCalcBtn').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('calcTotalAmount').value);
    if (isNaN(amount) || amount <= 0) return alert('Введите корректную сумму больше нуля!');
    
    const btn = document.getElementById('confirmCalcBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';

    try {
        const res = await fetch(`${API_URL}/Requests/${pendingCalcId}/calculate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalAmount: amount })
        });
        
        if (res.ok) {
            showToast('Счет успешно выставлен!');
            bootstrap.Modal.getInstance(document.getElementById('calcModal')).hide();
            await loadAllRequests();
            await loadFinanceStats();
        } else {
            const errData = await res.json();
            showToast(errData.message || 'Ошибка при выставлении счета', true);
        }
    } catch (e) { showToast('Ошибка сети', true); } 
    finally {
        btn.disabled = false;
        btn.textContent = 'Сохранить и выставить счет';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    const updateIcon = (theme) => {
        toggleBtn.innerHTML = theme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
    };
    updateIcon(localStorage.getItem('theme') || 'light');
    toggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
        
        if (typeof Chart !== 'undefined' && typeof renderAdminCharts === 'function') {
            Chart.defaults.color = newTheme === 'dark' ? '#dee2e6' : '#666';
            renderAdminCharts();
        }
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

window.syncSelects = function(id, changedElement) {
    const statusSel = document.getElementById(`status_sel_${id}`);
    const stageSel = document.getElementById(`stage_sel_${id}`);
    const statusId = parseInt(statusSel.value);
    const stageId = parseInt(stageSel.value);

    if (changedElement === 'status') {
        if (statusId === 1) stageSel.value = 1;
        else if (statusId === 2 && stageId < 2) stageSel.value = 1; 
        else if (statusId === 3) stageSel.value = 2; 
        else if (statusId === 5) stageSel.value = 7;
    } else if (changedElement === 'stage') {
        if (stageId === 1 && statusId !== 6) statusSel.value = 2; 
        else if (stageId === 2 && statusId !== 6) statusSel.value = 3; 
        else if (stageId >= 3 && stageId <= 7) {
            if (statusId !== 5 && statusId !== 6) statusSel.value = 4; 
        }
    }
};

window.openHistoryModal = async function(id) {
    document.getElementById('historyReqId').textContent = id;
    const list = document.getElementById('historyList');
    list.innerHTML = '<div class="text-center"><span class="spinner-border spinner-border-sm text-secondary"></span></div>';
    new bootstrap.Modal(document.getElementById('historyModal')).show();

    try {
        const res = await fetch(`${API_URL}/Requests/${id}/history`);
        const history = await res.json();
        list.innerHTML = '';
        if(history.length === 0) list.innerHTML = '<li class="list-group-item text-muted text-center">История пуста</li>';
        
        history.forEach(h => {
            const date = new Date(h.date || h.Date).toLocaleString('ru-RU');
            list.innerHTML += `
                <li class="list-group-item px-0">
                    <div class="d-flex justify-content-between">
                        <span class="fw-bold text-dark">${h.action || h.Action}</span>
                        <small class="text-muted">${date}</small>
                    </div>
                    <small class="d-block text-secondary mt-1">${h.text || h.Text}</small>
                </li>`;
        });
    } catch(e) { list.innerHTML = '<li class="list-group-item text-danger">Ошибка загрузки</li>'; }
};