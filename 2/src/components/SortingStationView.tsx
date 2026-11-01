import React, { useState, useEffect } from 'react';
import { AppDatabase, Batch, Product } from '../types';
import { storage } from '../services/storage';
import {
  Scale,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
  FileText,
  RotateCcw,
  Sliders,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab } from './Header';

interface SortingStationViewProps {
  db: AppDatabase;
  selectedBatchId?: string;
  setActiveTab: (tab: ActiveTab) => void;
  onViewAct: (actId: string) => void;
  currentEmployee?: { name: string; role: string };
}

export const SortingStationView: React.FC<SortingStationViewProps> = ({
  db,
  selectedBatchId,
  setActiveTab,
  onViewAct,
  currentEmployee,
}) => {
  const [currentBatchId, setCurrentBatchId] = useState<string>(
    selectedBatchId || (db.batches.find((b) => b.status !== 'completed')?.id || db.batches[0]?.id || '')
  );

  useEffect(() => {
    if (selectedBatchId) {
      setCurrentBatchId(selectedBatchId);
    }
  }, [selectedBatchId]);

  // Selected batch & product
  const batch = db.batches.find((b) => b.id === currentBatchId);
  const product = batch ? db.products.find((p) => p.id === batch.productId) : null;
  const supplier = batch ? db.suppliers.find((s) => s.id === batch.supplierId) : null;

  // Sorting Inputs
  const [qtyFirst, setQtyFirst] = useState<number>(0);
  const [qtySecond, setQtySecond] = useState<number>(0);
  const [qtyCulinary, setQtyCulinary] = useState<number>(0);
  const [qtyScrap, setQtyScrap] = useState<number>(0);
  const [qtyReturn, setQtyReturn] = useState<number>(0);

  const [defectReason, setDefectReason] = useState<string>('Механические повреждения при транспортировке');
  const [markdownPercentage, setMarkdownPercentage] = useState<number>(40);
  const [sorterName, setSorterName] = useState<string>(
    currentEmployee?.name || db.employees[1]?.name || db.employees[0]?.name || ''
  );

  useEffect(() => {
    if (currentEmployee?.name) {
      setSorterName(currentEmployee.name);
    }
  }, [currentEmployee?.name]);
  const [comments, setComments] = useState<string>('');

  // Barcode search simulation
  const [barcodeQuery, setBarcodeQuery] = useState<string>('');
  const [barcodeSearchMessage, setBarcodeSearchMessage] = useState<string | null>(null);

  // Success result modal
  const [completedResult, setCompletedResult] = useState<{
    recordId: string;
    actsCreated: { id: string; actNumber: string; type: string }[];
  } | null>(null);

  const totalBatchQty = batch?.receivedQuantity || 0;
  const currentSum = Math.round((qtyFirst + qtySecond + qtyCulinary + qtyScrap + qtyReturn) * 100) / 100;
  const delta = Math.round((totalBatchQty - currentSum) * 100) / 100;
  const isBalanceValid = Math.abs(delta) < 0.001 && totalBatchQty > 0;

  // Reset inputs when switching batch
  useEffect(() => {
    if (batch) {
      // Initialize with reasonable initial distribution if batch is new
      setQtyFirst(0);
      setQtySecond(0);
      setQtyCulinary(0);
      setQtyScrap(0);
      setQtyReturn(0);
      setComments('');
      setCompletedResult(null);
    }
  }, [currentBatchId]);

  // Presets
  const applyPreset = (type: 'ideal' | 'standard' | 'high_defect') => {
    if (!batch) return;
    const total = batch.receivedQuantity;
    if (type === 'ideal') {
      setQtyFirst(total);
      setQtySecond(0);
      setQtyCulinary(0);
      setQtyScrap(0);
      setQtyReturn(0);
      setDefectReason('Партия соответствует высшей категории качества (100% кондиция)');
    } else if (type === 'standard') {
      const first = Math.round(total * 0.86);
      const second = Math.round(total * 0.08);
      const cul = Math.round(total * 0.04);
      const scrap = total - (first + second + cul);
      setQtyFirst(first);
      setQtySecond(second);
      setQtyCulinary(cul);
      setQtyScrap(scrap);
      setQtyReturn(0);
      setDefectReason('Незначительные повреждения кожуры при транспортировке, отбор плодов на дозревание');
    } else if (type === 'high_defect') {
      const first = Math.round(total * 0.65);
      const second = Math.round(total * 0.15);
      const cul = Math.round(total * 0.1);
      const scrap = total - (first + second + cul);
      setQtyFirst(first);
      setQtySecond(second);
      setQtyCulinary(cul);
      setQtyScrap(scrap);
      setQtyReturn(0);
      setDefectReason('Пересортица, нарушение температурного режима при доставке, очаги гниения');
    }
  };

  // Barcode scanner simulator
  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;

    const foundProduct = db.products.find(
      (p) => p.barcode === barcodeQuery.trim() || p.code.toLowerCase() === barcodeQuery.trim().toLowerCase()
    );

    if (foundProduct) {
      const matchBatch = db.batches.find((b) => b.productId === foundProduct.id && b.status !== 'completed');
      if (matchBatch) {
        setCurrentBatchId(matchBatch.id);
        setBarcodeSearchMessage(`✓ Найдена партия ${matchBatch.batchNumber} для товара "${foundProduct.name}"`);
      } else {
        const anyBatch = db.batches.find((b) => b.productId === foundProduct.id);
        if (anyBatch) {
          setCurrentBatchId(anyBatch.id);
          setBarcodeSearchMessage(`Товар "${foundProduct.name}" найден (партия ${anyBatch.batchNumber})`);
        }
      }
    } else {
      setBarcodeSearchMessage('Товар с таким штрихкодом не найден в базе данных');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !isBalanceValid) return;

    const employee = db.employees.find((emp) => emp.name === sorterName);

    try {
      const { record, actsCreated } = storage.recordSorting({
        batchId: batch.id,
        sorterName,
        sorterRole: employee?.role || 'Сортировщик / ОТК',
        qtyFirstGrade: qtyFirst,
        qtySecondGrade: qtySecond,
        qtyCulinary,
        qtyScrap,
        qtyReturn,
        defectReason,
        markdownPercentage,
        comments,
      });

      setCompletedResult({
        recordId: record.id,
        actsCreated: actsCreated.map((a) => ({ id: a.id, actNumber: a.actNumber, type: a.type })),
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка проведения сортировки');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                АРМ Сортировщика №2
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">Участок калибровки и входного контроля</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-1">
              Электронный протокол сортировки партии
            </h2>
          </div>

          {/* Barcode scanner simulator box */}
          <form onSubmit={handleBarcodeSearch} className="flex items-center gap-2">
            <div className="relative">
              <Barcode className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Штрихкод (например 4607001001012)..."
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg w-64 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Сканировать
            </button>
          </form>
        </div>

        {barcodeSearchMessage && (
          <div className="mt-2 text-xs font-medium text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md flex items-center justify-between">
            <span>{barcodeSearchMessage}</span>
            <button
              onClick={() => setBarcodeSearchMessage(null)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Sorting Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Sorter Station */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-6">
            {/* Step 1: Batch & Operator Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  1. Выберите партию на сортировку
                </label>
                <select
                  value={currentBatchId}
                  onChange={(e) => setCurrentBatchId(e.target.value)}
                  className="w-full text-xs font-medium border border-neutral-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {db.batches.map((b) => {
                    const prod = db.products.find((p) => p.id === b.productId);
                    const isDone = b.status === 'completed';
                    return (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} — {prod?.name} ({b.receivedQuantity} {prod?.unit}) {isDone ? ' [Готово]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  2. Ответственный оператор / ОТК
                </label>
                <select
                  value={sorterName}
                  onChange={(e) => setSorterName(e.target.value)}
                  className="w-full text-xs font-medium border border-neutral-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {db.employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.role}, {emp.shift})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Batch Info Card */}
            {batch && product && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block">Товарная позиция:</span>
                  <span className="font-bold text-neutral-900">{product.name}</span>
                  <span className="text-neutral-400 block font-mono text-2xs">Штрихкод: {product.barcode}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Поставщик:</span>
                  <span className="font-semibold text-neutral-800">{supplier?.name}</span>
                  <span className="text-neutral-500 block text-2xs">ТТН: {batch.ttnNumber}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Объем партии:</span>
                  <span className="text-base font-bold font-mono text-blue-900">
                    {batch.receivedQuantity} {product.unit}
                  </span>
                  <span className="text-neutral-500 block text-2xs">Зона: {batch.storageZone}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Срок годности:</span>
                  <span className="font-medium text-neutral-800 font-mono">{batch.expirationDate}</span>
                  <span className="text-neutral-500 block text-2xs">Режим: {product.temperature}</span>
                </div>
              </div>
            )}

            {/* Quick Presets Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                  Шаблоны экспресс-распределения:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('ideal')}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                >
                  100% Кондиция (1-й сорт)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('standard')}
                  className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Типовое (86% 1с / 8% 2с / 4% кул / 2% брак)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('high_defect')}
                  className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                >
                  Высокий брак (претензия поставщику)
                </button>
              </div>
            </div>

            {/* Step 2: Distribution by Quality Grades */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Распределение массы / количества по сортам
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1st Grade */}
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-900">1-й сорт (Кондиция)</label>
                    <span className="text-2xs font-mono text-emerald-700">
                      {totalBatchQty > 0 ? ((qtyFirst / totalBatchQty) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={qtyFirst || ''}
                      onChange={(e) => setQtyFirst(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-bold font-mono bg-white border border-emerald-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-neutral-600">{product?.unit}</span>
                  </div>
                  <span className="text-2xs text-emerald-800 mt-1 block">Выкладка в торговый зал</span>
                </div>

                {/* 2nd Grade / Markdown */}
                <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-amber-900">2-й сорт (Уценка)</label>
                    <span className="text-2xs font-mono text-amber-700">
                      {totalBatchQty > 0 ? ((qtySecond / totalBatchQty) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={qtySecond || ''}
                      onChange={(e) => setQtySecond(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-bold font-mono bg-white border border-amber-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-neutral-600">{product?.unit}</span>
                  </div>
                  <span className="text-2xs text-amber-800 mt-1 block">Скидка 40% (Акт ТОРГ-15)</span>
                </div>

                {/* Culinary Production */}
                <div className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-indigo-900">В кулинарию гипермаркета</label>
                    <span className="text-2xs font-mono text-indigo-700">
                      {totalBatchQty > 0 ? ((qtyCulinary / totalBatchQty) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={qtyCulinary || ''}
                      onChange={(e) => setQtyCulinary(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-bold font-mono bg-white border border-indigo-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-neutral-600">{product?.unit}</span>
                  </div>
                  <span className="text-2xs text-indigo-800 mt-1 block">Собственная выпечка / салаты</span>
                </div>
              </div>

              {/* Scrap & Return */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Scrap */}
                <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-rose-900">Брак / Порча (Списание)</label>
                    <span className="text-2xs font-mono text-rose-700">
                      {totalBatchQty > 0 ? ((qtyScrap / totalBatchQty) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={qtyScrap || ''}
                      onChange={(e) => setQtyScrap(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-bold font-mono bg-white border border-rose-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-neutral-600">{product?.unit}</span>
                  </div>
                  <span className="text-2xs text-rose-800 mt-1 block">Утилизация (Акт ТОРГ-16)</span>
                </div>

                {/* Return */}
                <div className="border border-neutral-200 bg-neutral-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-900">Возврат поставщику</label>
                    <span className="text-2xs font-mono text-neutral-600">
                      {totalBatchQty > 0 ? ((qtyReturn / totalBatchQty) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={qtyReturn || ''}
                      onChange={(e) => setQtyReturn(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-bold font-mono bg-white border border-neutral-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-neutral-600 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-neutral-600">{product?.unit}</span>
                  </div>
                  <span className="text-2xs text-neutral-600 mt-1 block">Отказ по накладной</span>
                </div>
              </div>
            </div>

            {/* Invariant Balance Validation Box */}
            <div
              className={`rounded-xl p-4 border transition-colors ${
                isBalanceValid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : delta > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isBalanceValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">
                      {isBalanceValid
                        ? 'Баланс массы партии сошелся на 100%'
                        : delta > 0
                        ? `Необходимо распределить еще ${delta} ${product?.unit}`
                        : `Превышение объема партии на ${Math.abs(delta)} ${product?.unit}!`}
                    </span>
                    <span className="text-2xs opacity-90">
                      Распределено: <span className="font-mono font-bold">{currentSum}</span> из{' '}
                      <span className="font-mono font-bold">{totalBatchQty}</span> {product?.unit}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-2xs block opacity-75">Погрешность:</span>
                  <span className="font-bold">{delta} {product?.unit}</span>
                </div>
              </div>
            </div>

            {/* Defect Reasons & Markdown Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Характер дефектов / Причина отбраковки
                </label>
                <input
                  type="text"
                  value={defectReason}
                  onChange={(e) => setDefectReason(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Опишите причину списания..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Процент уценки для 2-го сорта (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="70"
                    step="5"
                    value={markdownPercentage}
                    onChange={(e) => setMarkdownPercentage(Number(e.target.value))}
                    className="w-full accent-blue-900"
                  />
                  <span className="text-xs font-mono font-bold w-12 text-right">
                    {markdownPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Примечания и заключение бракеражной комиссии
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                placeholder="Сортировка завершена, партия опломбирована..."
                className="w-full text-xs border border-neutral-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setQtyFirst(0);
                  setQtySecond(0);
                  setQtyCulinary(0);
                  setQtyScrap(0);
                  setQtyReturn(0);
                }}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Сбросить ввод
              </button>

              <button
                type="submit"
                disabled={!isBalanceValid}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all ${
                  isBalanceValid
                    ? 'bg-blue-900 hover:bg-blue-800 text-white cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Зафиксировать сортировку и сформировать акты</span>
              </button>
            </div>
          </form>

          {/* Success Banner if sorting recorded */}
          {completedResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold">
                  Сортировка партии успешно проведена в локальной базе данных!
                </h4>
              </div>
              <p className="text-xs text-emerald-800">
                Баланс партии сошелся. Автоматически созданы регламентные акты гипермаркета:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {completedResult.actsCreated.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => {
                      onViewAct(act.id);
                      setActiveTab('acts');
                    }}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-950 text-xs font-semibold rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {act.type} ({act.actNumber})
                    </span>
                  </button>
                ))}

                <button
                  onClick={() => setActiveTab('barcodes')}
                  className="px-3 py-1.5 bg-emerald-900 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Печать маркировочных этикеток</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Instant Financial & Quality Calculation */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Экономический расчет текущей сортировки
            </h3>

            {product && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500">Себестоимость за ед.:</span>
                  <span className="font-mono font-medium text-neutral-800">
                    {product.costPrice} ₽ / {product.unit}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500">Розничная цена (1 сорт):</span>
                  <span className="font-mono font-medium text-neutral-800">
                    {product.retailPrice} ₽ / {product.unit}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500">Цена 2-го сорта (-{markdownPercentage}%):</span>
                  <span className="font-mono font-bold text-amber-800">
                    {(product.retailPrice * (1 - markdownPercentage / 100)).toFixed(1)} ₽ / {product.unit}
                  </span>
                </div>

                {/* Loss calculation */}
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                  <div className="flex justify-between items-center text-rose-900">
                    <span className="font-medium">Прямой ущерб (списание):</span>
                    <span className="font-mono font-bold text-sm">
                      -{(qtyScrap * product.costPrice).toFixed(0)} ₽
                    </span>
                  </div>
                  <span className="text-2xs text-rose-700 block mt-0.5">
                    {qtyScrap} {product.unit} × {product.costPrice} ₽ (по себестоимости)
                  </span>
                </div>

                {/* Saved Revenue calculation */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <div className="flex justify-between items-center text-emerald-900">
                    <span className="font-medium">Спасенная выручка:</span>
                    <span className="font-mono font-bold text-sm">
                      +
                      {(
                        qtySecond * (product.retailPrice * (1 - markdownPercentage / 100)) +
                        qtyCulinary * (product.costPrice * 0.9)
                      ).toFixed(0)}{' '}
                      ₽
                    </span>
                  </div>
                  <span className="text-2xs text-emerald-700 block mt-0.5">
                    Уценка {qtySecond} {product.unit} + Кулинария {qtyCulinary} {product.unit}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sorter Checklist */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Стандарт сортировки гипермаркета
            </h4>
            <ul className="text-xs text-neutral-600 space-y-2 list-disc list-inside">
              <li>
                <strong>1-й сорт:</strong> Без внешних повреждений, правильная калибровка, свежий запах, готов к выкладке.
              </li>
              <li>
                <strong>2-й сорт:</strong> Потеря глянца, царапины, легкая помятость, срок годности &gt; 2 дней.
              </li>
              <li>
                <strong>Кулинария:</strong> Высокая спелость, пригодно для термической обработки в тот же день.
              </li>
              <li>
                <strong>Брак:</strong> Следы гниения, плесень, посторонний химический запах — немедленная утилизация.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
