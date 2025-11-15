import React, { useState, useEffect } from 'react';
import type { Account } from '../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { fromAccountId: string; toAccountId: string; amount: number; date: Date; description: string; }) => void;
  accounts: Account[];
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onSave, accounts }) => {
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];
  
  const validate = () => {
    const newErrors: { [key:string]: string | null } = {};
    let isValid = true;

    if (!fromAccountId) {
      newErrors.from = 'Le compte source est requis.';
      isValid = false;
    }
    if (!toAccountId) {
      newErrors.to = 'Le compte destinataire est requis.';
      isValid = false;
    }
    if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
      newErrors.to = 'Le compte destinataire doit être différent du compte source.';
      isValid = false;
    }
    if (amount.trim() === '') {
      newErrors.amount = 'Le montant est requis.';
      isValid = false;
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Veuillez saisir un montant positif.';
      isValid = false;
    }
    if (date.trim() === '') {
      newErrors.date = 'La date est requise.';
      isValid = false;
    } else if (isNaN(new Date(date).getTime())) {
      newErrors.date = 'Format de date invalide.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (isOpen) {
        if (accounts.length > 0) {
            setFromAccountId(accounts[0].id);
            if (accounts.length > 1) {
                const differentAccount = accounts.find(a => a.id !== accounts[0].id);
                setToAccountId(differentAccount ? differentAccount.id : '');
            } else {
                setToAccountId('');
            }
        } else {
            setFromAccountId('');
            setToAccountId('');
        }
        setAmount('');
        setDate(formatDateForInput(new Date()));
        setDescription('');
        setErrors({});
    }
    // This effect should only run when the modal opens to initialize the form.
    // `accounts` is excluded to prevent resetting the form on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  
  // This effect ensures the 'To' account is always different from the 'From' account.
  useEffect(() => {
    if (fromAccountId && toAccountId === fromAccountId) {
        const newToAccount = accounts.find(a => a.id !== fromAccountId);
        setToAccountId(newToAccount ? newToAccount.id : '');
    }
    // We only want this to run when the 'from' account changes.
    // `accounts` and `toAccountId` are available from the render scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAccountId]);


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    onSave({
      fromAccountId,
      toAccountId,
      amount: parseFloat(amount),
      date: new Date(`${date}T00:00:00`),
      description: description.trim(),
    });
  };

  const isFormValid = fromAccountId && toAccountId && fromAccountId !== toAccountId && amount.trim() !== '' && Number(amount) > 0 && date && Object.values(errors).every(e => !e);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" role="document">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Effectuer un virement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="from-account" className="block text-sm font-medium text-gray-600 mb-1">De</label>
              <select id="from-account" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.from ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} required>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              {errors.from && <p className="mt-1 text-sm text-red-500">{errors.from}</p>}
            </div>
            <div>
              <label htmlFor="to-account" className="block text-sm font-medium text-gray-600 mb-1">À</label>
              <select id="to-account" value={toAccountId} onChange={e => setToAccountId(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.to ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} required>
                {accounts.filter(acc => acc.id !== fromAccountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              {errors.to && <p className="mt-1 text-sm text-red-500">{errors.to}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="transfer-amount" className="block text-sm font-medium text-gray-600 mb-1">Montant (€)</label>
              <input id="transfer-amount" type="text" value={amount} onChange={e => setAmount(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} placeholder="0.00" required />
              {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
            </div>
            <div>
              <label htmlFor="transfer-date" className="block text-sm font-medium text-gray-600 mb-1">Date</label>
              <input id="transfer-date" type="date" value={date} onChange={e => setDate(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 [color-scheme:light] ${errors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} required />
              {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="transfer-description" className="block text-sm font-medium text-gray-600 mb-1">Description <span className="text-gray-400">(Optionnel)</span></label>
            <input id="transfer-description" type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ex: Épargne mensuelle" />
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

export default TransferModal;