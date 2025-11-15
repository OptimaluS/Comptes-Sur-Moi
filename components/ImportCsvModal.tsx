import React, { useState, useEffect, useMemo } from 'react';
import type { Account, Transaction } from '../types';
import { TransactionType, UNCATEGORIZED } from '../types';
import { parseCSV, parseDate } from '../utils';

type ParsedTransaction = Omit<Transaction, 'id' | 'accountId'>;

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountId: string, transactions: ParsedTransaction[], newCategoryNames: string[]) => void;
  accounts: Account[];
  csvContent: string | null;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose, onSave, accounts, csvContent }) => {
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [transactionsToImport, setTransactionsToImport] = useState<ParsedTransaction[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Initialiser le compte sélectionné
            if (accounts.length > 0) {
                setSelectedAccountId(accounts[0].id);
            } else {
                setSelectedAccountId('');
            }

            // Parser le contenu CSV
            if (csvContent) {
                try {
                    const parsed = parseCSV(csvContent);
                    // Ignorer l'en-tête (la première ligne)
                    const dataRows = parsed.slice(1);

                    const transactions: ParsedTransaction[] = dataRows.map((row, index) => {
                        const [dateStr, description, amountStr, category] = row;

                        if (!dateStr || !description || !amountStr) {
                            throw new Error(`Ligne ${index + 2}: Données manquantes. Format attendu: Date,Description,Montant,Catégorie (optionnel)`);
                        }

                        const date = parseDate(dateStr);
                        if (!date) {
                            throw new Error(`Ligne ${index + 2}: Format de date invalide "${dateStr}".`);
                        }
                        
                        const amount = parseFloat(amountStr.replace(',', '.').replace(/\s/g, ''));
                        if (isNaN(amount)) {
                            throw new Error(`Ligne ${index + 2}: Montant invalide "${amountStr}".`);
                        }

                        return {
                            date,
                            description: description.trim(),
                            amount,
                            type: amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                            category: category?.trim() || UNCATEGORIZED,
                        };
                    });
                    
                    setTransactionsToImport(transactions);
                    setParseError(null);
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Erreur inconnue lors du parsing du CSV.";
                    setParseError(message);
                    setTransactionsToImport([]);
                }
            }
        }
    // This effect initializes the modal state.
    // `accounts` is excluded from dependencies to prevent resetting form state
    // when other parts of the app cause it to update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, csvContent]);

    const handleSave = () => {
        if (!selectedAccountId || transactionsToImport.length === 0) return;

        const newCategoryNames = Array.from(new Set(transactionsToImport.map(t => t.category)));
        onSave(selectedAccountId, transactionsToImport, newCategoryNames);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 flex flex-col" style={{maxHeight: '90vh'}} role="document">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900">Importer des Transactions CSV</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
                    <p><b>Format attendu :</b> Le fichier CSV doit contenir les colonnes dans cet ordre : <b>Date</b>, <b>Description</b>, <b>Montant</b>. Une colonne <b>Catégorie</b> est optionnelle.</p>
                </div>

                {parseError ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p className="font-bold">Erreur de lecture du fichier</p>
                        <p>{parseError}</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label htmlFor="import-account" className="block text-sm font-medium text-gray-600 mb-1">Importer vers le compte</label>
                            <select
                                id="import-account"
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 border-gray-300 focus:ring-indigo-500"
                                disabled={accounts.length === 0}
                            >
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-grow overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-2">Date</th>
                                        <th scope="col" className="px-4 py-2">Description</th>
                                        <th scope="col" className="px-4 py-2">Catégorie</th>
                                        <th scope="col" className="px-4 py-2 text-right">Montant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionsToImport.map((tx, index) => (
                                        <tr key={index} className="bg-white border-b last:border-b-0">
                                            <td className="px-4 py-2">{tx.date.toLocaleDateString('fr-FR')}</td>
                                            <td className="px-4 py-2 font-medium text-gray-800">{tx.description}</td>
                                            <td className="px-4 py-2 text-gray-600">{tx.category}</td>
                                            <td className={`px-4 py-2 text-right font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                
                <div className="flex justify-between items-center pt-6 mt-auto shrink-0">
                    <span className="text-sm text-gray-500">{transactionsToImport.length} transaction(s) prête(s) à être importée(s).</span>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg transition-colors">Annuler</button>
                        <button 
                            type="button" 
                            onClick={handleSave} 
                            disabled={!selectedAccountId || transactionsToImport.length === 0 || !!parseError}
                            className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            Importer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportCsvModal;