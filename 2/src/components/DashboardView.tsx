import React from 'react';
import { AppDatabase } from '../types';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from './Header';

interface DashboardViewProps {
  db: AppDatabase;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectBatchForSorting: (batchId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  setActiveTab,
  onSelectBatchForSorting,
}) => {

  // Compute analytics
  let totalVolumeKg = 0;
  let firstGradeKg = 0;
  let secondGradeKg = 0;
  let culinaryKg = 0;
  let scrapKg = 0;
  let totalLossRub = 0;
  let totalSavedRub = 0;

  db.sortingRecords.forEach((r) => {
    totalVolumeKg += r.qtyTotal;
    firstGradeKg += r.qtyFirstGrade;
    secondGradeKg += r.qtySecondGrade;
    culinaryKg += r.qtyCulinary;
    scrapKg += r.qtyScrap;
    totalLossRub += r.lossAmountRub;
    totalSavedRub += r.savedAmountRub;
  });

  const firstGradeRate =
    totalVolumeKg > 0 ? ((firstGradeKg / totalVolumeKg) * 100).toFixed(1) : '0';
  const scrapRate =
    totalVolumeKg > 0 ? ((scrapKg / totalVolumeKg) * 100).toFixed(1) : '0';

  const pendingBatches = db.batches.filter((b) => b.status !== 'completed');
  const recentRecords = db.sortingRecords.slice(0, 5);

  return (
    <div className="space-y-6">

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Volume */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Отсортировано продукции</span>
            <ClipboardList className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
              {totalVolumeKg.toLocaleString('ru-RU')}
            </span>
            <span className="text-xs text-neutral-500 font-medium">кг / ед.</span>
          </div>
          <div className="mt-2 text-xs text-neutral-600">
            Партий принято: <span className="font-mono font-medium">{db.batches.length}</span>
          </div>
        </div>

        {/* KPI 2: First Grade Yield */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Выход 1-го сорта (Кондиция)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-700">
              {firstGradeRate}%
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              ({firstGradeKg.toLocaleString('ru-RU')} кг)
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">
            Прямая выкладка в торговый зал
          </div>
        </div>

        {/* KPI 3: Saved Revenue (Prevrashchenny ubytok) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">
              Выручка от уценки и кулинарии
            </span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
              +{totalSavedRub.toLocaleString('ru-RU')}
            </span>
            <span className="text-xs text-neutral-500 font-medium">₽</span>
          </div>
          <div className="mt-2 text-xs text-neutral-600">
            Сохранено от списания в мусор (<span className="font-mono">{secondGradeKg + culinaryKg} кг</span>)
          </div>
        </div>

        {/* KPI 4: Scrap Losses */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Списание брака (Убыток)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-rose-700">
              {totalLossRub.toLocaleString('ru-RU')}
            </span>
            <span className="text-xs text-neutral-500 font-medium">₽</span>
          </div>
          <div className="mt-2 text-xs text-rose-700">
            Утилизировано: <span className="font-mono">{scrapKg} кг</span> ({scrapRate}%)
          </div>
        </div>
      </div>

      {/* Main Grid: Batches Queue & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queue for Quality Inspection & Sorting */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Очередь партий на входной контроль и сортировку
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Поступившие с рампы партии, требующие калибровки и распределения по сортам
              </p>
            </div>
            <button
              onClick={() => setActiveTab('batches')}
              className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1"
            >
              Все партии ({db.batches.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingBatches.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-500">
              Все поступившие партии успешно рассортированы.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {pendingBatches.map((batch) => {
                const product = db.products.find((p) => p.id === batch.productId);
                const supplier = db.suppliers.find((s) => s.id === batch.supplierId);

                return (
                  <div
                    key={batch.id}
                    className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-50/70 rounded-lg px-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-neutral-900">
                          {batch.batchNumber}
                        </span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-xs text-neutral-600 font-mono">
                          {batch.ttnNumber}
                        </span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-xs font-medium text-neutral-700">
                          {product?.name || 'Товар'}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-2">
                        <span>{supplier?.name}</span>
                        <span>·</span>
                        <span>Годен до: {batch.expirationDate}</span>
                        <span>·</span>
                        <span className="text-neutral-600 truncate max-w-xs">{batch.storageZone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-neutral-900 block">
                          {batch.receivedQuantity} {product?.unit}
                        </span>
                        <span className="text-xs text-amber-700">Ожидает проверки</span>
                      </div>
                      <button
                        onClick={() => onSelectBatchForSorting(batch.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap"
                      >
                        Сортировать
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Fast Launch & Operational Guide */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-neutral-900">Быстрые операции</h3>

            <button
              onClick={() => setActiveTab('sorting')}
              className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-neutral-900 group-hover:text-blue-900 block">
                  АРМ Сортировщика
                </span>
                <span className="text-xs text-neutral-500">
                  Взвешивание, контроль баланса массы, отбраковка
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-neutral-900 group-hover:text-blue-900 block">
                  Каталог товаров и цены (SKU)
                </span>
                <span className="text-xs text-neutral-500">
                  Добавление номенклатуры, смена цен и артикулов
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('acts')}
              className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-neutral-900 group-hover:text-blue-900 block">
                  Печать актов списания (ТОРГ-16)
                </span>
                <span className="text-xs text-neutral-500">
                  Унифицированные формы РФ с подписями комиссии
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('barcodes')}
              className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-neutral-900 group-hover:text-blue-900 block">
                  Генератор штрихкодов и ценников
                </span>
                <span className="text-xs text-neutral-500">
                  Желтые ценники «Уценка -40%» и стикеры 1-го сорта
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sorting Protocol History */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Журнал проведенных сортировок продукции
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Фиксация распределения по сортам, ответственные сотрудники и финансовый результат
            </p>
          </div>
          <button
            onClick={() => setActiveTab('sorting')}
            className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1"
          >
            В рабочее место сортировщика
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-neutral-200">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-2xs">
              <tr>
                <th className="py-2.5 px-3">Дата / Время</th>
                <th className="py-2.5 px-3">Партия / Товар</th>
                <th className="py-2.5 px-3">Сортировщик</th>
                <th className="py-2.5 px-3 text-right">1-й сорт</th>
                <th className="py-2.5 px-3 text-right">2-й сорт (уценка)</th>
                <th className="py-2.5 px-3 text-right">В кулинарию</th>
                <th className="py-2.5 px-3 text-right">Брак (списание)</th>
                <th className="py-2.5 px-3 text-right">Ущерб / Спасено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentRecords.map((r) => {
                const batch = db.batches.find((b) => b.id === r.batchId);
                const prod = batch ? db.products.find((p) => p.id === batch.productId) : null;

                return (
                  <tr key={r.id} className="hover:bg-neutral-50/70">
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-neutral-600">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-neutral-900 font-mono">
                        {batch?.batchNumber}
                      </span>
                      <span className="text-neutral-500 block text-2xs">
                        {prod?.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-neutral-700">
                      {r.sorterName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700">
                      {r.qtyFirstGrade} {prod?.unit} ({r.firstGradePercentage}%)
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-medium text-amber-700">
                      {r.qtySecondGrade} {prod?.unit} ({r.secondGradePercentage}%)
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-medium text-indigo-700">
                      {r.qtyCulinary} {prod?.unit} ({r.culinaryPercentage}%)
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono font-medium text-rose-700">
                      {r.qtyScrap} {prod?.unit} ({r.scrapPercentage}%)
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono">
                      <div className="text-rose-700 text-2xs">
                        -{r.lossAmountRub.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-emerald-700 font-semibold">
                        +{r.savedAmountRub.toLocaleString('ru-RU')} ₽
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
