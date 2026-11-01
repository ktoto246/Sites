import React from 'react';
import { Package, Plus } from 'lucide-react';
import { Employee, getRolePermissions } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'sorting'
  | 'batches'
  | 'products'
  | 'acts'
  | 'barcodes'
  | 'analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewBatchClick: () => void;
  currentEmployee: Employee;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewBatchClick,
  currentEmployee,
  onOpenAuth,
}) => {
  const permissions = getRolePermissions(currentEmployee.role);

  // Filter tabs strictly based on current role permissions
  const allNavItems: { id: ActiveTab; label: string; visible: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Сводка',
      visible: true,
    },
    {
      id: 'sorting',
      label: currentEmployee.role === 'Контролер ОТК' ? 'ОТК Инспекция' : 'АРМ Сортировщика',
      visible: permissions.canSortBatches,
    },
    {
      id: 'batches',
      label: 'Партии и приёмка',
      visible: permissions.canReceiveBatches || currentEmployee.role === 'Заведующий складом',
    },
    {
      id: 'products',
      label: 'Каталог товаров (SKU)',
      visible: permissions.canEditCatalogAndPrices,
    },
    {
      id: 'acts',
      label: 'Акты ТОРГ-15/16',
      visible: permissions.canManageActs,
    },
    {
      id: 'barcodes',
      label: 'Штрихкоды и ценники',
      visible: permissions.canPrintLabels,
    },
    {
      id: 'analytics',
      label: 'Аналитика качества',
      visible: permissions.canViewAnalytics,
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.visible);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand Wordmark & Logo */}
          <div
            onClick={() => setActiveTab(visibleNavItems[0]?.id || 'dashboard')}
            className="flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 group"
            title="Перейти на главную панель"
          >
            {/* Logo Icon / Emblem */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white flex items-center justify-center shadow-sm border border-blue-800/50 group-hover:scale-105 transition-transform duration-200 relative overflow-hidden shrink-0">
              {/* Fresh Hypermarket Leaf & Cart SVG emblem */}
              <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" className="stroke-blue-200" fill="currentColor" fillOpacity="0.1" />
                <path d="M3 6h18" className="stroke-blue-200" />
                <path d="M16 10a4 4 0 0 1-8 0" className="stroke-blue-300" />
                <path d="M12 4c2 0 4 1.5 4 4" className="stroke-emerald-400" strokeWidth="2.5" />
              </svg>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-neutral-900 leading-tight">
                  Семейный
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  ГИПЕРМАРКЕТ
                </span>
              </div>
              <span className="text-2xs text-neutral-500 font-medium leading-none block mt-0.5">
                Система учета и сортировки
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Strictly filtered by role) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs font-medium">
            {visibleNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions & User Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Active User Pill & Role Switcher */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
              title="Нажмите, чтобы сменить сотрудника или войти под другой ролью"
            >
              <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-2xs">
                {currentEmployee.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-neutral-800 block leading-tight truncate max-w-[130px]">
                  {currentEmployee.name.split(' ')[0]} {currentEmployee.name.split(' ')[1]?.[0]}.
                </span>
                <span className="text-3xs text-blue-900 font-semibold leading-none block">
                  {currentEmployee.role}
                </span>
              </div>
            </button>

            {/* ONLY users with legal authority to receive cargo can see the Receive Batch button */}
            {permissions.canReceiveBatches && (
              <button
                onClick={onNewBatchClick}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Принять новую партию по накладной (ТТН) от поставщика"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Приёмка ТТН</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation (Strictly filtered by role) */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-neutral-100 scrollbar-none">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
