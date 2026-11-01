import React, { useState } from 'react';
import { Employee, UserRole } from '../types';
import { storage } from '../services/storage';
import { UserCheck, Check, Building2, UserPlus, Trash2, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentEmployee: Employee;
  onSelectEmployee: (emp: Employee) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  employees,
  currentEmployee,
  onSelectEmployee,
}) => {
  if (!isOpen) return null;

  const [selectedEmpId, setSelectedEmpId] = useState<string>(currentEmployee.id);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New employee state
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('Оператор сортировочной линии');
  const [newShift, setNewShift] = useState<'Смена А' | 'Смена Б' | 'Дневная'>('Смена А');

  const handleConfirm = () => {
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (emp) {
      onSelectEmployee(emp);
      onClose();
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = storage.addEmployee({
      name: newName.trim(),
      role: newRole,
      shift: newShift,
      active: true,
    });

    setSelectedEmpId(created.id);
    onSelectEmployee(created);
    setIsAddingNew(false);
    setNewName('');
  };

  const handleDeleteEmployee = (empId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (employees.length <= 1) {
      alert('В системе должен оставаться хотя бы один сотрудник');
      return;
    }
    if (window.confirm(`Удалить сотрудника «${name}» из списка?`)) {
      storage.deleteEmployee(empId);
      if (selectedEmpId === empId) {
        const remaining = employees.filter((emp) => emp.id !== empId);
        if (remaining[0]) {
          setSelectedEmpId(remaining[0].id);
        }
      }
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Старший товаровед':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Контролер ОТК':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Заведующий складом':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
      {/* Modal with fixed maximum height and vertical scrolling */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200 animate-in fade-in zoom-in duration-150">
        
        {/* Header - Fixed */}
        <div className="bg-blue-950 text-white p-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-300" />
              <h2 className="text-base font-bold">
                Выбор сотрудника и должности
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Гипермаркет «Семейный» · Разграничение доступа к операциям
          </p>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Сотрудники смены ({employees.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddingNew ? 'Отмена' : '+ Добавить сотрудника'}</span>
            </button>
          </div>

          {/* Form to add a new employee */}
          {isAddingNew && (
            <form
              onSubmit={handleAddEmployee}
              className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3 text-xs"
            >
              <div className="font-bold text-blue-950">Новый сотрудник:</div>
              <div>
                <label className="block text-neutral-700 mb-1 font-medium">ФИО сотрудника</label>
                <input
                  type="text"
                  placeholder="Например: Морозов Андрей Васильевич"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-700 mb-1 font-medium">Должность</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs"
                  >
                    <option value="Оператор сортировочной линии">Оператор сортировки</option>
                    <option value="Старший товаровед">Старший товаровед</option>
                    <option value="Контролер ОТК">Контролер ОТК</option>
                    <option value="Заведующий складом">Заведующий складом</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1 font-medium">Смена</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs"
                  >
                    <option value="Смена А">Смена А</option>
                    <option value="Смена Б">Смена Б</option>
                    <option value="Дневная">Дневная</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 border border-neutral-300 bg-white rounded-lg text-neutral-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800"
                >
                  Сохранить
                </button>
              </div>
            </form>
          )}

          {/* List of employees */}
          <div className="space-y-2">
            {employees.map((emp) => {
              const isSelected = emp.id === selectedEmpId;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-900 bg-blue-50/70 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-blue-900 text-white'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>

                    <div>
                      <div className="font-bold text-neutral-900 text-sm">
                        {emp.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-semibold border ${getRoleBadgeStyle(
                            emp.role
                          )}`}
                        >
                          {emp.role}
                        </span>
                        <span className="text-neutral-500 text-2xs">· {emp.shift}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEmployee(emp.id, emp.name, e)}
                        className="p-1 text-neutral-300 hover:text-rose-600 rounded"
                        title="Удалить сотрудника"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions - Fixed at Bottom */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 shrink-0 flex items-center justify-between gap-3">
          <div className="text-2xs text-neutral-500">
            Выбран: <strong>{employees.find((e) => e.id === selectedEmpId)?.name}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Войти</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
