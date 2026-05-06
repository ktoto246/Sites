const API_URL = 'http://localhost:5009/api'; 
const currentUserName = localStorage.getItem('userName');

let statusesList = [];
let stagesList = [];
let allRequests = [];
let currentFilter = 'all';
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

// Переменные для графиков
let cropWeightChartInstance = null;
let statusChartInstance = null;
let stageChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('userNameDisplay').textContent = currentUserName + ' (Диспетчер)';
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    await loadDictionaries();
    loadAllRequests();
    
    document.getElementById('searchName').addEventListener('input', renderAdminTable);

    setInterval(() => {
        if (document.querySelector('.modal.show') || document.querySelector('.admin-select:focus') || document.activeElement === document.getElementById('searchName')) return;
        loadAllRequests(false);
    }, 15000);

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        const updateIcon = (theme) => toggleBtn.innerHTML = theme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
        updateIcon(localStorage.getItem('theme') || 'light');
        toggleBtn.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
            
            // Перерисовываем графики при смене темы
            if (typeof Chart !== 'undefined' && typeof renderDispatcherCharts === 'function') {
                Chart.defaults.color = newTheme === 'dark' ? '#dee2e6' : '#666';
                renderDispatcherCharts();
            }
        });
    }
});

async function loadDictionaries() {
    try {
        const resStat = await fetch(`${API_URL}/References/statuses`);
        if (resStat.ok) statusesList = await resStat.json();
        
        const resStage = await fetch(`${API_URL}/References/stages`);
        if (resStage.ok) stagesList = await resStage.json();
    } catch (e) { console.error("Ошибка загрузки справочников", e); }
}

async function loadAllRequests(showSpinner = true) {
    const tbody = document.getElementById('adminTableBody');
    if (showSpinner) tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-success"></div></td></tr>';

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

        renderAdminTable();
        renderDispatcherCharts(); // Отрисовка графиков
    } catch (e) { console.error("Ошибка загрузки заявок", e); }
}

function renderDispatcherCharts() {
    const cropWeights = {};
    const statusCounts = {};
    const stageCounts = {};

    allRequests.forEach(req => {
        // Тоннаж
        const c = req.CropName || req.cropName || 'Неизвестна';
        const weight = parseFloat(req.FactWeight || req.factWeight || req.Weight || req.weight || 0);
        cropWeights[c] = (cropWeights[c] || 0) + weight;

        // Статусы
        const s = req.StatusName || req.statusName || 'Неизвестно';
        statusCounts[s] = (statusCounts[s] || 0) + 1;

        // Этапы
        const st = req.StageName || req.stageName || 'Не начат';
        stageCounts[st] = (stageCounts[st] || 0) + 1;
    });

    // График 1: Тоннаж (Bar)
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
            options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } } }
        });
    }

    // График 2: Этапы (Horizontal Bar)
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
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } } }
        });
    }

    // График 3: Статусы (Doughnut)
    const sCtx = document.getElementById('statusChart');
    if (sCtx) {
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(sCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#0d6efd', '#ffc107', '#198754', '#dc3545', '#0dcaf0', '#6c757d']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, animation: false }
        });
    }
}

window.setAdminFilter = function(filterType, btn) {
    currentFilter = filterType;
    currentPage = 1;
    btn.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAdminTable();
};

