
import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Account, BalanceEntry, Transaction, DeletableItem } from '../types';
import { AccountType, TransactionType } from '../types';
import AddAccountModal from './AddAccountModal';
import TransferModal from './TransferModal';
import { recalculateBalanceHistory } from '../utils';

const Sparkline: React.FC<{ data: BalanceEntry[] }> = ({ data }) => {
    if (data.length < 2) return null;

    const chronologicalData = [...data].reverse();
    const width = 120;
    const height = 40;
    
    const amounts = chronologicalData.map(d => d.amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const range = maxAmount - minAmount === 0 ? 1 : maxAmount - minAmount;

    const points = chronologicalData.map((entry, i) => {
        const x = (i / (chronologicalData.length - 1)) * width;
        const y = height - ((entry.amount - minAmount) / range) * (height - 4) + 2; // Add padding
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    
    const lastValue = data[0].amount;
    const secondToLastValue = data[1].amount;
    const strokeColorClass = lastValue > secondToLastValue ? "stroke-teal-400" : lastValue < secondToLastValue ? "stroke-rose-400" : "stroke-gray-400";

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`sparkline-gradient-${strokeColorClass}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lastValue >= secondToLastValue ? 'rgba(45, 212, 191, 0.2)' : 'rgba(251, 113, 133, 0.2)'} />
                    <stop offset="100%" stopColor={lastValue >= secondToLastValue ? 'rgba(45, 212, 191, 0)' : 'rgba(251, 113, 133, 0)'} />
                </linearGradient>
            </defs>
            <path d={`M0,${height} ${points} L${width},${height} Z`} fill={`url(#sparkline-gradient-${strokeColorClass})`} />
            <polyline
                fill="none"
                className={strokeColorClass}
                strokeWidth="2"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const AccountCard: React.FC<{ account: Account; onEdit: (account: Account) => void; onDelete: (account: Account) => void; }> = ({ account, onEdit, onDelete }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const { left, top, width, height } = card.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        const rotateX = -((y - height / 2) / (height / 2)) * 8; // Max rotation 8 degrees
        const rotateY = ((x - width / 2) / (width / 2)) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (card) {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
    };
    
    const sortedHistory = [...account.balanceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const currentBalance = sortedHistory[0]?.amount ?? 0;

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative aspect-[16/10] w-full rounded-2xl p-6 text-white overflow-hidden transition-transform duration-300 ease-out will-change-transform"
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Background Gradient & Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-slate-900 to-black rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            <div className="absolute -inset-2 bg-gradient-to-br from-teal-400 to-indigo-600 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex flex-col h-full">
                {/* Header: Chip and Actions */}
                <div className="flex justify-between items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-400/80" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V6zm0 4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4zm2-2h2v2H6V8zm4 0h2v2h-2V8zm4 0h2v2h-2V8z"/>
                    </svg>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => onEdit(account)} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Modifier"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.036 6.536z" /></svg></button>
                        <button onClick={() => onDelete(account)} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col justify-center">
                    <p className="font-mono text-3xl sm:text-4xl tracking-wider text-slate-100">
                        {currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Solde actuel</p>
                </div>

                {/* Footer: Name, Type, Sparkline */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="font-bold text-lg text-slate-50">{account.name}</p>
                        <p className="text-xs font-medium text-indigo-300">{account.type}</p>
                    </div>
                    <div className="w-24">
                        <Sparkline data={sortedHistory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface AccountsProps {
    accounts: Account[];
    setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    handleDeleteRequest: (item: DeletableItem, message?: string) => void;
}

const accountTypeTitles: Record<AccountType, string> = {
    [AccountType.CHECKING]: 'Comptes Courants',
    [AccountType.SAVINGS]: 'Comptes d\'Épargne',
    [AccountType.TERM]: 'Comptes à Terme',
    [AccountType.JOINT]: 'Comptes Joints',
    [AccountType.INDIVIDUAL]: 'Comptes Individuels',
};

const Accounts: React.FC<AccountsProps> = ({ accounts, setAccounts, transactions, setTransactions, handleDeleteRequest }) => {
    const [isAccountModalOpen, setAccountModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
    const [isTransferModalOpen, setTransferModalOpen] = useState(false);

    const handleOpenAccountModal = useCallback((account: Account | null = null) => {
        setAccountToEdit(account);
        setAccountModalOpen(true);
    }, []);

    const handleCloseAccountModal = useCallback(() => {
        setAccountModalOpen(false);
        setAccountToEdit(null);
    }, []);

    const handleSaveAccount = useCallback((data: { id?: string; name: string; type: AccountType; balance: number; balanceDate: Date; lowBalanceAlertThreshold?: number; }) => {
        if (data.id) {
            // Edit logic
            const accountToUpdate = accounts.find(acc => acc.id === data.id);
            if (!accountToUpdate) return;

            const initialTx = transactions.find(t => t.accountId === data.id && t.category === 'Solde Initial');
            let updatedTransactions = [...transactions];

            if (initialTx) {
                updatedTransactions = updatedTransactions.map(t => 
                    t.id === initialTx.id 
                    ? { ...t, amount: data.balance, date: data.balanceDate, type: data.balance >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE } 
                    : t
                );
            } else {
                updatedTransactions.push({
                    id: crypto.randomUUID(), description: 'Solde initial', amount: data.balance,
                    type: data.balance >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                    category: 'Solde Initial', date: data.balanceDate, accountId: data.id,
                });
            }
            
            setTransactions(updatedTransactions);

            const transactionsForAccount = updatedTransactions.filter(t => t.accountId === data.id);
            const newHistory = recalculateBalanceHistory(transactionsForAccount);

            setAccounts(prevAccounts => 
                prevAccounts.map(acc => {
                    if (acc.id === data.id) {
                        return { ...acc, name: data.name, type: data.type, balanceHistory: newHistory, lowBalanceAlertThreshold: data.lowBalanceAlertThreshold };
                    }
                    return acc;
                })
            );
        } else {
            // Create logic
            const newAccountId = crypto.randomUUID();
            const newAccount: Account = {
                id: newAccountId, name: data.name, type: data.type,
                balanceHistory: [{ amount: data.balance, date: data.balanceDate }],
                lowBalanceAlertThreshold: data.lowBalanceAlertThreshold
            };
            setAccounts(prevAccounts => [...prevAccounts, newAccount]);
            
            if (data.balance !== 0) {
                setTransactions(prev => [...prev, {
                    id: crypto.randomUUID(), description: 'Solde initial', amount: data.balance,
                    type: data.balance >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                    category: 'Solde Initial', date: data.balanceDate, accountId: newAccountId,
                }]);
            }
        }
        handleCloseAccountModal();
    }, [accounts, transactions, handleCloseAccountModal, setAccounts, setTransactions]);

    const handleSaveTransfer = useCallback((data: { fromAccountId: string; toAccountId: string; amount: number; date: Date; description: string; }) => {
        const { fromAccountId, toAccountId, amount, date, description } = data;
        const transferId = crypto.randomUUID();

        const fromAccountName = accounts.find(a => a.id === fromAccountId)?.name ?? 'Compte inconnu';
        const toAccountName = accounts.find(a => a.id === toAccountId)?.name ?? 'Compte inconnu';
        
        const expenseDesc = `Virement à ${toAccountName}`;
        const incomeDesc = `Virement de ${fromAccountName}`;

        const expenseTransaction: Transaction = {
            id: crypto.randomUUID(),
            description: description ? `${expenseDesc}: ${description}` : expenseDesc,
            amount: -Math.abs(amount),
            type: TransactionType.EXPENSE,
            category: 'Virement',
            date,
            accountId: fromAccountId,
            transferId,
        };

        const incomeTransaction: Transaction = {
            id: crypto.randomUUID(),
            description: description ? `${incomeDesc}: ${description}` : incomeDesc,
            amount: Math.abs(amount),
            type: TransactionType.INCOME,
            category: 'Virement',
            date,
            accountId: toAccountId,
            transferId,
        };

        const updatedTransactions = [...transactions, expenseTransaction, incomeTransaction];
        setTransactions(updatedTransactions);

        const affectedAccountIds = new Set([fromAccountId, toAccountId]);
        setAccounts(prevAccounts => 
            prevAccounts.map(account => {
                if (affectedAccountIds.has(account.id)) {
                    const transactionsForAccount = updatedTransactions.filter(t => t.accountId === account.id);
                    const newHistory = recalculateBalanceHistory(transactionsForAccount);
                    return { ...account, balanceHistory: newHistory };
                }
                return account;
            })
        );

        setTransferModalOpen(false);
    }, [accounts, transactions, setTransactions, setAccounts]);
    
    const { groupedAccounts, globalTotal } = useMemo(() => {
        const grouped = accounts.reduce((acc, account) => {
            if (!acc[account.type]) acc[account.type] = [];
            acc[account.type].push(account);
            return acc;
        }, {} as Record<AccountType, Account[]>);

        const total = accounts.reduce((sum, account) => {
            const latestBalance = [...account.balanceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.amount ?? 0;
            return sum + latestBalance;
        }, 0);

        return { groupedAccounts: grouped, globalTotal: total };
    }, [accounts]);


  return (
    <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Mes Comptes</h2>
                {accounts.length > 0 && (
                    <p className="text-gray-500 mt-1">Solde total : <span className="font-bold text-indigo-600">{globalTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span></p>
                )}
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
                <button 
                    onClick={() => setTransferModalOpen(true)} 
                    disabled={accounts.length < 2}
                    className="bg-indigo-200 hover:bg-indigo-300 text-indigo-800 font-bold py-2 px-5 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={accounts.length < 2 ? "Créez au moins deux comptes pour effectuer un virement" : "Effectuer un virement entre comptes"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" /></svg>
                    <span>Virement</span>
                </button>
                <button onClick={() => handleOpenAccountModal()} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span>Ajouter un Compte</span>
                </button>
            </div>
        </div>
        
        {accounts.length > 0 ? (
            <div className="space-y-10">
                {Object.entries(groupedAccounts).map(([type, accs]) => {
                    return (
                        <div key={type}>
                            <div className="mb-4 pb-2 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-700">{accountTypeTitles[type as AccountType]}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-2">
                                {(accs as Account[]).map(acc => 
                                    <AccountCard 
                                        key={acc.id} 
                                        account={acc} 
                                        onEdit={handleOpenAccountModal} 
                                        onDelete={(acc) => handleDeleteRequest({ type: 'account', data: acc }, "Êtes-vous sûr de vouloir supprimer ce compte ? Toutes les transactions associées et les objectifs liés seront également supprimés.")} 
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="text-center py-16 px-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl mt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.926a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008z" /></svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-700">Aucun compte pour le moment</h3>
                <p className="mt-1 text-gray-500">Cliquez sur 'Ajouter un Compte' pour commencer.</p>
            </div>
        )}

        <AddAccountModal 
            isOpen={isAccountModalOpen}
            onClose={handleCloseAccountModal}
            onSave={handleSaveAccount}
            accountToEdit={accountToEdit}
        />

        <TransferModal
            isOpen={isTransferModalOpen}
            onClose={() => setTransferModalOpen(false)}
            onSave={handleSaveTransfer}
            accounts={accounts}
        />
    </div>
  );
};

export default Accounts;
