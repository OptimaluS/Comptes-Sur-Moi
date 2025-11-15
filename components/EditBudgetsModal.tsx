
import React, { useState, useEffect } from 'react';
import type { Category } from '../types';

interface EditBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgets: Record<string, number | undefined>) => void;
  categories: Category[];
}

const incomeCategories = ['Salaire', 'Solde Initial'];

const EditBudgetsModal: React.FC<EditBudgetsModalProps> = ({ isOpen, onClose, onSave, categories }) => {
  const [budgets, setBudgets] = useState<Record<string, string>>({});

  const expenseCategories = categories.filter(c => !incomeCategories.includes(c.name));

  useEffect(() => {
    if (isOpen) {
      const initialBudgets = categories.reduce((acc, cat) => {
        if (cat.budget !== undefined) {
            acc[cat.id] = String(cat.budget);
        }
        return acc;
      }, {} as Record<string, string>);
      setBudgets(initialBudgets);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleBudgetChange = (categoryId: string, value: string) => {
    setBudgets(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSave = () => {
    const newBudgets: Record<string, number | undefined> = {};
    for (const category of categories) {
        const budgetValue = budgets[category.id];
        if (budgetValue && budgetValue.trim() !== '' && !isNaN(parseFloat(budgetValue)) && parseFloat(budgetValue) >= 0) {
            newBudgets[category.id] = parseFloat(budgetValue);
        } else {
            newBudgets[category.id] = undefined;
        }
    }
    onSave(newBudgets);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 flex flex-col" style={{maxHeight: '90vh'}} role="document">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Gérer les budgets mensuels</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto pr-2 -mr-2 space-y-4">
            {expenseCategories.map(category => (
                <div key={category.id} className="flex items-center gap-4">
                     <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xl ${category.color}`}>{category.icon}</div>
                     <label htmlFor={`budget-${category.id}`} className="flex-grow font-semibold text-gray-700">{category.name}</label>
                     <div className="relative w-40">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                            id={`budget-${category.id}`}
                            type="text"
                            value={budgets[category.id] ?? ''}
                            onChange={(e) => handleBudgetChange(category.id, e.target.value)}
                            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2 pl-7 pr-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Aucun budget"
                        />
                    </div>
                </div>
            ))}
        </div>
        <div className="flex justify-end gap-4 pt-6 mt-auto shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg transition-colors">Annuler</button>
            <button type="button" onClick={handleSave} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default EditBudgetsModal;