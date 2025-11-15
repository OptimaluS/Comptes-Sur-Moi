import React, { useState, useEffect } from 'react';
import type { Account, Goal } from '../types';
import { AccountType } from '../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Goal, 'id'>) => void;
  goalToEdit: Goal | null;
  accounts: Account[];
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSave, goalToEdit, accounts }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  
  const savingsAccounts = accounts.filter(acc => acc.type === AccountType.SAVINGS);

  const isEditing = !!goalToEdit;

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;

    if (name.trim() === '') {
        newErrors.name = 'Le nom est requis.';
        isValid = false;
    }
    if (targetAmount.trim() === '') {
      newErrors.targetAmount = 'Le montant est requis.';
      isValid = false;
    } else if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      newErrors.targetAmount = 'Veuillez saisir un nombre positif.';
      isValid = false;
    }
    if (linkedAccountId === '') {
        newErrors.linkedAccountId = 'Veuillez lier un compte épargne.';
        isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (isOpen) {
        if (goalToEdit) {
            setName(goalToEdit.name);
            setTargetAmount(String(goalToEdit.targetAmount));
            setLinkedAccountId(goalToEdit.linkedAccountId);
        } else {
            setName('');
            setTargetAmount('');
            setLinkedAccountId(savingsAccounts.length > 0 ? savingsAccounts[0].id : '');
        }
        setErrors({});
    }
    // The form should only reset when the modal is opened or the item to edit changes.
    // `savingsAccounts` is derived from `accounts` and can cause re-renders that reset user input.
    // It's safe to exclude it here because it will be up-to-date when the effect runs on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
        return;
    }
    onSave({
      name,
      targetAmount: parseFloat(targetAmount),
      linkedAccountId,
    });
  };

  const isFormValid = name.trim() !== '' && targetAmount.trim() !== '' && linkedAccountId && Object.values(errors).every(e => !e);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" role="document">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? "Modifier l'objectif" : "Nouvel objectif"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="goal-name" className="block text-sm font-medium text-gray-600 mb-1">Nom de l'objectif</label>
            <input
              id="goal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={validate}
              className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
              placeholder="ex: Voyage au Japon"
              required
            />
             {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

           <div>
                <label htmlFor="goal-target-amount" className="block text-sm font-medium text-gray-600 mb-1">Montant cible (€)</label>
                <input
                    id="goal-target-amount"
                    type="text"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    onBlur={validate}
                    className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.targetAmount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                    placeholder="5000"
                    required
                />
                {errors.targetAmount && <p className="mt-1 text-sm text-red-500">{errors.targetAmount}</p>}
            </div>

          <div>
            <label htmlFor="goal-account" className="block text-sm font-medium text-gray-600 mb-1">Lier au compte épargne</label>
            <select
              id="goal-account"
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              onBlur={validate}
              className={`w-full bg-gray-100 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition appearance-none bg-no-repeat bg-right pr-8 ${errors.linkedAccountId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} ${linkedAccountId === '' ? 'text-gray-400' : 'text-gray-900'}`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
              required
            >
              <option value="" disabled>Sélectionnez un compte...</option>
              {savingsAccounts.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.linkedAccountId && <p className="mt-1 text-sm text-red-500">{errors.linkedAccountId}</p>}
            {savingsAccounts.length === 0 && <p className="mt-1 text-sm text-amber-600">Vous devez d'abord créer un compte de type "Épargne".</p>}
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg transition-colors">Annuler</button>
            <button type="submit" disabled={!isFormValid || savingsAccounts.length === 0} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;