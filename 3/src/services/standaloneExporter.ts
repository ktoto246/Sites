import { AppDatabase } from '../types';

/**
 * Generates an entirely self-contained single .html file
 * that can be double-clicked in any browser offline.
 * Clean enterprise interface without student/coursework meta-labels.
 */
export function generateStandaloneHtml(db: AppDatabase): string {
  const dbJson = JSON.stringify(db);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Гипермаркет «Семейный» — АРМ Сортировки и Учета Продукции</title>
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-hover: #1e40af;
      --accent: #059669;
      --warning: #d97706;
      --danger: #dc2626;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      line-height: 1.5;
    }
    .header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 17px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
    }
    .nav-tabs {
      display: flex;
      gap: 4px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;
    }
    .nav-btn {
      padding: 7px 13px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 500;
      font-size: 13px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .nav-btn.active {
      background: #ffffff;
      color: var(--text-main);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-weight: 600;
    }
    .container {
      max-width: 1400px;
      margin: 24px auto;
      padding: 0 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px 20px;
    }
    .stat-label { font-size: 12.5px; color: var(--text-muted); margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 700; font-family: monospace; }
    .stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }
    th, td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: #f8fafc;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .text-right { text-align: right; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 15px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-outline { background: #fff; border-color: var(--border); color: var(--text-main); }
    .btn-outline:hover { background: #f8fafc; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-first { background: #dcfce7; color: #166534; }
    .badge-second { background: #fef3c7; color: #92400e; }
    .badge-culinary { background: #e0e7ff; color: #3730a3; }
    .badge-scrap { background: #fee2e2; color: #991b1b; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text-main); }
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13.5px;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .barcode-box {
      font-family: monospace;
      font-size: 18px;
      letter-spacing: 3px;
      background: #0f172a;
      color: #fff;
      padding: 6px 14px;
      display: inline-block;
      border-radius: 4px;
    }
    .printable-act {
      background: #fff;
      border: 1px solid #cbd5e1;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      font-family: 'Times New Roman', serif;
    }
    @media print {
      body { background: #fff !important; }
      .header, .nav-tabs, .btn, .no-print { display: none !important; }
      .container { max-width: 100%; margin: 0; padding: 0; }
      .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
      .tab-content { display: block !important; }
      .printable-act { border: none !important; padding: 0 !important; width: 100% !important; }
    }
  </style>
</head>
<body>

  <header class="header">
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
      <span>Гипермаркет «Семейный»</span>
      <span style="font-size: 13px; font-weight: 400; color: #64748b;">· Учет и сортировка</span>
    </div>

    <nav class="nav-tabs no-print">
      <button class="nav-btn active" onclick="switchTab('dashboard')">Сводка</button>
      <button class="nav-btn" onclick="switchTab('sorting')">АРМ Сортировщика</button>
      <button class="nav-btn" onclick="switchTab('batches')">Партии и приёмка</button>
      <button class="nav-btn" onclick="switchTab('products')">Каталог товаров (SKU)</button>
      <button class="nav-btn" onclick="switchTab('acts')">Акты ТОРГ-15/16</button>
      <button class="nav-btn" onclick="switchTab('barcodes')">Штрихкоды и ценники</button>
      <button class="nav-btn" onclick="switchTab('analytics')">Аналитика качества</button>
    </nav>

    <div class="no-print" style="display: flex; gap: 10px; align-items: center;">
      <select id="user-role-select" class="form-control" style="width: auto; padding: 5px 8px; font-size: 12px;" onchange="onRoleChanged()">
        <option value="Иванов Алексей Сергеевич|Старший товаровед">Иванов А.С. (Товаровед)</option>
        <option value="Смирнова Елена Васильевна|Оператор сортировочной линии">Смирнова Е.В. (Сортировщик)</option>
        <option value="Ковалев Дмитрий Михайлович|Контролер ОТК">Ковалев Д.М. (ОТК)</option>
      </select>
      <button class="btn btn-primary" onclick="switchTab('sorting')">+ Сортировка</button>
    </div>
  </header>

  <main class="container">

    <!-- TAB: DASHBOARD -->
    <div id="tab-dashboard" class="tab-content active">
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; color: #1e3a8a;">
        <strong>Справочная информация по бизнес-логике:</strong><br>
        • <strong>1-й сорт:</strong> продукция высшего качества, выкладывается в торговый зал по полной цене.<br>
        • <strong>2-й сорт (уценка -40%):</strong> мелкие потертости или зрелые плоды, продаются по желтому ценнику (спасают выручку вместо списания в мусор).<br>
        • <strong>Кулинария:</strong> передача в цех гипермаркета на выпечку и салаты.<br>
        • <strong>Акты ТОРГ-16 и ТОРГ-15:</strong> унифицированные бланки РФ для законного списания брака и переоценки товара.
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Отсортировано продукции</div>
          <div class="stat-value" id="kpi-total">1 050 кг</div>
          <div class="stat-sub">За учетный период</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Выход 1-го сорта (Кондиция)</div>
          <div class="stat-value" style="color: var(--accent);" id="kpi-first-rate">84.8%</div>
          <div class="stat-sub">Прямая выкладка на полки</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Выручка от уценки и кулинарии</div>
          <div class="stat-value" style="color: var(--warning);" id="kpi-second">95 кг</div>
          <div class="stat-sub">Сохранено от списания в мусор</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Списание брака (ТОРГ-16)</div>
          <div class="stat-value" style="color: var(--danger);" id="kpi-scrap">17 кг</div>
          <div class="stat-sub">Утилизировано по актам</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Очередь партий на входной контроль и калибровку</span>
          <button class="btn btn-outline" onclick="switchTab('batches')">Все партии →</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Партия / ТТН</th>
              <th>Товар</th>
              <th>Поставщик</th>
              <th>Объем</th>
              <th>Срок годности</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody id="dashboard-batches-body"></tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Последние проведенные сортировки</span>
          <button class="btn btn-outline" onclick="switchTab('acts')">Все акты →</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Партия</th>
              <th>Сортировщик</th>
              <th>1-й сорт</th>
              <th>2-й сорт</th>
              <th>Кулинария</th>
              <th>Брак</th>
              <th>Финансовый итог</th>
            </tr>
          </thead>
          <tbody id="dashboard-sorting-body"></tbody>
        </table>
      </div>
    </div>

    <!-- TAB: PRODUCTS CATALOG (SKU & PRICING) -->
    <div id="tab-products" class="tab-content">
      <div class="card">
        <div class="card-title">
          <span>Справочник товаров (SKU) и управление ценами</span>
          <button class="btn btn-primary" onclick="showAddProductModal()">+ Добавить товар</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Артикул / Штрихкод</th>
              <th>Наименование</th>
              <th>Категория</th>
              <th>Закупка (Себестоимость)</th>
              <th>Розничная цена (Полка)</th>
              <th>Условия хранения</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody id="products-table-body"></tbody>
        </table>
      </div>
    </div>

    <!-- TAB: SORTING STATION -->
    <div id="tab-sorting" class="tab-content">
      <div class="card">
        <div class="card-title">АРМ Сортировщика — Распределение партий и проверка баланса</div>

        <form id="sorting-form" onsubmit="handleSortingSubmit(event)">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Выберите поступившую партию</label>
              <select id="sort-batch-select" class="form-control" onchange="onBatchSelected()">
                <!-- Populated by JS -->
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ответственный оператор / ОТК</label>
              <select id="sort-employee-select" class="form-control">
                <!-- Populated by JS -->
              </select>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 14px; border-radius: 8px; margin-bottom: 20px;" id="selected-batch-info">
            <!-- Details of batch -->
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">Распределение объема по категориям качества:</h4>
            
            <div class="grid-3" style="margin-bottom: 12px;">
              <div class="form-group">
                <label class="form-label" style="color: #166534; font-weight: 600;">1-й сорт (Кондиция на полки)</label>
                <input type="number" step="0.1" id="input-first" class="form-control" value="0" oninput="calculateBalance()">
              </div>
              <div class="form-group">
                <label class="form-label" style="color: #92400e; font-weight: 600;">2-й сорт (Уценка -40%)</label>
                <input type="number" step="0.1" id="input-second" class="form-control" value="0" oninput="calculateBalance()">
              </div>
              <div class="form-group">
                <label class="form-label" style="color: #3730a3; font-weight: 600;">В кулинарию (Переработка)</label>
                <input type="number" step="0.1" id="input-culinary" class="form-control" value="0" oninput="calculateBalance()">
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" style="color: #991b1b; font-weight: 600;">Брак / Списание (ТОРГ-16)</label>
                <input type="number" step="0.1" id="input-scrap" class="form-control" value="0" oninput="calculateBalance()">
              </div>
              <div class="form-group">
                <label class="form-label">Возврат поставщику (Претензия)</label>
                <input type="number" step="0.1" id="input-return" class="form-control" value="0" oninput="calculateBalance()">
              </div>
            </div>
          </div>

          <!-- Live Balance Box -->
          <div id="balance-box" style="padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; background: #e0f2fe; border: 1px solid #bae6fd;">
            <!-- JS updates this -->
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Причина отбраковки / характер дефектов</label>
              <input type="text" id="input-reason" class="form-control" placeholder="Механические потертости, спелость..." required>
            </div>
            <div class="form-group">
              <label class="form-label">Размер скидки для 2-го сорта (%)</label>
              <input type="number" id="input-discount" class="form-control" value="40" min="10" max="80">
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn btn-outline" onclick="resetSortingForm()">Очистить</button>
            <button type="submit" id="btn-submit-sorting" class="btn btn-primary" disabled>Провести сортировку и сформировать акты</button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB: BATCHES -->
    <div id="tab-batches" class="tab-content">
      <div class="card">
        <div class="card-title">
          <span>Реестр поступивших партий</span>
          <button class="btn btn-primary" onclick="showNewBatchModal()">+ Принять партию по ТТН</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Номер партии / ТТН</th>
              <th>Товар</th>
              <th>Поставщик</th>
              <th>Объем</th>
              <th>Срок годности</th>
              <th>Зона размещения на складе</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody id="batches-table-body"></tbody>
        </table>
      </div>
    </div>

    <!-- TAB: ACTS -->
    <div id="tab-acts" class="tab-content">
      <div class="card no-print">
        <div class="card-title">
          <span>Акты уценки и списания (ТОРГ-15 / ТОРГ-16)</span>
          <button class="btn btn-outline" onclick="window.print()">Распечатать акт</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Номер акта</th>
              <th>Тип</th>
              <th>Дата</th>
              <th>Партия / Товар</th>
              <th>Количество</th>
              <th>Сумма ущерба</th>
              <th>Основание</th>
              <th>Просмотр</th>
            </tr>
          </thead>
          <tbody id="acts-table-body"></tbody>
        </table>
      </div>

      <div id="act-preview-container" class="printable-act" style="display: none;"></div>
    </div>

    <!-- TAB: BARCODES -->
    <div id="tab-barcodes" class="tab-content">
      <div class="card">
        <div class="card-title">Маркировочные термоэтикетки и штрихкоды сортов</div>
        <div id="stickers-container" class="grid-3"></div>
      </div>
    </div>

    <!-- TAB: ANALYTICS -->
    <div id="tab-analytics" class="tab-content">
      <div class="card">
        <div class="card-title">Рейтинг надежности поставщиков по браку</div>
        <table>
          <thead>
            <tr>
              <th>Поставщик</th>
              <th>Город</th>
              <th>Объем (кг)</th>
              <th>Брак (кг)</th>
              <th>% Брака</th>
              <th>Оценка качества</th>
            </tr>
          </thead>
          <tbody id="analytics-table-body"></tbody>
        </table>
      </div>
    </div>

  </main>

  <script>
    let DB = ${dbJson};
    const LOCAL_KEY = 'semeiny_supermarket_sort_db_v1';
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.products) DB = parsed;
      }
    } catch(e) {}

    function saveDB() {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(DB));
      } catch(e) {}
      renderAll();
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');

      const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick').includes(tabId));
      if (btn) btn.classList.add('active');

      if (tabId === 'sorting') {
        populateSortingSelects();
      }
    }

    function renderAll() {
      renderDashboard();
      renderProducts();
      renderBatches();
      renderActs();
      renderBarcodes();
      renderAnalytics();
    }

    function renderDashboard() {
      let totalQty = 0;
      let firstQty = 0;
      let secondQty = 0;
      let scrapQty = 0;

      DB.sortingRecords.forEach(r => {
        totalQty += r.qtyTotal;
        firstQty += r.qtyFirstGrade;
        secondQty += r.qtySecondGrade + r.qtyCulinary;
        scrapQty += r.qtyScrap;
      });

      const firstRate = totalQty > 0 ? ((firstQty / totalQty) * 100).toFixed(1) : '0';

      document.getElementById('kpi-total').textContent = totalQty.toLocaleString() + ' кг';
      document.getElementById('kpi-first-rate').textContent = firstRate + '%';
      document.getElementById('kpi-second').textContent = secondQty.toLocaleString() + ' кг';
      document.getElementById('kpi-scrap').textContent = scrapQty.toLocaleString() + ' кг';

      const batchBody = document.getElementById('dashboard-batches-body');
      batchBody.innerHTML = '';
      const pendingBatches = DB.batches.filter(b => b.status !== 'completed').slice(0, 5);

      if (pendingBatches.length === 0) {
        batchBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8;">Все поступившие партии отсортированы</td></tr>';
      } else {
        pendingBatches.forEach(b => {
          const prod = DB.products.find(p => p.id === b.productId);
          const sup = DB.suppliers.find(s => s.id === b.supplierId);
          const tr = document.createElement('tr');
          tr.innerHTML = \`
            <td><strong>\${b.batchNumber}</strong><br><small style="color:#64748b;">\${b.ttnNumber}</small></td>
            <td>\${prod ? prod.name : 'Товар'}</td>
            <td>\${sup ? sup.name : 'Поставщик'}</td>
            <td><strong>\${b.receivedQuantity} \${prod ? prod.unit : 'кг'}</strong></td>
            <td>\${b.expirationDate}</td>
            <td><span class="badge badge-second">\${b.status === 'in_progress' ? 'В процессе' : 'Ожидает'}</span></td>
            <td><button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="startSortForBatch('\${b.id}')">Сортировка</button></td>
          \`;
          batchBody.appendChild(tr);
        });
      }

      const sortBody = document.getElementById('dashboard-sorting-body');
      sortBody.innerHTML = '';
      DB.sortingRecords.slice(0, 5).forEach(r => {
        const batch = DB.batches.find(b => b.id === r.batchId);
        const prod = batch ? DB.products.find(p => p.id === batch.productId) : null;
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${r.date}</td>
          <td><strong>\${batch ? batch.batchNumber : ''}</strong><br><small style="color:#64748b;">\${prod ? prod.name : ''}</small></td>
          <td>\${r.sorterName}</td>
          <td><span class="badge badge-first">\${r.qtyFirstGrade} \${prod ? prod.unit : ''}</span></td>
          <td><span class="badge badge-second">\${r.qtySecondGrade} \${prod ? prod.unit : ''}</span></td>
          <td><span class="badge badge-culinary">\${r.qtyCulinary} \${prod ? prod.unit : ''}</span></td>
          <td><span class="badge badge-scrap">\${r.qtyScrap} \${prod ? prod.unit : ''}</span></td>
          <td>
            <div style="font-size:11.5px; color:var(--danger)">Списание: -\${r.lossAmountRub} ₽</div>
            <div style="font-size:11.5px; color:var(--accent)">Спасено: +\${r.savedAmountRub} ₽</div>
          </td>
        \`;
        sortBody.appendChild(tr);
      });
    }

    function renderProducts() {
      const tbody = document.getElementById('products-table-body');
      tbody.innerHTML = '';
      DB.products.forEach(p => {
        const cat = DB.categories.find(c => c.id === p.categoryId);
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td><strong>\${p.code}</strong><br><small style="color:#64748b;">\${p.barcode}</small></td>
          <td><strong>\${p.name}</strong></td>
          <td>\${cat ? cat.name : ''}</td>
          <td>\${p.costPrice} ₽ / \${p.unit}</td>
          <td><strong style="color:var(--primary); font-size:15px;">\${p.retailPrice} ₽ / \${p.unit}</strong></td>
          <td><small>\${p.temperature}, срок: \${p.shelfLifeDays} дн.</small></td>
          <td><button class="btn btn-outline" style="padding:4px 8px; font-size:11.5px;" onclick="editProductPrice('\${p.id}')">Изменить цену</button></td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function editProductPrice(prodId) {
      const p = DB.products.find(x => x.id === prodId);
      if (!p) return;
      const newPrice = prompt('Введите новую розничную цену для «' + p.name + '» (руб):', p.retailPrice);
      if (newPrice && !isNaN(newPrice)) {
        p.retailPrice = Number(newPrice);
        saveDB();
      }
    }

    function showAddProductModal() {
      const name = prompt('Введите наименование нового товара:');
      if (!name) return;
      const price = prompt('Введите розничную цену (руб):', '150');
      const cost = prompt('Введите закупочную себестоимость (руб):', '90');
      const unit = prompt('Единица измерения (кг / шт / уп):', 'кг');

      const newP = {
        id: 'prod-' + Date.now(),
        code: 'СЕМ-' + Math.floor(100 + Math.random() * 900),
        barcode: '4607001' + Math.floor(100000 + Math.random() * 900000),
        name: name,
        categoryId: DB.categories[0].id,
        unit: unit || 'кг',
        shelfLifeDays: 14,
        temperature: '+2°C...+6°C',
        storageCondition: 'chilled',
        costPrice: Number(cost) || 90,
        retailPrice: Number(price) || 150,
        standardDefectTolerance: 3
      };
      DB.products.unshift(newP);
      saveDB();
    }

    function populateSortingSelects() {
      const batchSelect = document.getElementById('sort-batch-select');
      batchSelect.innerHTML = '<option value="">-- Выберите партию --</option>';
      DB.batches.forEach(b => {
        const prod = DB.products.find(p => p.id === b.productId);
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = \`\${b.batchNumber} — \${prod ? prod.name : ''} (\${b.receivedQuantity} \${prod ? prod.unit : 'кг'})\${b.status === 'completed' ? ' [Готово]' : ''}\`;
        batchSelect.appendChild(opt);
      });

      const empSelect = document.getElementById('sort-employee-select');
      empSelect.innerHTML = '';
      DB.employees.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.name;
        opt.textContent = \`\${e.name} (\${e.role})\`;
        empSelect.appendChild(opt);
      });

      onBatchSelected();
    }

    function onBatchSelected() {
      const batchId = document.getElementById('sort-batch-select').value;
      const infoBox = document.getElementById('selected-batch-info');
      const batch = DB.batches.find(b => b.id === batchId);

      if (!batch) {
        infoBox.innerHTML = '<div style="color:#64748b; font-size:13px;">Выберите партию выше для отображения данных накладной</div>';
        calculateBalance();
        return;
      }

      const prod = DB.products.find(p => p.id === batch.productId);
      const sup = DB.suppliers.find(s => s.id === batch.supplierId);

      infoBox.innerHTML = \`
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
          <div><span style="color:#64748b; font-size:12px;">Товар:</span> <strong>\${prod ? prod.name : ''}</strong></div>
          <div><span style="color:#64748b; font-size:12px;">Поставщик:</span> <strong>\${sup ? sup.name : ''}</strong></div>
          <div><span style="color:#64748b; font-size:12px;">По накладной:</span> <strong style="color:var(--primary); font-size:16px;">\${batch.receivedQuantity} \${prod ? prod.unit : 'кг'}</strong></div>
          <div><span style="color:#64748b; font-size:12px;">Зона:</span> <span>\${batch.storageZone}</span></div>
        </div>
      \`;

      calculateBalance();
    }

    function calculateBalance() {
      const batchId = document.getElementById('sort-batch-select').value;
      const batch = DB.batches.find(b => b.id === batchId);
      const targetQty = batch ? batch.receivedQuantity : 0;

      const f = parseFloat(document.getElementById('input-first').value) || 0;
      const s = parseFloat(document.getElementById('input-second').value) || 0;
      const c = parseFloat(document.getElementById('input-culinary').value) || 0;
      const sc = parseFloat(document.getElementById('input-scrap').value) || 0;
      const r = parseFloat(document.getElementById('input-return').value) || 0;

      const currentSum = Math.round((f + s + c + sc + r) * 100) / 100;
      const delta = Math.round((targetQty - currentSum) * 100) / 100;

      const box = document.getElementById('balance-box');
      const submitBtn = document.getElementById('btn-submit-sorting');

      if (!batch) {
        box.innerHTML = '<span>Выберите партию</span>';
        submitBtn.disabled = true;
        return;
      }

      if (Math.abs(delta) < 0.001) {
        box.style.background = '#dcfce7';
        box.style.borderColor = '#86efac';
        box.style.color = '#166534';
        box.innerHTML = \`<strong>✓ Баланс сошелся!</strong> Сумма: \${currentSum} кг из \${targetQty} кг. Разрешено проведение сортировки.\`;
        submitBtn.disabled = false;
      } else if (delta > 0) {
        box.style.background = '#fef3c7';
        box.style.borderColor = '#fde68a';
        box.style.color = '#92400e';
        box.innerHTML = \`<strong>Осталось распределить: \${delta} кг</strong> (Распределено \${currentSum} из \${targetQty} кг).\`;
        submitBtn.disabled = true;
      } else {
        box.style.background = '#fee2e2';
        box.style.borderColor = '#fca5a5';
        box.style.color = '#991b1b';
        box.innerHTML = \`<strong>Перебор на \${Math.abs(delta)} кг!</strong> Сумма превышает накладную.\`;
        submitBtn.disabled = true;
      }
    }

    function handleSortingSubmit(e) {
      e.preventDefault();
      const batchId = document.getElementById('sort-batch-select').value;
      const batch = DB.batches.find(b => b.id === batchId);
      if (!batch) return;

      const f = parseFloat(document.getElementById('input-first').value) || 0;
      const s = parseFloat(document.getElementById('input-second').value) || 0;
      const c = parseFloat(document.getElementById('input-culinary').value) || 0;
      const sc = parseFloat(document.getElementById('input-scrap').value) || 0;
      const r = parseFloat(document.getElementById('input-return').value) || 0;
      const reason = document.getElementById('input-reason').value;
      const discount = parseFloat(document.getElementById('input-discount').value) || 40;
      const employee = document.getElementById('sort-employee-select').value;

      const prod = DB.products.find(p => p.id === batch.productId);
      const cost = prod ? prod.costPrice : 100;
      const retail = prod ? prod.retailPrice : 150;

      const lossRub = Math.round(sc * cost);
      const savedRub = Math.round(s * (retail * (1 - discount / 100)) + c * (cost * 0.9));

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10) + ' ' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

      const newRecord = {
        id: 'sort-' + Date.now(),
        batchId: batch.id,
        date: dateStr,
        sorterName: employee,
        sorterRole: 'Оператор сортировки',
        qtyTotal: batch.receivedQuantity,
        qtyFirstGrade: f,
        qtySecondGrade: s,
        qtyCulinary: c,
        qtyScrap: sc,
        qtyReturn: r,
        scrapPercentage: ((sc / batch.receivedQuantity) * 100).toFixed(1),
        secondGradePercentage: ((s / batch.receivedQuantity) * 100).toFixed(1),
        culinaryPercentage: ((c / batch.receivedQuantity) * 100).toFixed(1),
        firstGradePercentage: ((f / batch.receivedQuantity) * 100).toFixed(1),
        defectReason: reason,
        markdownPercentage: discount,
        lossAmountRub: lossRub,
        savedAmountRub: savedRub,
        status: 'approved'
      };

      batch.status = 'completed';
      DB.sortingRecords.unshift(newRecord);

      if (sc > 0) {
        DB.qualityActs.unshift({
          id: 'act-' + Date.now() + '-16',
          actNumber: 'АКТ-ТОРГ16-' + (DB.qualityActs.length + 50),
          type: 'TORG-16',
          title: 'Акт о порче, бое, ломе товарно-материальных ценностей',
          date: now.toISOString().slice(0, 10),
          sortingRecordId: newRecord.id,
          batchNumber: batch.batchNumber,
          productName: prod ? prod.name : '',
          supplierName: 'Поставщик',
          totalQuantity: sc,
          unit: prod ? prod.unit : 'кг',
          scrapQuantity: sc,
          sumLossRub: lossRub,
          reason: reason,
          commission: [employee, 'Иванов А.С. (Старший товаровед)', 'Петрова О.Н. (Зав. складом)']
        });
      }

      if (s > 0) {
        DB.qualityActs.unshift({
          id: 'act-' + Date.now() + '-15',
          actNumber: 'АКТ-ТОРГ15-' + (DB.qualityActs.length + 25),
          type: 'TORG-15',
          title: 'Акт об уценке товарно-материальных ценностей',
          date: now.toISOString().slice(0, 10),
          sortingRecordId: newRecord.id,
          batchNumber: batch.batchNumber,
          productName: prod ? prod.name : '',
          supplierName: 'Поставщик',
          totalQuantity: s,
          unit: prod ? prod.unit : 'кг',
          markdownQuantity: s,
          oldPrice: retail,
          newPrice: Math.round(retail * (1 - discount / 100)),
          sumLossRub: Math.round(s * (retail * (discount / 100))),
          reason: 'Уценка: ' + reason,
          commission: [employee, 'Иванов А.С. (Старший товаровед)', 'Петрова О.Н. (Зав. складом)']
        });
      }

      saveDB();
      alert('Сортировка партии ' + batch.batchNumber + ' успешно зафиксирована! Акты сформированы.');
      switchTab('dashboard');
    }

    function resetSortingForm() {
      document.getElementById('input-first').value = 0;
      document.getElementById('input-second').value = 0;
      document.getElementById('input-culinary').value = 0;
      document.getElementById('input-scrap').value = 0;
      document.getElementById('input-return').value = 0;
      calculateBalance();
    }

    function startSortForBatch(batchId) {
      switchTab('sorting');
      document.getElementById('sort-batch-select').value = batchId;
      onBatchSelected();
    }

    function renderBatches() {
      const tbody = document.getElementById('batches-table-body');
      tbody.innerHTML = '';
      DB.batches.forEach(b => {
        const prod = DB.products.find(p => p.id === b.productId);
        const sup = DB.suppliers.find(s => s.id === b.supplierId);
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td><strong>\${b.batchNumber}</strong><br><small style="color:#64748b;">\${b.ttnNumber}</small></td>
          <td>\${prod ? prod.name : ''}</td>
          <td>\${sup ? sup.name : ''}</td>
          <td><strong>\${b.receivedQuantity} \${prod ? prod.unit : 'кг'}</strong></td>
          <td>\${b.expirationDate}</td>
          <td><small>\${b.storageZone}</small></td>
          <td><span class="badge \${b.status === 'completed' ? 'badge-first' : 'badge-second'}">\${b.status === 'completed' ? 'Рассортировано' : 'Ожидает'}</span></td>
          <td>\${b.status !== 'completed' ? \`<button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="startSortForBatch('\${b.id}')">Сортировка</button>\` : \`<span style="color:#166534; font-size:12px;">Готово</span>\`}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function showNewBatchModal() {
      const ttn = prompt('Введите номер ТТН / накладной:', 'ТТН-2026-' + Math.floor(1000 + Math.random() * 9000));
      if (!ttn) return;
      const qty = prompt('Количество поступившего товара (кг):', '450');
      const zone = prompt('Зона размещения на складе (выберите из списка):\\n1. Зона ФРОВ №1 (Холодильная камера A-1, +2°C...+4°C)\\n2. Холодильный склад гастрономии\\n3. Мясной цех (Пандус №4)', 'Зона ФРОВ №1 (Холодильная камера A-1, +2°C...+4°C)');

      const newB = {
        id: 'batch-' + Date.now(),
        batchNumber: 'ПАРТ-2026-' + (DB.batches.length + 101),
        ttnNumber: ttn,
        productId: DB.products[0].id,
        supplierId: DB.suppliers[0].id,
        incomingDate: new Date().toISOString().slice(0, 10),
        expirationDate: '2026-11-28',
        receivedQuantity: Number(qty) || 450,
        status: 'pending',
        storageZone: zone || 'Зона ФРОВ №1 (Холодильная камера A-1)'
      };
      DB.batches.unshift(newB);
      saveDB();
    }

    function renderActs() {
      const tbody = document.getElementById('acts-table-body');
      tbody.innerHTML = '';
      DB.qualityActs.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td><strong>\${a.actNumber}</strong></td>
          <td><span class="badge \${a.type === 'TORG-16' ? 'badge-scrap' : 'badge-second'}">\${a.type}</span></td>
          <td>\${a.date}</td>
          <td>\${a.productName} (\${a.batchNumber})</td>
          <td>\${a.totalQuantity} \${a.unit}</td>
          <td><strong>\${a.sumLossRub.toLocaleString()} ₽</strong></td>
          <td><small>\${a.reason}</small></td>
          <td><button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="viewAct('\${a.id}')">Просмотр</button></td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function viewAct(actId) {
      const act = DB.qualityActs.find(a => a.id === actId);
      if (!act) return;
      const preview = document.getElementById('act-preview-container');
      preview.style.display = 'block';
      preview.innerHTML = \`
        <div style="text-align: right; font-size: 11px; margin-bottom: 20px;">
          Унифицированная форма № \${act.type}<br>
          Утверждена постановлением Госкомстата России
        </div>
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 6px;">\${act.title.toUpperCase()}</h2>
          <div style="font-size: 14px;">Номер документа: <strong>\${act.actNumber}</strong> от \${act.date} г.</div>
          <div style="font-size: 13px; color: #475569;">Организация: Гипермаркет «Семейный»</div>
        </div>
        <table style="margin-bottom: 24px; border: 1px solid #000;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="border: 1px solid #000;">Наименование товара</th>
              <th style="border: 1px solid #000;">Партия</th>
              <th style="border: 1px solid #000;">Количество</th>
              <th style="border: 1px solid #000;">Сумма (руб)</th>
              <th style="border: 1px solid #000;">Причина</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #000;">\${act.productName}</td>
              <td style="border: 1px solid #000;">\${act.batchNumber}</td>
              <td style="border: 1px solid #000;">\${act.totalQuantity} \${act.unit}</td>
              <td style="border: 1px solid #000;"><strong>\${act.sumLossRub.toLocaleString()} ₽</strong></td>
              <td style="border: 1px solid #000;">\${act.reason}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 30px;">
          <div style="font-weight: bold; margin-bottom: 10px;">Члены комиссии:</div>
          \${act.commission.map(c => \`<div style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span>\${c}</span> <span>________________ (подпись)</span></div>\`).join('')}
        </div>
        <div style="margin-top: 20px; text-align: right;" class="no-print">
          <button class="btn btn-primary" onclick="window.print()">Печать акта</button>
          <button class="btn btn-outline" onclick="document.getElementById('act-preview-container').style.display='none'">Закрыть</button>
        </div>
      \`;
      preview.scrollIntoView({ behavior: 'smooth' });
    }

    function renderBarcodes() {
      const container = document.getElementById('stickers-container');
      container.innerHTML = '';
      DB.products.slice(0, 6).forEach(p => {
        const div = document.createElement('div');
        div.className = 'stat-card';
        div.style.border = '2px dashed #cbd5e1';
        div.innerHTML = \`
          <div style="font-size:11px; color:#64748b; margin-bottom:4px;">ГИПЕРМАРКЕТ «СЕМЕЙНЫЙ»</div>
          <div style="font-weight:700; font-size:15px; margin-bottom:6px;">\${p.name}</div>
          <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
            <span>Арт: \${p.code}</span>
            <span class="badge badge-first">1-й сорт</span>
          </div>
          <div style="text-align:center; margin-bottom:12px;">
            <div class="barcode-box">||| \${p.barcode} |||</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:18px; font-weight:800; color:var(--primary);">\${p.retailPrice} ₽ / \${p.unit}</span>
            <button class="btn btn-outline" style="font-size:12px; padding:4px 8px;" onclick="window.print()">Печать</button>
          </div>
        \`;
        container.appendChild(div);
      });
    }

    function renderAnalytics() {
      const tbody = document.getElementById('analytics-table-body');
      tbody.innerHTML = '';
      DB.suppliers.forEach(s => {
        const batches = DB.batches.filter(b => b.supplierId === s.id);
        let total = 0;
        let scrap = 0;
        batches.forEach(b => {
          total += b.receivedQuantity;
          const recs = DB.sortingRecords.filter(r => r.batchId === b.id);
          recs.forEach(r => { scrap += r.qtyScrap; });
        });
        const rate = total > 0 ? ((scrap / total) * 100).toFixed(1) : '0';
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td><strong>\${s.name}</strong></td>
          <td>\${s.city}</td>
          <td>\${total} кг</td>
          <td style="color:var(--danger)">\${scrap} кг</td>
          <td><strong>\${rate}%</strong></td>
          <td><span class="badge \${Number(rate) > 3 ? 'badge-scrap' : 'badge-first'}">\${Number(rate) > 3 ? 'Претензия' : 'Надежный'}</span></td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function onRoleChanged() {
      const val = document.getElementById('user-role-select').value;
      const parts = val.split('|');
      alert('Авторизован сотрудник: ' + parts[0] + ' (' + parts[1] + ')');
    }

    window.addEventListener('DOMContentLoaded', () => {
      renderAll();
    });
  </script>
</body>
</html>`;
}
