import React, { useState } from 'react';
import { AppDatabase, Product, Category, Employee } from '../types';
import { storage } from '../services/storage';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Barcode,
  Thermometer,
  Clock,
  ArrowUpDown,
  Lock,
  CheckCircle,
} from 'lucide-react';

interface ProductsCatalogViewProps {
  db: AppDatabase;
  currentEmployee: Employee;
  onOpenAuth: () => void;
}

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  db,
  currentEmployee,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New product form state
  const [newName, setNewName] = useState<string>('');
  const [newCode, setNewCode] = useState<string>('СЕМ-ТО-01');
  const [newBarcode, setNewBarcode] = useState<string>('460700100' + Math.floor(1000 + Math.random() * 9000));
  const [newCategoryId, setNewCategoryId] = useState<string>(db.categories[0]?.id || '');
  const [newUnit, setNewUnit] = useState<'кг' | 'шт' | 'уп'>('кг');
  const [newCostPrice, setNewCostPrice] = useState<number>(100);
  const [newRetailPrice, setNewRetailPrice] = useState<number>(160);
  const [newShelfLife, setNewShelfLife] = useState<number>(14);
  const [newTemperature, setNewTemperature] = useState<string>('+2°C...+6°C');

  // Permission check: only Senior Commodity Expert or Admin can alter pricing catalog
  const canEditPrices =
    currentEmployee.role === 'Старший товаровед' ||
    currentEmployee.role === 'Заведующий складом';

  const filteredProducts = db.products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }
    return true;
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    storage.updateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Введите наименование товара');
      return;
    }

    storage.addProduct({
      name: newName.trim(),
      code: newCode.trim(),
      barcode: newBarcode.trim(),
      categoryId: newCategoryId,
      unit: newUnit,
      costPrice: Number(newCostPrice),
      retailPrice: Number(newRetailPrice),
      shelfLifeDays: Number(newShelfLife),
      temperature: newTemperature,
      storageCondition: newTemperature.includes('0°C') || newTemperature.includes('+2') ? 'chilled' : 'ambient',
      standardDefectTolerance: 3.0,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewBarcode('460700100' + Math.floor(1000 + Math.random() * 9000));
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Удалить товарную позицию «${name}» из справочника гипермаркета?`)) {
      storage.deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                Справочник номенклатуры (Прайс-лист)
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">Управление SKU и розничными ценами</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-1">
              Каталог товаров гипермаркета «Семейный»
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!canEditPrices && (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Войти как товаровед для смены цен</span>
              </button>
            )}

            <button
              onClick={() => {
                if (!canEditPrices) {
                  alert('Добавление новых товаров доступно только Старшему товароведу или Зав. складом. Смените пользователя в верхнем меню.');
                  onOpenAuth();
                  return;
                }
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить новый товар</span>
            </button>
          </div>
        </div>

        {/* Search & Categories toolbar */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-neutral-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по названию товара, артикулу или штрихкоду..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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

      {/* Products Table Card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-neutral-200">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-2xs">
              <tr>
                <th className="py-3 px-4">Артикул / Штрихкод</th>
                <th className="py-3 px-4">Наименование товара</th>
                <th className="py-3 px-4">Категория</th>
                <th className="py-3 px-4 text-right">Закупка (Себестоимость)</th>
                <th className="py-3 px-4 text-right">Розничная цена (Полка)</th>
                <th className="py-3 px-4 text-right">Наценка</th>
                <th className="py-3 px-4">Условия / Срок</th>
                <th className="py-3 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((p) => {
                const cat = db.categories.find((c) => c.id === p.categoryId);
                const marginPercent = Math.round(((p.retailPrice - p.costPrice) / p.costPrice) * 100);

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <span className="font-bold text-neutral-900 block">{p.code}</span>
                      <span className="text-neutral-500 text-2xs">{p.barcode}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-neutral-800 text-sm block">{p.name}</span>
                      <span className="text-neutral-500 text-2xs">Ед. изм: {p.unit}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-600">
                      {cat?.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-medium text-neutral-700">
                      {p.costPrice} ₽ / {p.unit}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-blue-950 text-sm">
                      {p.retailPrice} ₽ / {p.unit}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono">
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-2xs">
                        +{marginPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-600 text-2xs">
                      <div>{p.temperature}</div>
                      <div className="text-neutral-400">Срок: {p.shelfLifeDays} дн.</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (!canEditPrices) {
                              alert('Изменение цен и параметров доступно только Старшему товароведу.');
                              onOpenAuth();
                              return;
                            }
                            setEditingProduct({ ...p });
                          }}
                          className="p-1.5 text-neutral-600 hover:text-blue-900 hover:bg-neutral-100 rounded-md transition-colors"
                          title="Редактировать товар и цену"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (!canEditPrices) {
                              alert('Удаление товаров доступно только Старшему товароведу.');
                              onOpenAuth();
                              return;
                            }
                            handleDelete(p.id, p.name);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          title="Удалить позицию"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Existing Product / Change Price */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">
                Редактирование цены и карточки товара
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Наименование товара
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full border border-neutral-300 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Закупочная цена (руб)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={editingProduct.costPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-blue-900 mb-1">
                    Розничная цена (руб) ★
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={editingProduct.retailPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        retailPrice: Number(e.target.value),
                      })
                    }
                    className="w-full border-2 border-blue-600 rounded-lg p-2 font-mono font-bold text-blue-900 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Штрихкод (EAN-13)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, barcode: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Срок годности (дней)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.shelfLifeDays}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        shelfLifeDays: Number(e.target.value),
                      })
                    }
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Температурный режим
                </label>
                <input
                  type="text"
                  value={editingProduct.temperature}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, temperature: e.target.value })
                  }
                  className="w-full border border-neutral-300 rounded-lg p-2"
                  placeholder="+2°C...+4°C"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Product (SKU) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-900" />
                Регистрация нового товара в гипермаркет «Семейный»
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Наименование товара
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2"
                  placeholder="Например: Мандарины Марокко калибр 1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Категория продукции
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2"
                  >
                    {db.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Единица измерения
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg p-2"
                  >
                    <option value="кг">Килограмм (кг)</option>
                    <option value="шт">Штука (шт)</option>
                    <option value="уп">Упаковка (уп)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Внутренний артикул
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Штрихкод EAN-13
                  </label>
                  <input
                    type="text"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Себестоимость закупки (руб)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Розничная цена продажи (руб)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={newRetailPrice}
                    onChange={(e) => setNewRetailPrice(Number(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Срок годности (дней)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newShelfLife}
                    onChange={(e) => setNewShelfLife(Number(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Температурный режим
                  </label>
                  <input
                    type="text"
                    value={newTemperature}
                    onChange={(e) => setNewTemperature(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2"
                    placeholder="+2°C...+4°C"
                    required
                  />
                </div>
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
                  Добавить товар в базу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
