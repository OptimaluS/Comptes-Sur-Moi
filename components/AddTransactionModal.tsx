import React, { useState, useEffect, useMemo } from 'react';
import type { Account, Transaction, Category, Split } from '../types';
import { TransactionType, UNCATEGORIZED, SPLIT_TRANSACTION } from '../types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id'>) => void;
  account?: Account | null;
  accounts?: Account[];
  transactionToEdit?: Transaction | null;
  prefilledData?: Partial<Omit<Transaction, 'id' | 'type' | 'category' | 'accountId'>> & { amount?: number } | null;
  categories: Category[];
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave, account, accounts = [], transactionToEdit, prefilledData, categories }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<Array<{category: string, amount: string}>>([{ category: '', amount: '' }]);

  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  const isEditing = !!transactionToEdit;
  const canSelectAccount = !account && accounts.length > 0;

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
      newErrors.amount = 'Le montant est requis.';
      isValid = false;
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Veuillez saisir un nombre positif.';
      isValid = false;
    }
    if (date.trim() === '') {
      newErrors.date = 'La date est requise.';
      isValid = false;
    } else if (isNaN(new Date(date).getTime())) {
      newErrors.date = 'Format de date invalide.';
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

  const handleSuggestCategory = async () => {
    if (description.trim() && !category.trim() && !isEditing) {
      setIsSuggestingCategory(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const categoryNames = categories.filter(c => c.name !== 'Solde Initial').map(c => c.name).join(', ');
        const prompt = `Voici une liste de catégories de dépenses possibles : ${categoryNames}. Suggère la catégorie la plus pertinente (un seul mot ou une courte expression) pour une transaction avec la description suivante : "${description}". Réponds uniquement avec le nom de la catégorie.`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const suggestedCategoryText = response.text;
        if (typeof suggestedCategoryText === 'string') {
          const suggestedCategory = suggestedCategoryText.trim();
          if (suggestedCategory) {
            const matchingCategory = categories.find(c => c.name.toLowerCase() === suggestedCategory.toLowerCase());
            if (matchingCategory) {
              setCategory(matchingCategory.name);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la suggestion de catégorie:", error);
      } finally {
        setIsSuggestingCategory(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
        if (isEditing && transactionToEdit) {
            setDescription(transactionToEdit.description);
            setAmount(String(Math.abs(transactionToEdit.amount)));
            setType(transactionToEdit.type);
            setDate(formatDateForInput(new Date(transactionToEdit.date)));
            setSelectedAccountId(transactionToEdit.accountId);

            if (transactionToEdit.splits && transactionToEdit.splits.length > 0) {
                setIsSplit(true);
                setSplits(transactionToEdit.splits.map(s => ({ category: s.category, amount: String(s.amount) })));
                setCategory('');
            } else {
                setIsSplit(false);
                setSplits([{ category: '', amount: '' }]);
                setCategory(transactionToEdit.category === UNCATEGORIZED ? '' : transactionToEdit.category);
            }
        } else if (prefilledData) {
            setDescription(prefilledData.description || '');
            setAmount(prefilledData.amount ? String(Math.abs(prefilledData.amount)) : '');
            setType(TransactionType.EXPENSE);
            setCategory('');
            setDate(prefilledData.date ? formatDateForInput(new Date(prefilledData.date)) : formatDateForInput(new Date()));
            setSelectedAccountId(account?.id || (accounts.length > 0 ? accounts[0].id : ''));
            setIsSplit(false);
            setSplits([{ category: '', amount: '' }]);
        } else {
            setDescription('');
            setAmount('');
            setType(TransactionType.EXPENSE);
            setCategory('');
            setDate(formatDateForInput(new Date()));
            setSelectedAccountId(account?.id || (accounts.length > 0 ? accounts[0].id : ''));
            setIsSplit(false);
            setSplits([{ category: '', amount: '' }]);
        }
        setErrors({});
    }
    // The form should only reset when the modal is opened or the data changes.
    // `accounts` and `isEditing` can cause re-renders that reset user input.
    // They are safe to exclude because they will be up-to-date when the effect runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, transactionToEdit, prefilledData, account]);

  const handleSplitChange = (index: number, field: 'category' | 'amount', value: string) => {
    const newSplits = [...splits];
    newSplits[index][field] = value;
    setSplits(newSplits);
  };
  const addSplit = () => setSplits([...splits, { category: '', amount: '' }]);
  const removeSplit = (index: number) => setSplits(splits.filter((_, i) => i !== index));

  if (!isOpen) return null;

  const isFormValid = description.trim() !== '' && amount.trim() !== '' && date.trim() !== '' && selectedAccountId && (isSplit ? splits.every(s => s.category && s.amount) && remainingToSplit === 0 : category.trim() !== '') && Object.values(errors).every(e => !e);
  
  const currentAccount = account || accounts.find(a => a.id === selectedAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isSplit) {
        onSave({
            description,
            amount: parseFloat(amount) * (type === TransactionType.EXPENSE ? -1 : 1),
            type,
            category: SPLIT_TRANSACTION,
            splits: splits.map(s => ({ ...s, amount: parseFloat(s.amount) || 0 })),
            date: new Date(`${date}T00:00:00`),
            accountId: selectedAccountId,
        });
    } else {
        onSave({
            description,
            amount: parseFloat(amount) * (type === TransactionType.EXPENSE ? -1 : 1),
            type,
            category: category.trim(),
            date: new Date(`${date}T00:00:00`),
            accountId: selectedAccountId,
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" role="document">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Modifier la Transaction' : 'Nouvelle Transaction'}</h2>
            {currentAccount && !canSelectAccount && (
                <p className="text-sm text-gray-500">Pour le compte: <span className="font-semibold text-gray-700">{currentAccount.name}</span></p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {canSelectAccount && (
            <div>
              <label htmlFor="tx-account" className="block text-sm font-medium text-gray-600 mb-1">Compte</label>
              <select id="tx-account" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.account ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} required>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
               {errors.account && <p className="mt-1 text-sm text-red-500">{errors.account}</p>}
            </div>
          )}
          <div>
            <label htmlFor="tx-description" className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <input id="tx-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={handleSuggestCategory} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} placeholder="ex: Courses, Salaire..." required />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>
          <div className="flex gap-2">
              <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`w-full py-2 rounded-lg font-semibold transition-colors ${type === TransactionType.EXPENSE ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Dépense</button>
              <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`w-full py-2 rounded-lg font-semibold transition-colors ${type === TransactionType.INCOME ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Revenu</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="tx-amount" className="block text-sm font-medium text-gray-600 mb-1">Montant (€)</label>
                  <input id="tx-amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} placeholder="0.00" required />
                   {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
              </div>
              <div>
                  <label htmlFor="tx-date" className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                  <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} onBlur={validate} className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 [color-scheme:light] ${errors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} required />
                   {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
              </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                 <label htmlFor="tx-category" className="text-sm font-medium text-gray-600">Catégorie</label>
                 <button type="button" onClick={() => setIsSplit(!isSplit)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">{isSplit ? 'Transaction simple' : 'Diviser'}</button>
            </div>
            
            {isSplit ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                    {splits.map((split, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input list="categories-list" value={split.category} onChange={e => handleSplitChange(index, 'category', e.target.value)} className="w-full bg-white border-gray-300 rounded-md px-2 py-1.5 text-sm" placeholder="Catégorie"/>
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
                <div className="relative">
                    <input id="tx-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} onBlur={validate} list="categories-list" className={`w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 pr-10 ${errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} placeholder="ex: Alimentation" required />
                    {isSuggestingCategory && (<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>)}
                </div>
            )}
             {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
             {errors.splits && <p className="mt-1 text-sm text-red-500">{errors.splits}</p>}
             <datalist id="categories-list">
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

export default AddTransactionModal;