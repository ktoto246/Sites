import React, { useState } from 'react';
import { AppDatabase } from '../types';
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  Award,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface AnalyticsViewProps {
  db: AppDatabase;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ db }) => {
  // Aggregate stats per supplier
  const supplierStats = db.suppliers.map((sup) => {
    const batches = db.batches.filter((b) => b.supplierId === sup.id);
    let totalReceived = 0;
    let totalScrap = 0;
    let totalSecond = 0;
    let totalCulinary = 0;

    batches.forEach((b) => {
      totalReceived += b.receivedQuantity;
      const records = db.sortingRecords.filter((r) => r.batchId === b.id);
      records.forEach((r) => {
        totalScrap += r.qtyScrap;
        totalSecond += r.qtySecondGrade;
        totalCulinary += r.qtyCulinary;
      });
    });

    const defectRate = totalReceived > 0 ? (totalScrap / totalReceived) * 100 : 0;
    const markdownRate = totalReceived > 0 ? (totalSecond / totalReceived) * 100 : 0;

    let verdict = 'Отличный';
    let verdictColor = 'text-emerald-700 bg-emerald-50';
    if (defectRate > 3) {
      verdict = 'Претензионный';
      verdictColor = 'text-rose-700 bg-rose-50';
    } else if (defectRate > 1.5 || markdownRate > 10) {
      verdict = 'Усиленный контроль';
      verdictColor = 'text-amber-700 bg-amber-50';
    }

    return {
      supplier: sup,
      batchesCount: batches.length,
      totalReceived,
      totalScrap,
      totalSecond,
      totalCulinary,
      defectRate: defectRate.toFixed(2),
      markdownRate: markdownRate.toFixed(2),
      verdict,
      verdictColor,
    };
  });

  // Category stats
  const categoryStats = db.categories.map((cat) => {
    const prods = db.products.filter((p) => p.categoryId === cat.id);
    const prodIds = new Set(prods.map((p) => p.id));
    const batches = db.batches.filter((b) => prodIds.has(b.productId));

    let catVolume = 0;
    let catLossRub = 0;
    let catSavedRub = 0;

    batches.forEach((b) => {
      catVolume += b.receivedQuantity;
      const records = db.sortingRecords.filter((r) => r.batchId === b.id);
      records.forEach((r) => {
        catLossRub += r.lossAmountRub;
        catSavedRub += r.savedAmountRub;
      });
    });

    return {
      category: cat,
      volume: catVolume,
      lossRub: catLossRub,
      savedRub: catSavedRub,
    };
  });

  // Export report to CSV
  const handleExportCsv = () => {
    let csv = '\uFEFF'; // UTF-8 BOM for Russian characters in Excel
    csv += 'Поставщик;ИНН;Город;Партий;Объем (кг);Брак (кг);% Брака;Уценка (кг);Статус качества\n';

    supplierStats.forEach((s) => {
      csv += `"${s.supplier.name}";"${s.supplier.inn}";"${s.supplier.city}";${s.batchesCount};${s.totalReceived};${s.totalScrap};${s.defectRate}%;${s.totalSecond};"${s.verdict}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otchet_kachestvo_postavschikov_semeiny.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                Служба контроля качества и логистики
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">Аналитический свод</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-1">
              Рейтинг надежности поставщиков и экономика сортировки
            </h2>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-semibold bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Экспорт отчета в Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Supplier Quality Evaluation Matrix */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Матрица качества входящих поставок по контрагентам
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Выявление недобросовестных поставщиков на основе объективных данных выбраковки
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-neutral-200">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-2xs">
              <tr>
                <th className="py-3 px-3">Контрагент / Поставщик</th>
                <th className="py-3 px-3">Город / ИНН</th>
                <th className="py-3 px-3 text-right">Поставлено (кг)</th>
                <th className="py-3 px-3 text-right">Выбраковано</th>
                <th className="py-3 px-3 text-right">% Брака</th>
                <th className="py-3 px-3 text-right">Уценка (2с)</th>
                <th className="py-3 px-3 text-center">Оценка ОТК</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {supplierStats.map((s) => (
                <tr key={s.supplier.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-3">
                    <span className="font-bold text-neutral-900 block">{s.supplier.name}</span>
                    <span className="text-neutral-500 text-2xs">Контакт: {s.supplier.contactPerson}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-neutral-600 font-mono text-2xs">
                    <div>{s.supplier.city}</div>
                    <div className="text-neutral-400">ИНН: {s.supplier.inn}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-bold text-neutral-900">
                    {s.totalReceived.toLocaleString('ru-RU')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-rose-700 font-semibold">
                    {s.totalScrap} кг
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-bold">
                    <span className={Number(s.defectRate) > 3 ? 'text-rose-700' : 'text-neutral-700'}>
                      {s.defectRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-amber-700 font-medium">
                    {s.totalSecond} кг
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-0.5 rounded text-2xs font-semibold ${s.verdictColor}`}>
                      {s.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Economics & Losses vs Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">
            Потери и спасение стоимости по категориям продукции
          </h3>

          <div className="space-y-3">
            {categoryStats.map((cat) => (
              <div key={cat.category.id} className="border border-neutral-200 rounded-lg p-3 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-neutral-900">{cat.category.name}</span>
                  <span className="font-mono text-neutral-500">{cat.volume} кг</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-100 text-2xs font-mono">
                  <div className="text-rose-700">
                    Списание: <strong>-{cat.lossRub.toLocaleString('ru-RU')} ₽</strong>
                  </div>
                  <div className="text-emerald-700 text-right">
                    Спасено: <strong>+{cat.savedRub.toLocaleString('ru-RU')} ₽</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Economic justification */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">
            Обоснование экономической выгоды сортировки в гипермаркете
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            При отсутствии организованного АРМ сортировки некондиционный товар либо в полном объеме списывался на утилизацию, либо попадал на полки, вызывая отток покупателей и штрафы Роспотребнадзора.
          </p>

          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-600">Традиционная схема (Без АРМ):</span>
              <span className="font-bold text-rose-700">Прямой убыток 100% от брака</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Схема «Семейный» (С сортировкой):</span>
              <span className="font-bold text-emerald-700">Сохранение до 74% стоимости партии</span>
            </div>
            <div className="border-t border-neutral-200 pt-2 text-2xs text-neutral-500">
              * Достигается за счет калибровки, уценки 2-го сорта на 40% и перенаправления зрелых фруктов/овощей в цех собственной кулинарии гипермаркета.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
