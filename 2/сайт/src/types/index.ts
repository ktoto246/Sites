export type ProductGrade = 'first' | 'second' | 'culinary' | 'scrap' | 'return';

export type BatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type StorageCondition = 'ambient' | 'chilled' | 'frozen';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Product {
  id: string;
  code: string; // Внутренний артикул (например: СЕМ-0142)
  barcode: string; // Штрихкод EAN-13 (например: 4607001234567)
  name: string;
  categoryId: string;
  unit: 'кг' | 'шт' | 'уп' | 'ящ';
  shelfLifeDays: number;
  temperature: string; // Например "+2°C...+6°C"
  storageCondition: StorageCondition;
  costPrice: number; // Себестоимость за ед.
  retailPrice: number; // Розничная цена за ед.
  standardDefectTolerance: number; // Допустимый нормативный % потерь (например 2.5%)
}

export interface Supplier {
  id: string;
  name: string;
  inn: string;
  city: string;
  reliabilityScore: number; // Рейтинг надежности (1-5)
  contactPerson: string;
  phone: string;
}

export interface Batch {
  id: string;
  batchNumber: string; // Номер партии (например: ПАРТ-2026-104)
  ttnNumber: string; // Номер ТТН / накладной
  productId: string;
  supplierId: string;
  incomingDate: string; // ISO date YYYY-MM-DD
  expirationDate: string; // ISO date YYYY-MM-DD
  receivedQuantity: number;
  status: BatchStatus;
  storageZone: string;
  notes?: string;
}

export interface SortingRecord {
  id: string;
  batchId: string;
  date: string; // YYYY-MM-DD HH:mm
  sorterName: string;
  sorterRole: string;
  
  // Распределение количества
  qtyTotal: number;
  qtyFirstGrade: number; // 1 сорт (на витрину)
  qtySecondGrade: number; // 2 сорт (уценка)
  qtyCulinary: number; // В кулинарию/переработку гипермаркета
  qtyScrap: number; // Брак/списание
  qtyReturn: number; // Возврат поставщику
  
  // Аналитические данные
  scrapPercentage: number;
  secondGradePercentage: number;
  culinaryPercentage: number;
  firstGradePercentage: number;
  defectReason: string;
  
  markdownPercentage?: number; // Процент уценки для 2-го сорта (обычно 30-50%)
  lossAmountRub: number; // Финансовый ущерб от списания (руб)
  savedAmountRub: number; // Сохраненная ценность за счет переработки/уценки (руб)
  
  status: 'draft' | 'approved';
  approvedBy?: string;
  comments?: string;
}

export interface QualityAct {
  id: string;
  actNumber: string;
  type: 'TORG-15' | 'TORG-16' | 'INPUT-INSPECTION';
  title: string;
  date: string;
  sortingRecordId?: string;
  batchNumber: string;
  productName: string;
  supplierName: string;
  totalQuantity: number;
  unit: string;
  scrapQuantity?: number;
  markdownQuantity?: number;
  oldPrice?: number;
  newPrice?: number;
  sumLossRub: number;
  reason: string;
  commission: string[];
}

export type UserRole =
  | 'Старший товаровед'
  | 'Сортировщик'
  | 'Контролер ОТК'
  | 'Заведующий складом'
  | 'Оператор сортировочной линии';

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  shift: 'Смена А' | 'Смена Б' | 'Дневная';
  active: boolean;
  avatar?: string;
}

export interface RolePermissions {
  canReceiveBatches: boolean; // право принимать новые партии по ТТН с рампы
  canEditCatalogAndPrices: boolean; // право менять цены и добавлять SKU
  canSortBatches: boolean; // право работать в АРМ Сортировщика
  canPrintLabels: boolean; // печать ценников и штрихкодов
  canManageActs: boolean; // утверждение и удаление актов ТОРГ-15/16
  canViewAnalytics: boolean; // просмотр коммерческой аналитики и договоров
  canDeleteBatches: boolean; // право отменять и удалять партии
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'Старший товаровед':
      return {
        canReceiveBatches: true,
        canEditCatalogAndPrices: true,
        canSortBatches: true,
        canPrintLabels: true,
        canManageActs: true,
        canViewAnalytics: true,
        canDeleteBatches: true,
      };
    case 'Заведующий складом':
      return {
        canReceiveBatches: true,
        canEditCatalogAndPrices: false,
        canSortBatches: true,
        canPrintLabels: true,
        canManageActs: true,
        canViewAnalytics: true,
        canDeleteBatches: true,
      };
    case 'Контролер ОТК':
      return {
        canReceiveBatches: false,
        canEditCatalogAndPrices: false,
        canSortBatches: true,
        canPrintLabels: true,
        canManageActs: true,
        canViewAnalytics: true,
        canDeleteBatches: false,
      };
    case 'Оператор сортировочной линии':
    case 'Сортировщик':
    default:
      return {
        canReceiveBatches: false,
        canEditCatalogAndPrices: false,
        canSortBatches: true,
        canPrintLabels: true,
        canManageActs: false,
        canViewAnalytics: false,
        canDeleteBatches: false,
      };
  }
}

export interface AppDatabase {
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  batches: Batch[];
  sortingRecords: SortingRecord[];
  qualityActs: QualityAct[];
  employees: Employee[];
  settings: {
    supermarketName: string;
    branchAddress: string;
    currency: string;
    defaultMarkdownPercent: number;
    lastUpdated: string;
  };
}
