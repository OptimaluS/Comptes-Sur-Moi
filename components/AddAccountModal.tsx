
import React, { useState, useEffect } from 'react';
import type { Account } from '../types';
import { AccountType } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; type: AccountType; balance: number; balanceDate: Date; lowBalanceAlertThreshold?: number; }) => void;
  accountToEdit: Account | null;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSave, accountToEdit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType | ''>('');
  const [balance, setBalance] = useState('');
  const [balanceDate, setBalanceDate] = useState('');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  const isEditing = !!accountToEdit;

  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;

    if (name.trim() === '') {
        newErrors.name = 'Le nom est requis.';
        isValid = false;
    }
    if (type === '') {
      newErrors.type = 'Veuillez sélectionner un type.';
      isValid = false;
    }
    if (balance.trim() === '') {
      newErrors.balance = 'Le solde est requis.';
      isValid = false;
    } else if (isNaN(Number(balance))) {
      newErrors.balance = 'Veuillez saisir un nombre valide.';
      isValid = false;
    }
    if (balanceDate.trim() === '') {
        newErrors.balanceDate = 'La date est requise.';
        isValid = false;
    } else if (isNaN(new Date(balanceDate).getTime())) {
        newErrors.balanceDate = 'Format de date invalide.';
        isValid = false;
    }
    if (lowBalanceThreshold.trim() !== '' && isNaN(Number(lowBalanceThreshold))) {
        newErrors.lowBalanceThreshold = 'Veuillez saisir un nombre valide.';
        isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (isOpen) {
        if (accountToEdit) {
            const sortedHistory = [...accountToEdit.balanceHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const currentBalance = sortedHistory[0];

            setName(accountToEdit.name);
            setType(accountToEdit.type);
            if (currentBalance) {
                setBalance(String(currentBalance.amount));
                setBalanceDate(formatDateForInput(currentBalance.date));
            } else {
                setBalance('0');
                setBalanceDate(formatDateForInput(new Date()));
            }
            setLowBalanceThreshold(accountToEdit.lowBalanceAlertThreshold ? String(accountToEdit.lowBalanceAlertThreshold) : '');
        } else {
            setName('');
            setType('');
            setBalance('');
            setBalanceDate(formatDateForInput(new Date()));
            setLowBalanceThreshold('');
        }
        setErrors({});
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const isFormValid = name.trim() !== '' && type.trim() !== '' && balance.trim() !== '' && balanceDate.trim() !== '' && Object.values(errors).every(e => !e);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
        return;
    }
    
    const correctedDate = new Date(`${balanceDate}T00:00:00`);

    onSave({
      id: accountToEdit?.id,
      name,
      type: type as AccountType,
      balance: parseFloat(balance),
      balanceDate: correctedDate,
      lowBalanceAlertThreshold: lowBalanceThreshold.trim() ? parseFloat(lowBalanceThreshold) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" role="document">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Modifier le compte' : 'Ajouter un nouveau compte'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="account-name" className="block text-sm font-medium text-gray-600 mb-1">Nom du compte</label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={validate}
              className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
              placeholder="ex: Compte Courant"
              required
            />
             {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="account-type" className="block text-sm font-medium text-gray-600 mb-1">Type de compte</label>
            <select
              id="account-type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              onBlur={validate}
              className={`w-full bg-gray-100 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition appearance-none bg-no-repeat bg-right pr-8 ${errors.type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} ${type === '' ? 'text-gray-400' : 'text-gray-900'}`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
              required
              aria-invalid={!!errors.type}
            >
              <option value="" disabled>Sélectionnez un type...</option>
              {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="account-balance" className="block text-sm font-medium text-gray-600 mb-1">
                    {isEditing ? 'Nouveau solde (€)' : 'Solde initial (€)'}
                </label>
                <input
                    id="account-balance"
                    type="text"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    onBlur={validate}
                    className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.balance ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                    placeholder="0.00"
                    required
                    aria-invalid={!!errors.balance}
                />
                {errors.balance && <p className="mt-1 text-sm text-red-500">{errors.balance}</p>}
            </div>
            <div>
                <label htmlFor="account-balance-date" className="block text-sm font-medium text-gray-600 mb-1">
                    {isEditing ? 'Date du nouveau solde' : 'Date du solde'}
                </label>
                <input
                id="account-balance-date"
                type="date"
                value={balanceDate}
                onChange={(e) => setBalanceDate(e.target.value)}
                onBlur={validate}
                className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition [color-scheme:light] ${errors.balanceDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                required
                aria-invalid={!!errors.balanceDate}
                />
                 {errors.balanceDate && <p className="mt-1 text-sm text-red-500">{errors.balanceDate}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="low-balance-threshold" className="block text-sm font-medium text-gray-600 mb-1">
                Seuil d'alerte de solde bas (€) <span className="text-gray-400">(Optionnel)</span>
            </label>
            <input
                id="low-balance-threshold"
                type="text"
                value={lowBalanceThreshold}
                onChange={(e) => setLowBalanceThreshold(e.target.value)}
                onBlur={validate}
                className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.lowBalanceThreshold ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                placeholder="ex: 100"
                aria-invalid={!!errors.lowBalanceThreshold}
            />
            {errors.lowBalanceThreshold && <p className="mt-1 text-sm text-red-500">{errors.lowBalanceThreshold}</p>}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg transition-colors">Annuler</button>
            <button type="submit" disabled={!isFormValid} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;