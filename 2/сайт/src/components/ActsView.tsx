import React, { useState } from 'react';
import { AppDatabase, QualityAct, Employee, getRolePermissions } from '../types';
import { storage } from '../services/storage';
import {
  FileText,
  Printer,
  FileCheck,
  FileWarning,
  Eye,
  CheckCircle,
  Building2,
  Calendar,
  Trash2,
} from 'lucide-react';

interface ActsViewProps {
  db: AppDatabase;
  activeActId?: string;
  onClearActiveAct?: () => void;
  currentEmployee: Employee;
}

export const ActsView: React.FC<ActsViewProps> = ({
  db,
  activeActId,
  onClearActiveAct,
  currentEmployee,
}) => {
  const permissions = getRolePermissions(currentEmployee.role);
  const [selectedActId, setSelectedActId] = useState<string>(
    activeActId || db.qualityActs[0]?.id || ''
  );
  const [filterType, setFilterType] = useState<string>('all');

  const selectedAct = db.qualityActs.find((a) => a.id === selectedActId);

  const filteredActs = db.qualityActs.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Hidden in print) */}
      <div className="no-print bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                Документооборот гипермаркета
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">Унифицированные формы РФ</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-1">
              Реестр актов уценки и списания (ТОРГ-15 / ТОРГ-16)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!selectedAct}
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Печать выбранного акта</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 pt-2 border-t border-neutral-100">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Все акты ({db.qualityActs.length})
          </button>
          <button
            onClick={() => setFilterType('TORG-16')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'TORG-16'
                ? 'bg-rose-900 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            ТОРГ-16 (Списание брака в убыток)
          </button>
          <button
            onClick={() => setFilterType('TORG-15')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === 'TORG-15'
                ? 'bg-amber-900 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            ТОРГ-15 (Акт уценки со скидкой)
          </button>
        </div>

        {/* Informative memo: What are these acts? */}
        <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 text-2xs text-neutral-600 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <strong className="text-rose-900 block mb-0.5">Зачем нужен Акт ТОРГ-16 (Списание брака):</strong>
            Сгнивший или разбитый товар закон запрещает продавать. Чтобы списать его себестоимость на убытки гипермаркета в бухгалтерии, комиссия (товаровед, зав. складом, контролер) подписывает унифицированную форму ТОРГ-16.
          </div>
          <div>
            <strong className="text-amber-900 block mb-0.5">Зачем нужен Акт ТОРГ-15 (Уценка товара):</strong>
            При переводе товара во 2-й сорт со скидкой 30–50% бухгалтер обязан зафиксировать старую цену, новую цену и разницу. Документ служит законным основанием для печати желтого ценника.
          </div>
        </div>
      </div>

      {/* Grid: Acts List + Official Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Acts List (Hidden in print) */}
        <div className="no-print lg:col-span-5 space-y-3">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Список сформированных актов
            </h3>

            <div className="space-y-2">
              {filteredActs.map((act) => {
                const isSelected = act.id === selectedActId;
                const is16 = act.type === 'TORG-16';

                return (
                  <div
                    key={act.id}
                    onClick={() => setSelectedActId(act.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-2xs ${
                            is16
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {act.type}
                        </span>
                        <span className="font-bold text-neutral-900 font-mono">
                          {act.actNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 font-mono text-2xs">{act.date}</span>
                        {permissions.canManageActs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Удалить акт «${act.actNumber}»?`)) {
                                storage.deleteAct(act.id);
                                if (selectedActId === act.id) {
                                  const remaining = filteredActs.filter((a) => a.id !== act.id);
                                  if (remaining[0]) setSelectedActId(remaining[0].id);
                                }
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                            title="Удалить акт"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="font-medium text-neutral-800 line-clamp-1">
                      {act.productName}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100/80 text-2xs">
                      <span className="text-neutral-500">
                        Объем: <strong className="text-neutral-700">{act.totalQuantity} {act.unit}</strong>
                      </span>
                      <span className="font-bold font-mono text-neutral-900">
                        {act.sumLossRub.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right / Full in Print: Official Document Viewport */}
        <div className="lg:col-span-7">
          {selectedAct ? (
            <div className="bg-white border border-neutral-300 rounded-xl p-8 sm:p-10 shadow-sm print:border-none print:p-0 print:shadow-none print-break-inside-avoid">
              {/* Official Header */}
              <div className="text-right text-3xs font-serif text-neutral-600 space-y-0.5 mb-6">
                <div>Унифицированная форма № {selectedAct.type}</div>
                <div>Утверждена постановлением Госкомстата России</div>
                <div>от 25.12.98 г. № 132</div>
              </div>

              <div className="border-b-2 border-neutral-900 pb-4 mb-6">
                <div className="text-xs uppercase tracking-wider text-neutral-500">
                  Организация:
                </div>
                <div className="text-base font-bold text-neutral-900 font-serif">
                  {db.settings.supermarketName}
                </div>
                <div className="text-xs text-neutral-600">
                  Адрес подразделения: {db.settings.branchAddress}
                </div>
                <div className="text-xs text-neutral-600">
                  Структурное подразделение: Участок сортировки и входного контроля
                </div>
              </div>

              {/* Title & Number */}
              <div className="text-center my-6 space-y-1">
                <h3 className="text-lg font-bold font-serif text-neutral-900 tracking-tight">
                  {selectedAct.title.toUpperCase()}
                </h3>
                <div className="text-sm font-serif">
                  Номер документа: <span className="font-mono font-bold">{selectedAct.actNumber}</span> от{' '}
                  <span className="font-bold">{selectedAct.date}</span> г.
                </div>
              </div>

              {/* Legal Notice */}
              <p className="text-xs font-serif leading-relaxed text-neutral-800 my-4 text-justify indent-6">
                Комиссия в составе нижеподписавшихся лиц произвела осмотр и органолептическую проверку качества продукции, поступившей по партии <span className="font-mono font-bold">{selectedAct.batchNumber}</span> от поставщика <span className="font-bold">{selectedAct.supplierName}</span>, и установила следующее:
              </p>

              {/* Document Data Table */}
              <div className="overflow-x-auto my-6">
                <table className="min-w-full text-xs border border-neutral-900 font-serif">
                  <thead className="bg-neutral-100 text-neutral-900 border-b border-neutral-900 font-bold text-center">
                    <tr>
                      <th className="border border-neutral-900 p-2">Наименование товара</th>
                      <th className="border border-neutral-900 p-2">Количество</th>
                      {selectedAct.type === 'TORG-15' ? (
                        <>
                          <th className="border border-neutral-900 p-2">Прежняя цена</th>
                          <th className="border border-neutral-900 p-2">Новая цена</th>
                          <th className="border border-neutral-900 p-2">Сумма уценки</th>
                        </>
                      ) : (
                        <th className="border border-neutral-900 p-2">Сумма списания</th>
                      )}
                      <th className="border border-neutral-900 p-2">Основание / Причина</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center">
                      <td className="border border-neutral-900 p-2.5 font-sans font-bold text-left">
                        {selectedAct.productName}
                      </td>
                      <td className="border border-neutral-900 p-2.5 font-mono">
                        {selectedAct.totalQuantity} {selectedAct.unit}
                      </td>
                      {selectedAct.type === 'TORG-15' ? (
                        <>
                          <td className="border border-neutral-900 p-2.5 font-mono">
                            {selectedAct.oldPrice} ₽
                          </td>
                          <td className="border border-neutral-900 p-2.5 font-mono font-bold text-emerald-800">
                            {selectedAct.newPrice} ₽
                          </td>
                          <td className="border border-neutral-900 p-2.5 font-mono font-bold">
                            {selectedAct.sumLossRub.toLocaleString('ru-RU')} ₽
                          </td>
                        </>
                      ) : (
                        <td className="border border-neutral-900 p-2.5 font-mono font-bold text-rose-800">
                          {selectedAct.sumLossRub.toLocaleString('ru-RU')} ₽
                        </td>
                      )}
                      <td className="border border-neutral-900 p-2.5 text-left text-neutral-700 italic">
                        {selectedAct.reason}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Commission Signatures */}
              <div className="mt-8 space-y-4 pt-4 border-t border-neutral-300 text-xs font-serif">
                <div className="font-bold text-neutral-900">Члены бракеражной комиссии:</div>
                <div className="space-y-3">
                  {selectedAct.commission.map((person, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-dotted border-neutral-400 pb-1">
                      <span className="font-medium text-neutral-800">{person}</span>
                      <span className="text-neutral-500 font-mono text-2xs italic">
                        Подпись: __________________
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval stamp block */}
              <div className="mt-8 flex justify-between items-end pt-4 text-xs font-serif">
                <div>
                  <div className="text-neutral-500 text-2xs">М.П. (Оттиск штампа склада)</div>
                  <div className="w-24 h-24 border-2 border-dashed border-neutral-300 rounded-full flex items-center justify-center text-neutral-400 text-3xs uppercase text-center p-2 mt-1">
                    Складской контроль «Семейный»
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold">Утверждаю:</div>
                  <div className="text-neutral-700">Директор гипермаркета «Семейный»</div>
                  <div className="mt-4 border-t border-neutral-900 pt-1 text-2xs font-mono">
                    «____» ____________ 2026 г. / __________________
                  </div>
                </div>
              </div>

              {/* Print action trigger at bottom for screen view */}
              <div className="no-print mt-8 pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Распечатать унифицированную форму</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-neutral-500 text-xs">
              Выберите акт из списка слева для предпросмотра и печати.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
