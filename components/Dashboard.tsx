

import React, { useMemo } from 'react';
import type { Account, Transaction, Category, RecurringTransaction, Notification } from '../types';
import { TransactionType, NotificationType } from '../types';
import AlertBanner from './AlertBanner';
import AiInsights from './AiInsights';
import { getNextDueDate } from '../utils';

interface DashboardProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    recurringTransactions: RecurringTransaction[];
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour !";
    if (hour < 18) return "Bon après-midi !";
    return "Bonsoir !";
};

const KpiCard: React.FC<{ title: string; value: number; change?: number | null; isCurrency?: boolean; icon: React.ReactNode }> = ({ title, value, change, isCurrency = true, icon }) => {
    const formatValue = (val: number) => isCurrency
        ? val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
        : val.toLocaleString('fr-FR');
    
    const hasChange = change !== undefined && change !== null;
    const isPositive = hasChange && change > 0;
    const isNegative = hasChange && change < 0;

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{formatValue(value)}</p>
                {hasChange && (
                    <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
                        {isPositive ? '▲' : isNegative ? '▼' : ''}
                        <span>{formatValue(Math.abs(change))} ce mois-ci</span>
                    </div>
                )}
            </div>
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                {icon}
            </div>
        </div>
    );
};

const CashFlowBarChart: React.FC<{ data: { date: string, income: number, expense: number }[] }> = ({ data }) => {
    const maxValue = useMemo(() => Math.max(...data.flatMap(d => [d.income, d.expense]), 1), [data]);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800">Flux de trésorerie (30 jours)</h3>
            <div className="mt-4 h-48 flex items-end justify-between gap-1">
                {data.map(({ date, income, expense }) => (
                    <div key={date} className="flex-1 flex flex-col items-center justify-end h-full group">
                         <div className="flex w-full h-full items-end justify-center gap-px">
                            <div className="w-1/2 bg-green-300 hover:bg-green-400 rounded-t-sm" style={{ height: `${(income / maxValue) * 100}%` }} />
                            <div className="w-1/2 bg-red-300 hover:bg-red-400 rounded-t-sm" style={{ height: `${(expense / maxValue) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{new Date(date+'T00:00:00').getDate()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SpendingDonutChart: React.FC<{ data: { name: string; color: string; percentage: number }[] }> = ({ data }) => {
    let accumulatedPercentage = 0;

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Répartition des dépenses</h3>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" className="stroke-current text-gray-200" strokeWidth="3" fill="none" />
                        {data.map(item => {
                            const dashArray = `${item.percentage} ${100 - item.percentage}`;
                            const dashOffset = 25 - accumulatedPercentage;
                            accumulatedPercentage += item.percentage;
                            return (
                                <circle key={item.name} cx="18" cy="18" r="15.915" className={`stroke-current ${item.color.replace('bg-', 'text-')}`} strokeWidth="3" strokeDasharray={dashArray} strokeDashoffset={dashOffset} fill="none" />
                            );
                        })}
                    </svg>
                </div>
                <ul className="space-y-2 text-sm w-full">
                    {data.map(item => (
                        <li key={item.name} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                <span className="text-gray-600">{item.name}</span>
                            </div>
                            <span className="font-semibold text-gray-800">{item.percentage.toFixed(1)}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ accounts, transactions, categories, recurringTransactions, notifications, setNotifications }) => {
    const criticalNotifications = notifications.filter(n =>
        !n.isRead && (n.type === NotificationType.OVERDUE || n.type === NotificationType.BUDGET_EXCEEDED)
    );

    const handleDismissBanner = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const { netWorth, netWorthChange, monthlyCashFlow, monthlyExpenses } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const getBalanceAtDate = (acc: Account, date: Date) => {
            const entry = [...acc.balanceHistory]
                .filter(e => new Date(e.date) <= date)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            return entry ? entry.amount : 0;
        };
        
        const currentNetWorth = accounts.reduce((sum, acc) => sum + (acc.balanceHistory[0]?.amount ?? 0), 0);
        const lastMonthNetWorth = accounts.reduce((sum, acc) => sum + getBalanceAtDate(acc, startOfMonth), 0);

        const monthlyTxs = transactions.filter(t => new Date(t.date) >= startOfMonth);
        const income = monthlyTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthlyTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        return {
            netWorth: currentNetWorth,
            netWorthChange: currentNetWorth - lastMonthNetWorth,
            monthlyExpenses: expenses,
            monthlyCashFlow: income - expenses,
        };
    }, [accounts, transactions]);

    const last30DaysCashFlow = useMemo(() => {
        const data = new Map<string, { income: number, expense: number }>();
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            data.set(date.toISOString().split('T')[0], { income: 0, expense: 0 });
        }
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        transactions.filter(tx => new Date(tx.date) >= thirtyDaysAgo).forEach(tx => {
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            const entry = data.get(dateKey);
            if (entry) {
                if (tx.type === TransactionType.INCOME) entry.income += tx.amount;
                else entry.expense += Math.abs(tx.amount);
            }
        });
        return Array.from(data.entries()).map(([date, values]) => ({ date, ...values }));
    }, [transactions]);
    
    const spendingBreakdown = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const spending = transactions
            .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= startOfMonth)
            // FIX: Add generic type argument to reduce to help TypeScript infer the accumulator type correctly.
            .reduce<Record<string, number>>((acc, t) => {
                if (t.splits) {
                    t.splits.forEach(s => { acc[s.category] = (acc[s.category] || 0) + s.amount });
                } else {
                    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
                }
                return acc;
            }, {});
        
        const totalSpent = Object.values(spending).reduce((sum, amount) => sum + amount, 0);
        if (totalSpent === 0) return [];
        
        const categoryMap = new Map(categories.map(c => [c.name, c]));
        const sorted = Object.entries(spending).sort(([, a], [, b]) => b - a);

        const top5 = sorted.slice(0, 5).map(([name, amount]) => ({
            name,
            color: categoryMap.get(name)?.color || 'bg-gray-400',
            percentage: (amount / totalSpent) * 100
        }));
        
        const othersAmount = sorted.slice(5).reduce((sum, [, amount]) => sum + amount, 0);
        if (othersAmount > 0) {
            top5.push({ name: 'Autres', color: 'bg-gray-400', percentage: (othersAmount / totalSpent) * 100 });
        }
        return top5;
    }, [transactions, categories]);

    const budgetSummary = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyExpenses = transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= startOfMonth);
        
        // FIX: Add generic type argument to reduce to help TypeScript infer the accumulator type correctly.
        const spendingMap = monthlyExpenses.reduce<Record<string, number>>((acc, t) => {
            if (t.splits) t.splits.forEach(s => { acc[s.category] = (acc[s.category] || 0) + s.amount });
            else acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
            return acc;
        }, {});
        
        return categories
            .filter(c => c.budget && c.budget > 0)
            .map(c => ({...c, spent: spendingMap[c.name] || 0}))
            .map(c => ({...c, progress: c.budget! > 0 ? (c.spent / c.budget!) * 100 : 0}))
            .sort((a,b) => b.progress - a.progress)
            .slice(0, 3);
    }, [transactions, categories]);
    
     const upcomingDeadlines = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return recurringTransactions
            .map(rule => ({ ...rule, nextDueDate: getNextDueDate(rule, transactions) }))
            .filter(rule => rule.nextDueDate && rule.nextDueDate >= today)
            .sort((a, b) => a.nextDueDate!.getTime() - b.nextDueDate!.getTime())
            .slice(0, 3);
    }, [recurringTransactions, transactions]);

    const totalBalance = useMemo(() => accounts.reduce((sum, account) => sum + (account.balanceHistory[0]?.amount ?? 0), 0), [accounts]);

    return (
        <div className="container mx-auto bg-white rounded-2xl shadow-sm px-8 py-8 mt-6">
            <div className="space-y-4 my-6">
                {criticalNotifications.map(notification => (
                    <AlertBanner key={notification.id} notification={notification} onDismiss={handleDismissBanner} />
                ))}
            </div>
            
            <div className="mb-6">
                 <AiInsights 
                    accounts={accounts} 
                    transactions={transactions} 
                    categories={categories}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <KpiCard title="Patrimoine Net" value={netWorth} change={netWorthChange} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} />
                <KpiCard title="Flux de Trésorerie" value={monthlyCashFlow} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M7 7l9 9M20 20v-5h-5M17 17l-9-9" /></svg>} />
                <KpiCard title="Dépenses du Mois" value={monthlyExpenses} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CashFlowBarChart data={last30DaysCashFlow} />
                </div>
                <div>
                    <SpendingDonutChart data={spendingBreakdown} />
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800">Soldes des Comptes</h3>
                    <ul className="mt-4 space-y-3">
                        {accounts.map(acc => (
                            <li key={acc.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{acc.name}</span>
                                <span className="font-semibold text-gray-800">{(acc.balanceHistory[0]?.amount ?? 0).toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center font-bold text-gray-800">
                        <span>Total</span>
                        <span>{totalBalance.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800">Budgets à surveiller</h3>
                     {budgetSummary.length > 0 ? (
                        <ul className="mt-4 space-y-4">
                            {budgetSummary.map(b => (
                                <li key={b.id}>
                                    <div className="flex justify-between items-center text-sm font-medium mb-1">
                                        <span className="text-gray-600">{b.name}</span>
                                        <span className="text-gray-500">{Math.floor(b.progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${b.progress > 90 ? 'bg-red-500' : b.progress > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(b.progress, 100)}%` }}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                     ) : (
                         <p className="text-sm text-gray-500 mt-4 text-center py-5">Aucun budget défini. Vous pouvez en ajouter depuis l'onglet Budgets.</p>
                     )}
                </div>
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800">Échéances à venir</h3>
                    {upcomingDeadlines.length > 0 ? (
                        <ul className="mt-4 space-y-3">
                            {upcomingDeadlines.map(d => (
                                <li key={d.id} className="flex justify-between items-center text-sm">
                                    <div className="text-gray-600">
                                        <p>{d.description}</p>
                                        <p className="text-xs text-gray-400">{d.nextDueDate?.toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <span className="font-semibold text-red-600">{Math.abs(d.amount).toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 mt-4 text-center py-5">Aucune échéance à venir. Vous êtes tranquille !</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;