import React, { useMemo } from 'react';
import type { Account, Goal, DeletableItem } from '../types';

interface GoalsProps {
    goals: Goal[];
    accounts: Account[];
    handleOpenGoalModal: (goal?: Goal | null) => void;
    handleDeleteRequest: (item: DeletableItem, message?: string) => void;
}

const GoalCard: React.FC<{ goal: Goal; account: Account | undefined; onEdit: (goal: Goal) => void; onDelete: (goal: Goal) => void; }> = ({ goal, account, onEdit, onDelete }) => {
    const currentBalance = useMemo(() => {
        if (!account) return 0;
        return [...account.balanceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.amount ?? 0;
    }, [account]);

    const targetAmount = goal.targetAmount;
    const progress = targetAmount > 0 ? Math.min(100, (currentBalance / targetAmount) * 100) : 0;
    const remaining = Math.max(0, targetAmount - currentBalance);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-xl font-bold text-gray-800">{goal.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Lié au compte : {account?.name || 'Inconnu'}</p>
                </div>
                <div className="flex items-center">
                    <button onClick={() => onEdit(goal)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors" aria-label="Modifier l'objectif">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => onDelete(goal)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors" aria-label="Supprimer l'objectif">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>

            <div className="mt-auto">
                <div className="text-right mt-4">
                    <p className="font-bold text-2xl text-indigo-600">{Math.floor(progress)}%</p>
                    <p className="text-xs text-gray-500">atteint</p>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex justify-between text-sm">
                    <div className="font-medium text-gray-600">
                        <span className="font-bold text-gray-800">{currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span> épargné
                    </div>
                    <div className="font-medium text-gray-500">
                        Objectif: {targetAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200/60 text-center">
                    <p className="text-sm text-green-700 font-semibold">
                        {remaining > 0 
                            ? `${remaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} restants pour atteindre votre objectif !`
                            : "🎉 Objectif atteint ! Félicitations !"}
                    </p>
                </div>
            </div>
        </div>
    );
};


const Goals: React.FC<GoalsProps> = ({ goals, accounts, handleOpenGoalModal, handleDeleteRequest }) => {
    
    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900">Suivi des Objectifs</h2>
                 <button 
                    onClick={() => handleOpenGoalModal()} 
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span>Ajouter un objectif</span>
                </button>
            </div>
            
            {goals.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <GoalCard 
                            key={goal.id} 
                            goal={goal}
                            account={accountMap.get(goal.linkedAccountId)}
                            onEdit={handleOpenGoalModal}
                            onDelete={(goal) => handleDeleteRequest({type: 'goal', data: goal}, "Êtes-vous sûr de vouloir supprimer cet objectif ?")}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl mt-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.25a14.98 14.98 0 00-5.84 7.38m5.84 2.58a14.98 14.98 0 017.38 5.84m-13.22 0a14.98 14.98 0 015.84-7.38m5.84 2.58l-2.12-2.12" />
                    </svg>
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">Aucun objectif défini</h3>
                    <p className="mt-1 text-gray-500">Cliquez sur "Ajouter un objectif" pour commencer à planifier vos projets.</p>
                </div>
            )}
        </div>
    );
};

export default Goals;