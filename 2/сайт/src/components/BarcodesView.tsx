import React, { useState } from 'react';
import { AppDatabase, Product } from '../types';
import { Printer, Tag, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';

interface BarcodesViewProps {
  db: AppDatabase;
}

export const BarcodesView: React.FC<BarcodesViewProps> = ({ db }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(db.products[0]?.id || '');
  const [labelType, setLabelType] = useState<'all' | 'first' | 'second' | 'culinary'>('all');
  const [discountPercent, setDiscountPercent] = useState<number>(40);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const product = db.products.find((p) => p.id === selectedProductId) || db.products[0];
  const markdownPrice = product
    ? Math.round(product.retailPrice * (1 - discountPercent / 100) * 10) / 10
    : 0;

  const handleCopyBarcode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header (No print) */}
      <div className="no-print bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                Стикерование и маркировка
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">Термоэтикетки торгового зала</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-1">
              Генератор маркировочных этикеток и штрихкодов сортов
            </h2>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Печать этикеток</span>
          </button>
        </div>

        {/* Filters & Product Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Выберите товар для печати
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg p-2 font-medium"
            >
              {db.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Тип маркировки
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLabelType('all')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  labelType === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Все виды
              </button>
              <button
                type="button"
                onClick={() => setLabelType('first')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  labelType === 'first'
                    ? 'bg-emerald-900 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                1-й сорт
              </button>
              <button
                type="button"
                onClick={() => setLabelType('second')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  labelType === 'second'
                    ? 'bg-amber-900 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Уценка 2с
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Скидка уценки (%): <span className="font-mono font-bold text-amber-800">{discountPercent}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full accent-blue-900"
            />
          </div>
        </div>
      </div>

      {/* Label Showcase / Print layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: 1st Grade Retail Sticker */}
        {(labelType === 'all' || labelType === 'first') && product && (
          <div className="bg-white border-2 border-neutral-300 rounded-xl p-5 shadow-sm space-y-4 print-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-2xs uppercase tracking-wider font-bold text-neutral-500">
                ГИПЕРМАРКЕТ «СЕМЕЙНЫЙ»
              </span>
              <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                1-Й СОРТ (ВЫСШИЙ)
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 line-clamp-2">
                {product.name}
              </h3>
              <div className="text-2xs text-neutral-500 mt-1 flex items-center gap-2">
                <span>Арт: <strong className="font-mono text-neutral-700">{product.code}</strong></span>
                <span>·</span>
                <span>Хранение: {product.temperature}</span>
              </div>
            </div>

            {/* Simulated EAN-13 Barcode */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center space-y-1">
              <div className="h-12 flex items-center justify-center gap-1 overflow-hidden px-4">
                {product.barcode.split('').map((char, idx) => {
                  const num = parseInt(char, 10);
                  const width = (num % 3) + 2;
                  const isBlack = (num + idx) % 2 === 0 || idx % 3 === 0;
                  return (
                    <div
                      key={idx}
                      className={`h-full ${isBlack ? 'bg-neutral-900' : 'bg-transparent'}`}
                      style={{ width: `${width * 2}px` }}
                    />
                  );
                })}
              </div>
              <div className="font-mono text-xs font-bold tracking-widest text-neutral-800 flex items-center justify-center gap-2">
                <span>{product.barcode}</span>
                <button
                  onClick={() => handleCopyBarcode(product.barcode)}
                  className="no-print text-neutral-400 hover:text-neutral-700 text-3xs"
                  title="Скопировать штрихкод"
                >
                  {copiedCode === product.barcode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-neutral-200">
              <div>
                <span className="text-2xs text-neutral-500 block">Розничная цена:</span>
                <span className="text-2xl font-black font-mono text-neutral-900">
                  {product.retailPrice} ₽
                </span>
                <span className="text-2xs text-neutral-500 font-mono"> / {product.unit}</span>
              </div>
              <div className="text-right text-3xs text-neutral-500 font-mono">
                <div>ГОСТ Р 51074</div>
                <div>Фасовка: РСУ-2</div>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: 2nd Grade Markdown Yellow Sticker */}
        {(labelType === 'all' || labelType === 'second') && product && (
          <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-5 shadow-sm space-y-4 print-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-amber-300 pb-2">
              <span className="text-2xs uppercase tracking-wider font-black text-amber-950">
                ★ СПЕЦЦЕНА «СЕМЕЙНЫЙ» ★
              </span>
              <span className="text-xs font-black font-mono text-amber-950 bg-amber-300 px-2.5 py-0.5 rounded">
                УЦЕНКА -{discountPercent}%
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 line-clamp-2">
                {product.name}
              </h3>
              <div className="text-2xs text-amber-900 mt-1 font-medium">
                2-й сорт: Незначительное снижение товарного вида
              </div>
            </div>

            {/* Markdown Special Barcode */}
            <div className="bg-white/80 border border-amber-300 rounded-lg p-3 text-center space-y-1">
              <div className="h-12 flex items-center justify-center gap-1 overflow-hidden px-4">
                {`200${product.barcode.slice(3, 12)}0`.split('').map((char, idx) => {
                  const num = parseInt(char, 10);
                  const width = (num % 3) + 2;
                  const isBlack = (num + idx) % 2 === 0;
                  return (
                    <div
                      key={idx}
                      className={`h-full ${isBlack ? 'bg-neutral-950' : 'bg-transparent'}`}
                      style={{ width: `${width * 2}px` }}
                    />
                  );
                })}
              </div>
              <div className="font-mono text-xs font-bold tracking-widest text-neutral-900">
                200{product.barcode.slice(3, 12)}0
              </div>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-amber-300">
              <div>
                <span className="text-2xs line-through text-neutral-600 font-mono block">
                  {product.retailPrice} ₽
                </span>
                <span className="text-2xl font-black font-mono text-rose-700">
                  {markdownPrice} ₽
                </span>
                <span className="text-2xs text-neutral-600 font-mono"> / {product.unit}</span>
              </div>
              <div className="text-right text-3xs text-amber-950 font-bold uppercase">
                <div>Срок реализации</div>
                <div>ограничен</div>
              </div>
            </div>
          </div>
        )}

        {/* Card 3: Internal Transfer to Culinary Production */}
        {(labelType === 'all' || labelType === 'culinary') && product && (
          <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-5 shadow-sm space-y-4 print-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
              <span className="text-2xs uppercase tracking-wider font-bold text-indigo-900">
                ВНУТРЕННЕЕ ПЕРЕМЕЩЕНИЕ
              </span>
              <span className="text-xs font-bold font-mono text-indigo-950 bg-indigo-200 px-2 py-0.5 rounded">
                В КУЛИНАРИЮ
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 line-clamp-2">
                {product.name}
              </h3>
              <div className="text-2xs text-indigo-900 mt-1">
                Целевое назначение: Тепловая обработка / Салаты гипермаркета
              </div>
            </div>

            <div className="bg-white border border-indigo-200 rounded-lg p-3 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Цех назначения:</span>
                <span className="font-bold text-neutral-900">Горячий цех №1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Учетная стоимость:</span>
                <span className="font-bold text-indigo-900">{product.costPrice * 0.9} ₽ / {product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Партия сырья:</span>
                <span className="font-bold text-neutral-900">ПАРТ-2026-СЫР</span>
              </div>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-indigo-200 text-3xs text-indigo-900">
              <div>
                Отпустил: ________________ (ОТК)
              </div>
              <div>
                Принял шеф-повар: _________
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Catalog Table */}
      <div className="no-print bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">
          Сводная таблица штрихкодов номенклатуры гипермаркета «Семейный»
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-neutral-200">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-2xs">
              <tr>
                <th className="py-2.5 px-3">Артикул</th>
                <th className="py-2.5 px-3">Наименование</th>
                <th className="py-2.5 px-3">Штрихкод (EAN-13)</th>
                <th className="py-2.5 px-3 text-right">Базовая цена</th>
                <th className="py-2.5 px-3 text-right">Уценка (-40%)</th>
                <th className="py-2.5 px-3 text-center">Выбор</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {db.products.map((p) => {
                const discount = Math.round(p.retailPrice * 0.6 * 10) / 10;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3 font-bold text-neutral-900">{p.code}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">{p.name}</td>
                    <td className="py-2.5 px-3 tracking-wider text-neutral-700">{p.barcode}</td>
                    <td className="py-2.5 px-3 text-right">{p.retailPrice} ₽</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-700">{discount} ₽</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedProductId(p.id)}
                        className="px-2 py-1 text-2xs bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-800 font-sans font-semibold"
                      >
                        Выбрать
                      </button>
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
