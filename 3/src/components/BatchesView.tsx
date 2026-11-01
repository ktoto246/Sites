import React, { useState } from 'react';
import { AppDatabase, Batch, Product, Supplier, Employee, getRolePermissions } from '../types';
import { storage } from '../services/storage';
import {
  PackagePlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Boxes,
  Truck,
  Calendar,
  Thermometer,
  Trash2,
} from 'lucide-react';

interface BatchesViewProps {
  db: AppDatabase;
  onSortBatch: (batchId: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  currentEmployee: Employee;
}

export const BatchesView: React.FC<BatchesViewProps> = ({
  db,
  onSortBatch,
  isAddModalOpen,
  setIsAddModalOpen,
  currentEmployee,
}) => {
  const permissions = getRolePermissions(currentEmployee.role);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state for new batch modal
  const [newBatchProductId, setNewBatchProductId] = useState<string>(db.products[0]?.id || '');
  const [newBatchSupplierId, setNewBatchSupplierId] = useState<string>(db.suppliers[0]?.id || '');
  const [newBatchTtn, setNewBatchTtn] = useState<string>('ТТН-2026-');
  const [newBatchQuantity, setNewBatchQuantity] = useState<number>(500);
  const [newBatchExpDate, setNewBatchExpDate] = useState<string>('2026-11-20');
  const [newBatchZone, setNewBatchZone] = useState<string>('Зона ФРОВ №1 (Холодильная камера A-1)');
  const [newBatchNotes, setNewBatchNotes] = useState<string>('');

  const filteredBatches = db.batches.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    const prod = db.products.find((p) => p.id === b.productId);
    if (filterCategory !== 'all' && prod?.categoryId !== filterCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sup = db.suppliers.find((s) => s.id === b.supplierId);
      const match =
        b.batchNumber.toLowerCase().includes(q) ||
        b.ttnNumber.toLowerCase().includes(q) ||
        (prod && prod.name.toLowerCase().includes(q)) ||
        (sup && sup.name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchProductId || !newBatchSupplierId || newBatchQuantity <= 0) {
      alert('Заполните обязательные поля накладной');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    storage.addBatch({
      ttnNumber: newBatchTtn.trim() || `ТТН-${Date.now().toString().slice(-4)}`,
      productId: newBatchProductId,
      supplierId: newBatchSupplierId,
      incomingDate: todayStr,
      expirationDate: newBatchExpDate,
      receivedQuantity: newBatchQuantity,
      storageZone: newBatchZone,
      notes: newBatchNotes,
    });

    setIsAddModalOpen(false);
    setNewBatchNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Реестр входящих партий и накладных
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Учет поступления продукции от поставщиков на распределительно-сортировочный узел
            </p>
          </div>

          {permissions.canReceiveBatches && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Принять новую партию (ТТН)</span>
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-neutral-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по номеру партии, ТТН, товару или поставщику..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Все статусы ({db.batches.length})</option>
              <option value="pending">Ожидает сортировки</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Рассортировано</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Все категории ({db.categories.length})</option>
              {db.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches Table Card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-neutral-200">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-2xs">
              <tr>
                <th className="py-3 px-4">Партия / ТТН</th>
                <th className="py-3 px-4">Товар</th>
                <th className="py-3 px-4">Поставщик</th>
                <th className="py-3 px-4 text-right">Поступило</th>
                <th className="py-3 px-4">Поступление / Срок</th>
                <th className="py-3 px-4">Зона хранения</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    Партий, соответствующих выбранным фильтрам, не обнаружено.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const product = db.products.find((p) => p.id === b.productId);
                  const supplier = db.suppliers.find((s) => s.id === b.supplierId);
                  const category = product
                    ? db.categories.find((c) => c.id === product.categoryId)
                    : null;
                  const isDone = b.status === 'completed';

                  return (
                    <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-neutral-900 font-mono block">
                          {b.batchNumber}
                        </span>
                        <span className="text-neutral-500 font-mono text-2xs">
                          {b.ttnNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-neutral-800 block">
                          {product?.name}
                        </span>
                        <span className="text-neutral-500 text-2xs">
                          {category?.name} · {product?.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-neutral-800 block">{supplier?.name}</span>
                        <span className="text-neutral-500 text-2xs">{supplier?.city}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono">
                        <span className="text-sm font-bold text-neutral-900">
                          {b.receivedQuantity.toLocaleString('ru-RU')}
                        </span>
                        <span className="text-neutral-500 ml-1">{product?.unit}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-600">
                        <div className="text-2xs text-neutral-500">Приемка: {b.incomingDate}</div>
                        <div className="font-medium text-neutral-800">До: {b.expirationDate}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 text-2xs">
                        {b.storageZone}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Рассортировано
                          </span>
                        ) : b.status === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800">
                            <Clock className="w-3 h-3 text-blue-600" />
                            В процессе
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Ожидает сортировки
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSortBatch(b.id)}
                            className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 hover:border-blue-300 hover:bg-blue-50 text-blue-900 rounded-md transition-colors"
                          >
                            {isDone ? 'Пересортировать' : 'Сортировать'}
                          </button>
                          {permissions.canDeleteBatches && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Удалить партию «${b.batchNumber}»?`)) {
                                  storage.deleteBatch(b.id);
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Удалить партию"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Batch Receiving */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-900" />
                Приёмка новой партии товара на склад
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Товарная номенклатура</label>
                <select
                  value={newBatchProductId}
                  onChange={(e) => setNewBatchProductId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                >
                  {db.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}, ед: {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Поставщик</label>
                  <select
                    value={newBatchSupplierId}
                    onChange={(e) => setNewBatchSupplierId(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  >
                    {db.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Номер ТТН</label>
                  <input
                    type="text"
                    value={newBatchTtn}
                    onChange={(e) => setNewBatchTtn(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                    placeholder="ТТН-1234"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Количество по накладной</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={newBatchQuantity}
                    onChange={(e) => setNewBatchQuantity(Number(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Предельный срок годности</label>
                  <input
                    type="date"
                    value={newBatchExpDate}
                    onChange={(e) => setNewBatchExpDate(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Зона первичного размещения на складе
                </label>
                <select
                  value={newBatchZone}
                  onChange={(e) => setNewBatchZone(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 font-medium"
                  required
                >
                  <option value="Зона ФРОВ №1 (Холодильная камера A-1, +2°C...+4°C)">
                    Зона ФРОВ №1 (Холодильная камера A-1, +2°C...+4°C)
                  </option>
                  <option value="Зона ФРОВ №2 (Сухой распределитель B-1, +12°C...+15°C)">
                    Зона ФРОВ №2 (Сухой распределитель B-1, +12°C...+15°C)
                  </option>
                  <option value="Холодильный склад гастрономии (Камера М-3, +2°C...+4°C)">
                    Холодильный склад гастрономии (Камера М-3, +2°C...+4°C)
                  </option>
                  <option value="Мясной цех (Пандус приемки №4, 0°C...+2°C)">
                    Мясной цех (Пандус приемки №4, 0°C...+2°C)
                  </option>
                  <option value="Овощной бункер С-01 (Сухой склад, +4°C...+7°C)">
                    Овощной бункер С-01 (Сухой склад, +4°C...+7°C)
                  </option>
                  <option value="Хлебобулочная рампа №2 (Сухой склад, +18°C...+22°C)">
                    Хлебобулочная рампа №2 (Сухой склад, +18°C...+22°C)
                  </option>
                  <option value="Карантинная зона брака и возвратов поставщикам">
                    Карантинная зона брака и возвратов поставщикам
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Примечания входного контроля</label>
                <textarea
                  value={newBatchNotes}
                  onChange={(e) => setNewBatchNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-neutral-300 rounded-lg p-2"
                  placeholder="Внешний вид поддонов, температура рефрижератора..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800"
                >
                  Зарегистрировать приёмку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
