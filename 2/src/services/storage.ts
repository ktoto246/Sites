import { AppDatabase, Batch, Product, SortingRecord, QualityAct, Supplier, Employee } from '../types';
import { INITIAL_DATABASE } from '../data/initialData';

const STORAGE_KEY = 'semeiny_supermarket_sort_db_v1';

type Listener = (db: AppDatabase) => void;

class StorageService {
  private db: AppDatabase;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): AppDatabase {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.products && parsed.batches && parsed.categories) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using INITIAL_DATABASE', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATABASE));
  }

  private persist() {
    try {
      this.db.settings.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      this.notify();
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getDatabase());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const data = this.getDatabase();
    this.listeners.forEach((fn) => fn(data));
  }

  public getDatabase(): AppDatabase {
    return JSON.parse(JSON.stringify(this.db));
  }

  public resetToFactory(): AppDatabase {
    this.db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.persist();
    return this.getDatabase();
  }

  public importDatabase(newDb: AppDatabase): boolean {
    if (!newDb || !Array.isArray(newDb.products) || !Array.isArray(newDb.batches)) {
      throw new Error('Некорректная структура файла базы данных');
    }
    this.db = JSON.parse(JSON.stringify(newDb));
    this.persist();
    return true;
  }

  // --- Products ---
  public addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now().toString(36)}`,
    };
    this.db.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(product: Product): void {
    const index = this.db.products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      this.db.products[index] = product;
      this.persist();
    }
  }

  public deleteProduct(productId: string): void {
    this.db.products = this.db.products.filter((p) => p.id !== productId);
    this.persist();
  }

  // --- Batches ---
  public addBatch(batch: Omit<Batch, 'id' | 'batchNumber' | 'status'>): Batch {
    const seq = this.db.batches.length + 101;
    const newBatch: Batch = {
      ...batch,
      id: `batch-${Date.now().toString(36)}`,
      batchNumber: `ПАРТ-2026-${seq}`,
      status: 'pending',
    };
    this.db.batches.unshift(newBatch);
    this.persist();
    return newBatch;
  }

  public updateBatchStatus(batchId: string, status: Batch['status']): void {
    const batch = this.db.batches.find((b) => b.id === batchId);
    if (batch) {
      batch.status = status;
      this.persist();
    }
  }

  // --- Sorting Process & Acts Automation ---
  public recordSorting(data: {
    batchId: string;
    sorterName: string;
    sorterRole: string;
    qtyFirstGrade: number;
    qtySecondGrade: number;
    qtyCulinary: number;
    qtyScrap: number;
    qtyReturn: number;
    defectReason: string;
    markdownPercentage: number;
    comments?: string;
  }): { record: SortingRecord; actsCreated: QualityAct[] } {
    const batch = this.db.batches.find((b) => b.id === data.batchId);
    if (!batch) {
      throw new Error('Партия не найдена в базе данных');
    }

    const product = this.db.products.find((p) => p.id === batch.productId);
    const supplier = this.db.suppliers.find((s) => s.id === batch.supplierId);
    const totalQty = batch.receivedQuantity;
    const distributed =
      data.qtyFirstGrade +
      data.qtySecondGrade +
      data.qtyCulinary +
      data.qtyScrap +
      data.qtyReturn;

    if (Math.abs(distributed - totalQty) > 0.001) {
      throw new Error(
        `Сумма сортов (${distributed}) не совпадает с количеством в партии (${totalQty}). Проверьте баланс массы!`
      );
    }

    const scrapPct = Number(((data.qtyScrap / totalQty) * 100).toFixed(2));
    const secondPct = Number(((data.qtySecondGrade / totalQty) * 100).toFixed(2));
    const culinaryPct = Number(((data.qtyCulinary / totalQty) * 100).toFixed(2));
    const firstPct = Number(((data.qtyFirstGrade / totalQty) * 100).toFixed(2));

    const cost = product?.costPrice || 100;
    const retail = product?.retailPrice || 150;

    // Прямой ущерб от списания брака (по себестоимости)
    const lossRub = Math.round(data.qtyScrap * cost);

    // Сохраненная ценность (уценка по сниженной цене + направление в кулинарию)
    const markdownFactor = 1 - (data.markdownPercentage || 40) / 100;
    const savedRub = Math.round(
      data.qtySecondGrade * (retail * markdownFactor) + data.qtyCulinary * (cost * 0.9)
    );

    const now = new Date();
    const formattedDate = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newRecord: SortingRecord = {
      id: `sort-${Date.now().toString(36)}`,
      batchId: data.batchId,
      date: formattedDate,
      sorterName: data.sorterName,
      sorterRole: data.sorterRole,
      qtyTotal: totalQty,
      qtyFirstGrade: data.qtyFirstGrade,
      qtySecondGrade: data.qtySecondGrade,
      qtyCulinary: data.qtyCulinary,
      qtyScrap: data.qtyScrap,
      qtyReturn: data.qtyReturn,
      scrapPercentage: scrapPct,
      secondGradePercentage: secondPct,
      culinaryPercentage: culinaryPct,
      firstGradePercentage: firstPct,
      defectReason: data.defectReason,
      markdownPercentage: data.markdownPercentage,
      lossAmountRub: lossRub,
      savedAmountRub: savedRub,
      status: 'approved',
      approvedBy: `${data.sorterName} (${data.sorterRole})`,
      comments: data.comments || 'Сортировка выполнена по регламенту гипермаркета «Семейный».',
    };

    // Update batch status
    batch.status = 'completed';

    // Auto-create relevant acts
    const actsCreated: QualityAct[] = [];

    // If scrap > 0, generate TORG-16
    if (data.qtyScrap > 0) {
      const actSeq = this.db.qualityActs.filter((a) => a.type === 'TORG-16').length + 43;
      const torg16: QualityAct = {
        id: `act-${Date.now().toString(36)}-16`,
        actNumber: `АКТ-ТОРГ16-${String(actSeq).padStart(3, '0')}`,
        type: 'TORG-16',
        title: 'Акт о порче, бое, ломе товарно-материальных ценностей',
        date: now.toISOString().slice(0, 10),
        sortingRecordId: newRecord.id,
        batchNumber: batch.batchNumber,
        productName: product?.name || 'Товар',
        supplierName: supplier?.name || 'Поставщик',
        totalQuantity: data.qtyScrap,
        unit: product?.unit || 'кг',
        scrapQuantity: data.qtyScrap,
        sumLossRub: lossRub,
        reason: data.defectReason || 'Выбраковка по качеству (гниение/механический бой)',
        commission: [
          `${data.sorterName} — ${data.sorterRole}`,
          'Иванов А.С. — Старший товаровед',
          'Петрова О.Н. — Заведующий складом',
        ],
      };
      this.db.qualityActs.unshift(torg16);
      actsCreated.push(torg16);
    }

    // If second grade > 0, generate TORG-15
    if (data.qtySecondGrade > 0) {
      const actSeq = this.db.qualityActs.filter((a) => a.type === 'TORG-15').length + 19;
      const newPrice = Math.round(retail * markdownFactor * 10) / 10;
      const sumDiff = Math.round(data.qtySecondGrade * (retail - newPrice));

      const torg15: QualityAct = {
        id: `act-${Date.now().toString(36)}-15`,
        actNumber: `АКТ-ТОРГ15-${String(actSeq).padStart(3, '0')}`,
        type: 'TORG-15',
        title: 'Акт об уценке товарно-материальных ценностей',
        date: now.toISOString().slice(0, 10),
        sortingRecordId: newRecord.id,
        batchNumber: batch.batchNumber,
        productName: product?.name || 'Товар',
        supplierName: supplier?.name || 'Поставщик',
        totalQuantity: data.qtySecondGrade,
        unit: product?.unit || 'кг',
        markdownQuantity: data.qtySecondGrade,
        oldPrice: retail,
        newPrice: newPrice,
        sumLossRub: sumDiff,
        reason: `Уценка на ${data.markdownPercentage}% по причине снижения товарного вида: ${data.defectReason}`,
        commission: [
          `${data.sorterName} — ${data.sorterRole}`,
          'Иванов А.С. — Старший товаровед',
          'Петрова О.Н. — Заведующий складом',
        ],
      };
      this.db.qualityActs.unshift(torg15);
      actsCreated.push(torg15);
    }

    this.db.sortingRecords.unshift(newRecord);
    this.persist();

    return { record: newRecord, actsCreated };
  }

  // --- Suppliers ---
  public addSupplier(supplier: Omit<Supplier, 'id'>): Supplier {
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now().toString(36)}`,
    };
    this.db.suppliers.push(newSup);
    this.persist();
    return newSup;
  }

  // --- Employees ---
  public addEmployee(emp: Omit<Employee, 'id'>): Employee {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now().toString(36)}`,
    };
    this.db.employees.push(newEmp);
    this.persist();
    return newEmp;
  }

  public deleteEmployee(empId: string): void {
    this.db.employees = this.db.employees.filter((e) => e.id !== empId);
    this.persist();
  }

  // --- Batches & Acts deletion ---
  public deleteBatch(batchId: string): void {
    this.db.batches = this.db.batches.filter((b) => b.id !== batchId);
    this.db.sortingRecords = this.db.sortingRecords.filter((r) => r.batchId !== batchId);
    this.persist();
  }

  public deleteAct(actId: string): void {
    this.db.qualityActs = this.db.qualityActs.filter((a) => a.id !== actId);
    this.persist();
  }
}

export const storage = new StorageService();
