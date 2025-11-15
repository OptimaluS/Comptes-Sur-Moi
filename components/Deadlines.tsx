import React, { useMemo } from 'react';
import type { Account, RecurringTransaction, Transaction, DeletableItem } from '../types';
import { getNextDueDate } from '../utils';

interface DeadlinesProps {
    recurringTransactions: RecurringTransaction[];
    transactions: Transaction[];
    accounts: Account[];
    handleOpenRecurringTxModal: (tx?: RecurringTransaction | null) => void;
    handleDeleteRequest: (item: DeletableItem, message?: string) => void;
}

type DeadlineStatus = 'overdue' | 'dueSoon' | 'upcoming';

const StatusBadge: React.FC<{ status: DeadlineStatus }> = ({ status }) => {
    const styles: Record<DeadlineStatus, { text: string; classes: string }> = {
        overdue: { text: 'En Retard', classes: 'bg-red-100 text-red-800' },
        dueSoon: { text: 'À Payer', classes: 'bg-amber-100 text-amber-800' },
        upcoming: { text: 'À venir', classes: 'bg-gray-100 text-gray-800' },
    };
    
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status].classes}`}>
            {styles[status].text}
        </span>
    );
};


const Deadlines: React.FC<DeadlinesProps> = ({ recurringTransactions, transactions, accounts, handleOpenRecurringTxModal, handleDeleteRequest }) => {

    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.name])), [accounts]);

    const allDeadlines = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return recurringTransactions
            .map(rule => {
                const nextDueDate = getNextDueDate(rule, transactions);
                if (!nextDueDate) return null;

                const diffTime = nextDueDate.getTime() - today.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let status: DeadlineStatus = 'upcoming';
                if (daysRemaining < 0) {
                    status = 'overdue';
                } else if (rule.reminderDays !== undefined && daysRemaining <= rule.reminderDays) {
                    status = 'dueSoon';
                }

                return {
                    ...rule,
                    nextDueDate,
                    daysRemaining,
                    status,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.nextDueDate!.getTime() - b.nextDueDate!.getTime());
    }, [recurringTransactions, transactions]);
    
    const getDaysRemainingText = (days: number): string => {
        if (days < 0) return `En retard de ${Math.abs(days)} jour(s)`;
        if (days === 0) return "Aujourd'hui";
        if (days === 1) return "Demain";
        return `Dans ${days} jours`;
    };

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900">Échéances</h2>
                <button 
                    onClick={() => handleOpenRecurringTxModal()} 
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span>Ajouter une échéance</span>
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date d'échéance</th>
                                <th scope="col" className="px-6 py-3">Jours Restants</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3">Compte</th>
                                <th scope="col" className="px-6 py-3">Montant</th>
                                <th scope="col" className="px-6 py-3">Statut</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allDeadlines.map(rt => (
                                <tr key={rt.id} className="bg-white border-b hover:bg-gray-50 last:border-b-0">
                                    <td className="px-6 py-4 font-bold text-gray-900">{rt.nextDueDate!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                    <td className="px-6 py-4 font-medium text-gray-600">{getDaysRemainingText(rt.daysRemaining)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{rt.description}</td>
                                    <td className="px-6 py-4">{accountMap.get(rt.accountId)}</td>
                                    <td className={`px-6 py-4 font-semibold ${rt.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {rt.amount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={rt.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpenRecurringTxModal(rt)} className="p-2 text-gray-400 hover:text-indigo-600" aria-label="Modifier l'échéance">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.036 6.536z" /></svg>
                                        </button>
                                        <button onClick={() => handleDeleteRequest({ type: 'recurringTransaction', data: rt })} className="p-2 text-gray-400 hover:text-red-500" aria-label="Supprimer l'échéance">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {allDeadlines.length === 0 && (
                         <div className="text-center py-16 px-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-4 text-xl font-semibold text-gray-700">Aucune échéance définie</h3>
                            <p className="mt-1 text-gray-500">Cliquez sur "Ajouter une échéance" pour commencer.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Deadlines;