function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = ''; 

    const filtered = allRequests.filter(req => {
        const status = req.StatusName || req.statusName;
        const nameQuery = document.getElementById('searchName').value.toLowerCase();
        const userName = (req.UserName || req.userName || '').toLowerCase();
        
        if (nameQuery && !userName.includes(nameQuery)) return false;
        if (currentFilter === 'new') return status === 'Новая';
        if (currentFilter === 'active') return status !== 'Новая' && status !== 'Выполнена' && status !== 'Отклонена';
        return true; 
    });

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Нет заявок</td></tr>';
        return;
    }

    paginated.forEach(req => {
        const id = req.Id || req.id;
        const dateStr = new Date(req.DesiredDate || req.desiredDate).toLocaleDateString('ru-RU');
        const comments = req.Comments || req.comments || '';
        
        const currentStatusName = req.StatusName || req.statusName;
        const currentStageName = req.StageName || req.stageName;

        const fWeight = req.FactWeight || req.factWeight;
        const fMoist = req.FactMoisture || req.factMoisture;
        const fWeed = req.FactWeediness || req.factWeediness;
        const displayWeight = fWeight ? `<span class="text-success">${fWeight}т (факт)</span>` : `${req.Weight || req.weight}т (план)`;
        const displayMoist = fMoist ? `<span class="text-success">${fMoist}%</span>` : `${req.Moisture || req.moisture || '-'}%`;
        const displayWeed = fWeed ? `<span class="text-success">${fWeed}%</span>` : `${req.Weediness || req.weediness || '-'}%`;

        let statusSel = `<select class="form-select form-select-sm admin-select border-secondary bg-light" id="status_sel_${id}" disabled>`;
        statusesList.forEach(s => {
            const sName = s.name || s.Name;
            const sId = s.id || s.Id;
            statusSel += `<option value="${sId}" ${sName === currentStatusName ? 'selected' : ''}>${sName}</option>`;
        });
        statusSel += `</select>`;

        let stageSel = `<select class="form-select form-select-sm admin-select border-secondary" id="stage_sel_${id}" onchange="syncSelects(${id}, 'stage')">`;
        stagesList.forEach(s => {
            const sName = s.name || s.Name;
            const sId = s.id || s.Id;
            stageSel += `<option value="${sId}" ${sName === currentStageName ? 'selected' : ''}>${sName}</option>`;
        });
        stageSel += `</select>`;

        let extraServicesHtml = '';
        if (req.RequestStorage || req.requestStorage) extraServicesHtml += `<span class="badge bg-info text-dark d-block mt-1">Хранение (${req.StorageDays || req.storageDays} дн.)</span>`;
        if (req.RequestTrain || req.requestTrain) extraServicesHtml += `<span class="badge bg-secondary d-block mt-1">Ж/Д отгрузка</span>`;

        const isNew = currentStatusName === 'Новая';

        let actionBtn = `<button class="btn btn-success btn-sm fw-bold shadow-sm w-100 mb-1" onclick="saveRow(${id})">Применить</button>`;

        if (currentStageName === 'Взвешивание (брутто)') {
            actionBtn += `<button class="btn btn-warning btn-sm fw-bold shadow-sm w-100 mb-1" onclick="openWeighingModal(${id}, ${req.Weight || 0})"><i class="bi bi-truck"></i> Завесить</button>`;
        }

        if (currentStageName === 'Лаборатория (Анализ)') {
            const baseWeight = req.FactIntakeWeight || req.factIntakeWeight || req.Weight || req.weight || 0;
            actionBtn += `<button class="btn btn-info btn-sm fw-bold shadow-sm w-100" onclick="openLabModal(${id}, ${baseWeight}, ${req.Moisture || 0}, ${req.Weediness || 0})"><i class="bi bi-droplet"></i> Данные Лабы</button>`;
        }

        if (currentStatusName === 'Выполнена' || currentStatusName === 'Отклонена') {
            actionBtn = `<span class="badge bg-secondary w-100">Закрыта</span>`;
        }

        tbody.innerHTML += `
            <tr class="${isNew ? 'row-new-request' : ''}">
                <td class="fw-bold text-muted">№${id}</td>
                <td class="fw-bold text-wrap" style="max-width: 200px;">${req.UserName || req.userName}</td>
                <td><div class="fw-bold">${dateStr}</div><small class="text-muted text-wrap d-block" style="max-width: 250px;">${comments}</small></td>
                <td><div class="text-wrap fw-semibold" style="max-width: 150px;">${req.CropName || req.cropName}</div>${extraServicesHtml}</td>
                <td class="small"><strong>${displayWeight}</strong><br><span class="text-muted">Вл: ${displayMoist} | Ср: ${displayWeed}</span></td>
                <td>${statusSel}</td>
                <td>${stageSel}</td>
                <td>${actionBtn}</td>
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

window.saveRow = async function(id) {
   const req = allRequests.find(r => (r.Id || r.id) == id);
    const statusId = parseInt(document.getElementById(`status_sel_${id}`).value);
   const stageId = parseInt(document.getElementById(`stage_sel_${id}`).value);

   const currentStageName = req.StageName || req.stageName;

   if (currentStageName === 'Взвешивание (брутто)' && stageId > 3) {
        if (!req.FactIntakeWeight && !req.factIntakeWeight) {
            alert("ОШИБКА: Нельзя перейти дальше без фиксации веса на весовой!");
            return;
        }
    }

    if (currentStageName === 'Лаборатория (Анализ)' && stageId > 4) {
        if (!req.FactWeight && !req.factWeight) {
            alert("ОШИБКА: Нельзя завершить этап без ввода данных анализа (влага/сор)!");
            return;
        }
    }

    if (statusId === 5 || statusId === 6) {
        alert("У вас нет прав на установку этого статуса! Оставьте это менеджеру.");
        return;
    }

    if (stageId >= 4 && (!req.FactIntakeWeight && !req.factIntakeWeight)) {
        alert("Ошибка: Сначала зафиксируйте вес на весовой (Брутто)!");
        return;
    }

    if (stageId >= 5 && (!req.FactWeight && !req.factWeight)) {
        alert("Ошибка: Сначала внесите показатели Лаборатории (Анализ)!");
        return;
    }

    await performSave(id, { statusId: statusId, stageId: stageId, adminComment: null });
}

async function performSave(id, payload) {
    try {
        const res = await fetch(`${API_URL}/Requests/${id}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast(`Заявка №${id} обновлена!`);
            await loadAllRequests();
        } else showToast('Ошибка сохранения', true);
    } catch (e) { showToast('Ошибка сети', true); }
}

window.showToast = function(msg, err = false) {
    const box = document.getElementById('toastContainer');
    box.innerHTML = `<div class="toast show align-items-center text-bg-${err ? 'danger' : 'success'} border-0" role="alert"><div class="d-flex"><div class="toast-body fw-bold">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`;
    setTimeout(() => box.innerHTML = '', 3000);
}

let pendingLabId = null;

window.openLabModal = function(id, clientWeight, clientMoisture, clientWeediness) {
    pendingLabId = id;
    document.getElementById('labWeight').value = clientWeight;
    document.getElementById('labMoisture').value = clientMoisture;
    document.getElementById('labWeediness').value = clientWeediness;
    new bootstrap.Modal(document.getElementById('labModal')).show();
};

document.getElementById('saveLabBtn').addEventListener('click', async () => {
    const w = parseFloat(document.getElementById('labWeight').value);
    const m = parseFloat(document.getElementById('labMoisture').value);
    const weed = parseFloat(document.getElementById('labWeediness').value);

    if (!w || w <= 0) return alert('Введите корректный фактический вес!');

    try {
        const res = await fetch(`${API_URL}/Requests/${pendingLabId}/lab`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factWeight: w, factMoisture: m, factWeediness: weed })
        });
        if (res.ok) {
            showToast('Данные лаборатории сохранены!');
            bootstrap.Modal.getInstance(document.getElementById('labModal')).hide();
            await loadAllRequests();
        } else showToast('Ошибка сохранения', true);
    } catch (e) { showToast('Ошибка сети', true); }
});

let pendingWeighingId = null;

window.openWeighingModal = function(id, declaredWeight) {
    pendingWeighingId = id;
    document.getElementById('intakeWeight').value = declaredWeight; 
    new bootstrap.Modal(document.getElementById('weighingModal')).show();
};

document.getElementById('saveWeighingBtn').addEventListener('click', async () => {
    const w = parseFloat(document.getElementById('intakeWeight').value);
    if (!w || w <= 0) return alert('Введите корректный вес!');

    try {
        const res = await fetch(`${API_URL}/Requests/${pendingWeighingId}/weighing`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factIntakeWeight: w })
        });
        if (res.ok) {
            showToast('Вес на въезде зафиксирован!');
            bootstrap.Modal.getInstance(document.getElementById('weighingModal')).hide();
            await loadAllRequests();
        } else showToast('Ошибка сохранения', true);
    } catch (e) { showToast('Ошибка сети', true); }
});

window.syncSelects = function(id, changedElement) {
    const statusSel = document.getElementById(`status_sel_${id}`);
    const stageSel = document.getElementById(`stage_sel_${id}`);
    const statusId = parseInt(statusSel.value);
    const stageId = parseInt(stageSel.value);

    if (changedElement === 'status') {
        if (statusId === 1) stageSel.value = 1; 
        else if (statusId === 2 && stageId < 2) stageSel.value = 1; 
        else if (statusId === 3) stageSel.value = 2
        else if (statusId === 5) stageSel.value = 7;
    } else if (changedElement === 'stage') {
        if (stageId === 1 && statusId !== 6) statusSel.value = 2; 
        else if (stageId === 2 && statusId !== 6) statusSel.value = 3; 
        else if (stageId >= 3 && stageId <= 7) {
            if (statusId !== 5 && statusId !== 6) statusSel.value = 4; 
        }
    }
};