import React, { useEffect, useState } from 'react';
import { AppDatabase, Employee, getRolePermissions } from './types';
import { storage } from './services/storage';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SortingStationView } from './components/SortingStationView';
import { BatchesView } from './components/BatchesView';
import { ProductsCatalogView } from './components/ProductsCatalogView';
import { ActsView } from './components/ActsView';
import { BarcodesView } from './components/BarcodesView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthModal } from './components/AuthModal';
import { ShieldAlert, UserCheck } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(storage.getDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>(undefined);
  const [activeActId, setActiveActId] = useState<string | undefined>(undefined);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Active authenticated employee (defaults to Senior Commodity Expert)
  const [currentEmployee, setCurrentEmployee] = useState<Employee>(
    db.employees[0] || {
      id: 'emp-001',
      name: 'Иванов Алексей Сергеевич',
      role: 'Старший товаровед',
      shift: 'Дневная',
      active: true,
    }
  );

  const permissions = getRolePermissions(currentEmployee.role);

  useEffect(() => {
    const unsubscribe = storage.subscribe((updatedDb) => {
      setDb(updatedDb);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectBatchForSorting = (batchId: string) => {
    setSelectedBatchId(batchId);
    setActiveTab('sorting');
  };

  const handleViewAct = (actId: string) => {
    setActiveActId(actId);
    setActiveTab('acts');
  };

  const handleEmployeeSwitch = (emp: Employee) => {
    setCurrentEmployee(emp);
    const perms = getRolePermissions(emp.role);

    // If new role is a Sorter, immediately route them to their workplace (АРМ Сортировщика)
    if (emp.role === 'Оператор сортировочной линии' || emp.role === 'Сортировщик') {
      if (activeTab !== 'sorting' && activeTab !== 'barcodes' && activeTab !== 'dashboard') {
        setActiveTab('sorting');
      }
    } else if (emp.role === 'Контролер ОТК') {
      if (activeTab === 'products' || activeTab === 'batches') {
        setActiveTab('dashboard');
      }
    } else if (emp.role === 'Заведующий складом') {
      if (activeTab === 'products') {
        setActiveTab('batches');
      }
    }
  };

  // Check if current tab is forbidden for active role
  const isTabForbidden =
    (activeTab === 'products' && !permissions.canEditCatalogAndPrices) ||
    (activeTab === 'batches' && !permissions.canReceiveBatches && currentEmployee.role !== 'Заведующий складом') ||
    (activeTab === 'acts' && !permissions.canManageActs) ||
    (activeTab === 'analytics' && !permissions.canViewAnalytics);

  return (
    <div className="min-h-screen bg-transparent flex flex-col text-neutral-900 font-sans">
      {/* Navigation Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewBatchClick={() => {
          if (!permissions.canReceiveBatches) {
            alert('Приемка партий по накладным разрешена только Старшему товароведу или Заведующему складом.');
            return;
          }
          setActiveTab('batches');
          setIsAddBatchModalOpen(true);
        }}
        currentEmployee={currentEmployee}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isTabForbidden ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Доступ ограничен правами должности
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Вы авторизованы как <strong>{currentEmployee.name}</strong> ({currentEmployee.role}). 
              Этот раздел доступен только уполномоченным сотрудникам гипермаркета.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Сменить пользователя</span>
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                db={db}
                setActiveTab={setActiveTab}
                onSelectBatchForSorting={handleSelectBatchForSorting}
              />
            )}

            {activeTab === 'sorting' && (
              <SortingStationView
                db={db}
                selectedBatchId={selectedBatchId}
                setActiveTab={setActiveTab}
                onViewAct={handleViewAct}
                currentEmployee={currentEmployee}
              />
            )}

            {activeTab === 'batches' && (
              <BatchesView
                db={db}
                onSortBatch={handleSelectBatchForSorting}
                isAddModalOpen={isAddBatchModalOpen}
                setIsAddModalOpen={setIsAddBatchModalOpen}
                currentEmployee={currentEmployee}
              />
            )}

            {activeTab === 'products' && (
              <ProductsCatalogView
                db={db}
                currentEmployee={currentEmployee}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'acts' && (
              <ActsView
                db={db}
                activeActId={activeActId}
                onClearActiveAct={() => setActiveActId(undefined)}
                currentEmployee={currentEmployee}
              />
            )}

            {activeTab === 'barcodes' && <BarcodesView db={db} />}

            {activeTab === 'analytics' && <AnalyticsView db={db} />}
          </>
        )}
      </main>

      {/* Auth Modal for Role Switching */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        employees={db.employees}
        currentEmployee={currentEmployee}
        onSelectEmployee={handleEmployeeSwitch}
      />

      {/* Production Footer (Clean, authentic enterprise system) */}
      <footer className="no-print bg-white border-t border-neutral-200 py-6 mt-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">
              {db.settings.supermarketName}
            </span>
            <span>·</span>
            <span>{db.settings.branchAddress}</span>
          </div>

          <div className="flex items-center gap-4 text-2xs text-neutral-400">
            <span>Автоматизированная система товарного учета и сортировки</span>
            <span>·</span>
            <span>Версия 2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
