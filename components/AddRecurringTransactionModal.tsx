import React, { useState, useEffect, useMemo } from 'react';
import type { Account, RecurringTransaction, Category } from '../types';
import { TransactionType, Frequency, UNCATEGORIZED, SPLIT_TRANSACTION } from '../types';

interface AddRecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<RecurringTransaction, 'id'>) => void;
  accounts: Account[];
  recurringTransactionToEdit: RecurringTransaction | null;
  categories: Category[];
}

const AddRecurringTransactionModal: React.FC<AddRecurringTransactionModalProps> = ({ isOpen, onClose, onSave, accounts, recurringTransactionToEdit, categories }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reminderDays, setReminderDays] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<Array<{category: string, amount: string}>>([{ category: '', amount: '' }]);
  
  const isEditing = !!recurringTransactionToEdit;

  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];
  
  const { remainingToSplit, totalSplitAmount } = useMemo(() => {
    const totalAmount = parseFloat(amount) || 0;
    const currentSplitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    return {
        remainingToSplit: totalAmount - currentSplitTotal,
        totalSplitAmount: currentSplitTotal,
    };
  }, [amount, splits]);
  
  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;

    if (description.trim() === '') {
        newErrors.description = "La description est requise.";
        isValid = false;
    }
    if (amount.trim() === '') {
        newErrors.amount = "Le montant est requis.";
        isValid = false;
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
        newErrors.amount = "Veuillez saisir un nombre positif.";
        isValid = false;
    }
     if (startDate.trim() === '') {
        newErrors.startDate = 'La date de début est requise.';
        isValid = false;
    } else if (isNaN(new Date(startDate).getTime())) {
        newErrors.startDate = 'Format de date de début invalide.';
        isValid = false;
    }
    if (endDate.trim() !== '' && new Date(endDate) < new Date(startDate)) {
        newErrors.endDate = 'La date de fin ne peut être antérieure à la date de début.';
        isValid = false;
    }
    if (reminderDays.trim() !== '' && (isNaN(Number(reminderDays)) || Number(reminderDays) < 0)) {
        newErrors.reminderDays = 'Veuillez saisir un nombre positif.';
        isValid = false;
    }
    if (!selectedAccountId) {
        newErrors.account = "Un compte doit être sélectionné.";
        isValid = false;
    }
    if (isSplit) {
        if (Math.abs(remainingToSplit) > 0.001) {
            newErrors.splits = `La somme des divisions (${totalSplitAmount.toFixed(2)}€) doit être égale au montant total (${(parseFloat(amount) || 0).toFixed(2)}€).`;
            isValid = false;
        }
        if (splits.some(s => s.category.trim() === '' || (parseFloat(s.amount) || 0) <= 0)) {
            newErrors.splits = newErrors.splits ? newErrors.splits + " Chaque division doit avoir une catégorie et un montant positif." : "Chaque division doit avoir une catégorie et un montant positif.";
            isValid = false;
        }
    } else {
        if (category.trim() === '') {
            newErrors.category = "La catégorie est requise.";
            isValid = false;
        }
    }
    
    setErrors(newErrors);
    return isValid;
};


  useEffect(() => {
    if (isOpen) {
        if (isEditing && recurringTransactionToEdit) {
            setDescription(recurringTransactionToEdit.description);
            setAmount(String(Math.abs(recurringTransactionToEdit.amount)));
            setType(recurringTransactionToEdit.type);
            setSelectedAccountId(recurringTransactionToEdit.accountId);
            setFrequency(recurringTransactionToEdit.frequency);
            setStartDate(formatDateForInput(new Date(recurringTransactionToEdit.startDate)));
            setEndDate(recurringTransactionToEdit.endDate ? formatDateForInput(new Date(recurringTransactionToEdit.endDate)) : '');
            setReminderDays(recurringTransactionToEdit.reminderDays ? String(recurringTransactionToEdit.reminderDays) : '');
             if (recurringTransactionToEdit.splits && recurringTransactionToEdit.splits.length > 0) {
                setIsSplit(true);
                setSplits(recurringTransactionToEdit.splits.map(s => ({ category: s.category, amount: String(s.amount) })));
                setCategory('');
            } else {
                setIsSplit(false);
                setSplits([{ category: '', amount: '' }]);
                setCategory(recurringTransactionToEdit.category === UNCATEGORIZED ? '' : recurringTransactionToEdit.category);
            }
        } else {
            setDescription('');
            setAmount('');
            setType(TransactionType.EXPENSE);
            setCategory('');
            setSelectedAccountId(accounts.length > 0 ? accounts[0].id : '');
            setFrequency(Frequency.MONTHLY);
            setStartDate(formatDateForInput(new Date()));
            setEndDate('');
            setReminderDays('');
            setIsSplit(false);
            setSplits([{ category: '', amount: '' }]);
        }
        setErrors({});
    }
    // The form should only reset when the modal is opened or the item to edit changes.
    // `accounts` and `isEditing` can cause re-renders that reset user input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, recurringTransactionToEdit]);
  
  const handleSplitChange = (index: number, field: 'category' | 'amount', value: string) => {
    const newSplits = [...splits];
    newSplits[index][field] = value;
    setSplits(newSplits);
  };
  const addSplit = () => setSplits([...splits, { category: '', amount: '' }]);
  const removeSplit = (index: number) => setSplits(splits.filter((_, i) => i !== index));

  if (!isOpen) return null;

  const isFormValid = description.trim() !== '' && amount.trim() !== '' && selectedAccountId && startDate && (isSplit ? splits.every(s => s.category && s.amount) && remainingToSplit === 0 : category.trim() !== '') && Object.values(errors).every(e => !e);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const commonData = {
        description,
        amount: parseFloat(amount) * (type === TransactionType.EXPENSE ? -1 : 1),
        type,
        accountId: selectedAccountId,
        frequency,
        startDate: new Date(`${startDate}T00:00:00`),
        endDate: endDate ? new Date(`${endDate}T00:00:00`) : undefined,
        reminderDays: reminderDays ? parseInt(reminderDays, 10) : undefined,
    };
    
    if (isSplit) {
        onSave({
          ...commonData,
          category: SPLIT_TRANSACTION,
          splits: splits.map(s => ({ ...s, amount: parseFloat(s.amount) || 0 })),
        });
    } else {
        onSave({
          ...commonData,
          category: category.trim(),
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" role="document">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Modifier la Règle' : 'Nouvelle Règle Récurrente'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="rtx-account" className="block text-sm font-medium text-gray-600 mb-1">Compte</label>
            <select id="rtx-account" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.account ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} required>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
            {errors.account && <p className="mt-1 text-sm text-red-500">{errors.account}</p>}
          </div>
          <div>
            <label htmlFor="rtx-description" className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <input id="rtx-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} placeholder="ex: Loyer, Abonnement Netflix..." required />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>
          <div className="flex gap-2">
              <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`w-full py-2 rounded-lg font-semibold transition-colors ${type === TransactionType.EXPENSE ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Dépense</button>
              <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`w-full py-2 rounded-lg font-semibold transition-colors ${type === TransactionType.INCOME ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Revenu</button>
          </div>
           <div>
              <label htmlFor="rtx-amount" className="block text-sm font-medium text-gray-600 mb-1">Montant (€)</label>
              <input id="rtx-amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} placeholder="0.00" required />
              {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
          </div>
          <div>
            <label htmlFor="rtx-frequency" className="block text-sm font-medium text-gray-600 mb-1">Fréquence</label>
            <select id="rtx-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
              {Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="rtx-start-date" className="block text-sm font-medium text-gray-600 mb-1">Date de début</label>
                  <input id="rtx-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 [color-scheme:light] ${errors.startDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} required />
                  {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
              </div>
              <div>
                  <label htmlFor="rtx-end-date" className="block text-sm font-medium text-gray-600 mb-1">Date de fin (opt.)</label>
                  <input id="rtx-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 [color-scheme:light] ${errors.endDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
                  {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              </div>
          </div>
          <div>
            <label htmlFor="rtx-reminder" className="block text-sm font-medium text-gray-600 mb-1">
                Rappel (jours avant l'échéance) <span className="text-gray-400">(Optionnel)</span>
            </label>
            <input
                id="rtx-reminder"
                type="number"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                onBlur={validate}
                className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.reminderDays ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                placeholder="ex: 5"
                min="0"
            />
            {errors.reminderDays && <p className="mt-1 text-sm text-red-500">{errors.reminderDays}</p>}
          </div>
           <div>
            <div className="flex justify-between items-center mb-1">
                 <label className="text-sm font-medium text-gray-600">Catégorie</label>
                 <button type="button" onClick={() => setIsSplit(!isSplit)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">{isSplit ? 'Transaction simple' : 'Diviser'}</button>
            </div>
            {isSplit ? (
                 <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                    {splits.map((split, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input list="recurring-categories-list" value={split.category} onChange={e => handleSplitChange(index, 'category', e.target.value)} className="w-full bg-white border-gray-300 rounded-md px-2 py-1.5 text-sm" placeholder="Catégorie"/>
                            <input type="text" value={split.amount} onChange={e => handleSplitChange(index, 'amount', e.target.value)} className="w-28 bg-white border-gray-300 rounded-md px-2 py-1.5 text-sm" placeholder="Montant"/>
                            <button type="button" onClick={() => removeSplit(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-50" disabled={splits.length <= 1}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button>
                        </div>
                    ))}
                     <button type="button" onClick={addSplit} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Ajouter une catégorie</button>
                     <div className={`text-xs text-right mt-1 ${remainingToSplit !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Restant à catégoriser : {remainingToSplit.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}
                     </div>
                </div>
            ) : (
                <input id="rtx-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} onBlur={validate} list="recurring-categories-list" className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} placeholder="ex: Logement" required />
            )}
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
            {errors.splits && <p className="mt-1 text-sm text-red-500">{errors.splits}</p>}
            <datalist id="recurring-categories-list">
                {categories.filter(cat => cat.name !== 'Solde Initial').map(cat => <option key={cat.id} value={cat.name} />)}
            </datalist>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg transition-colors">Annuler</button>
            <button type="submit" disabled={!isFormValid} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">{isEditing ? 'Modifier' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecurringTransactionModal;