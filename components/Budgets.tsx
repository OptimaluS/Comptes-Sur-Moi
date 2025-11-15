
import React, { useMemo, useState } from 'react';
import type { Transaction, Category } from '../types';
import { TransactionType, UNCATEGORIZED } from '../types';
import type { View } from '../App';
import EditBudgetsModal from './EditBudgetsModal';

interface BudgetsProps {
    transactions: Transaction[];
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    setActiveView: (view: View) => void;
}

const DonutChart: React.FC<{ progress: number }> = ({ progress }) => {
    const size = 100;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    let progressColor = "text-indigo-600";
    if (progress > 100) progressColor = "text-red-600";
    else if (progress > 80) progressColor = "text-amber-500";
    
    return (
        <div className="relative w-28 h-28">
            <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
                <circle
                    className={progressColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                    style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${progressColor}`}>
                {Math.floor(progress)}<span className="text-base font-medium">%</span>
            </div>
        </div>
    );
};


const BudgetCard: React.FC<{ category: Category; spentAmount: number; }> = ({ category, spentAmount }) => {
    const { name, icon, color, budget = 0 } = category;

    const remaining = budget - spentAmount;
    const progress = budget > 0 ? (spentAmount / budget) * 100 : 0;
    const isOverBudget = remaining < 0;

    let progressBarColor = color;
    if (isOverBudget) progressBarColor = 'bg-red-500';
    else if (progress > 80 && progress <= 100) progressBarColor = 'bg-amber-500';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${color}`}>{icon}</div>
                    <h4 className="font-bold text-gray-800">{name}</h4>
                </div>
            </div>
            
            <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-600">
                        Dépensé: <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}>{spentAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </span>
                    <span className="text-gray-500">
                        Budget: {budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-2.5 rounded-full ${progressBarColor} transition-all duration-500`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                </div>
                 <div className="text-right text-sm font-medium mt-1">
                    <span className={isOverBudget ? 'text-red-600' : 'text-gray-500'}>
                       {isOverBudget 
                           ? `${Math.abs(remaining).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} au-dessus`
                           : `${remaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} restants`
                       }
                    </span>
                </div>
            </div>
        </div>
    );
};

const NoBudgetsCTA: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => (
    <div className="text-center py-16 px-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl mt-8 col-span-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="mt-4 text-xl font-semibold text-gray-700">Aucun budget défini</h3>
        <p className="mt-1 text-gray-500 max-w-md mx-auto">Définissez des budgets pour vos catégories afin de suivre vos dépenses et d'atteindre vos objectifs financiers.</p>
        <div className="mt-6">
            <button
                onClick={onNavigate}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
            >
                <span>Définir des budgets</span>
            </button>
        </div>
    </div>
);

const Budgets: React.FC<BudgetsProps> = ({ transactions, categories, setCategories, setActiveView }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.name, cat])), [categories]);

    const { 
        budgetedCategories, 
        unbudgetedSpending,
        totalBudgeted, 
        totalSpentOnBudgeted,
        spendingMap,
    } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthlyExpenses = transactions.filter(t => {
            const txDate = new Date(t.date);
            return (
                t.type === TransactionType.EXPENSE &&
                txDate >= startOfMonth &&
                txDate <= endOfMonth
            );
        });
        
        const spendingMap = monthlyExpenses.reduce((acc, t) => {
            if (t.splits && t.splits.length > 0) {
                t.splits.forEach(split => {
                    const categoryName = split.category || UNCATEGORIZED;
                    acc.set(categoryName, (acc.get(categoryName) || 0) + split.amount);
                });
            } else {
                const categoryName = t.category === UNCATEGORIZED ? 'Non catégorisé' : t.category;
                acc.set(categoryName, (acc.get(categoryName) || 0) + Math.abs(t.amount));
            }
            return acc;
        }, new Map<string, number>());
        
        const bCategories = categories.filter(c => c.budget !== undefined && c.budget > 0);
        const bCategoryNames = new Set(bCategories.map(c => c.name));
        
        const uSpending: {name: string, spent: number, category?: Category}[] = [];
        spendingMap.forEach((spent, name) => {
            if (!bCategoryNames.has(name) && name !== 'Solde Initial') {
                 uSpending.push({ name, spent, category: categoryMap.get(name) });
            }
        });

        const totalB = bCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
        const totalS = Array.from(spendingMap.entries())
            .filter(([catName]) => bCategoryNames.has(catName))
            .reduce((sum, [, amount]) => sum + amount, 0);

        return { 
            budgetedCategories: bCategories,
            unbudgetedSpending: uSpending.sort((a,b) => b.spent - a.spent),
            totalBudgeted: totalB,
            totalSpentOnBudgeted: totalS,
            spendingMap
        };
    }, [transactions, categories, categoryMap]);
    
    const handleSaveBudgets = (newBudgets: Record<string, number | undefined>) => {
        setCategories(prevCategories =>
            prevCategories.map(cat => {
                const newBudgetValue = newBudgets[cat.id];
                return {
                    ...cat,
                    budget: newBudgetValue === 0 ? 0 : (newBudgetValue ?? cat.budget),
                }
            })
        );
        setIsEditModalOpen(false);
    };

    const totalRemaining = totalBudgeted - totalSpentOnBudgeted;
    const overallProgress = totalBudgeted > 0 ? (totalSpentOnBudgeted / totalBudgeted) * 100 : 0;
    
    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900">Mes Budgets du Mois</h2>
                <button onClick={() => setIsEditModalOpen(true)} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                    <span>Gérer les budgets</span>
                </button>
            </div>
            
            {categories.some(c => c.budget !== undefined && c.budget > 0) ? (
                <>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                       <h3 className="text-lg font-bold text-gray-800 mb-4">Vue d'Ensemble</h3>
                       <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                           <div className="flex items-center gap-6">
                               <DonutChart progress={overallProgress} />
                               <div>
                                   <p className="text-sm text-gray-500">Dépensé sur le budget total</p>
                                   <p className="text-3xl font-bold text-gray-800 mt-1">
                                       {totalSpentOnBudgeted.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                   </p>
                               </div>
                           </div>
                           <div className="flex gap-4 text-center w-full md:w-auto">
                               <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                                   <h4 className="text-xs text-gray-500 font-medium">Total Budgété</h4>
                                   <p className="text-lg font-bold text-gray-800 mt-1">
                                       {totalBudgeted.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                   </p>
                               </div>
                               <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                                   <h4 className="text-xs text-gray-500 font-medium">Restant</h4>
                                   <p className={`text-lg font-bold mt-1 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                       {totalRemaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                   </p>
                               </div>
                           </div>
                       </div>
                   </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                             <h3 className="text-xl font-bold text-gray-800 mb-4">Vos Budgets</h3>
                             {budgetedCategories.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {budgetedCategories.map(cat => (
                                        <BudgetCard
                                            key={cat.id}
                                            category={cat}
                                            spentAmount={spendingMap.get(cat.name) || 0}
                                        />
                                    ))}
                                </div>
                             ) : (
                                <div className="text-center py-10 px-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                                    <p className="text-gray-500">Aucun budget n'est actuellement défini. Cliquez sur "Gérer les budgets" pour commencer.</p>
                                </div>
                             )}
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-gray-800 mb-4">Autres Dépenses ce Mois-ci</h3>
                             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                {unbudgetedSpending.length > 0 ? (
                                    <ul className="space-y-3">
                                        {unbudgetedSpending.map(({name, spent, category}) => (
                                            <li key={name} className="flex items-center gap-3 text-sm">
                                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-lg ${category?.color || 'bg-gray-400'}`}>
                                                    {category?.icon || '💸'}
                                                </div>
                                                <span className="flex-grow font-medium text-gray-700 truncate">{name}</span>
                                                <span className="font-semibold text-gray-800">
                                                    {spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">Toutes vos dépenses sont budgétées ce mois-ci. Bravo !</p>
                                )}
                             </div>
                        </div>
                    </div>
                </>
            ) : (
                <NoBudgetsCTA onNavigate={() => setIsEditModalOpen(true)} />
            )}
             <EditBudgetsModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveBudgets}
                categories={categories}
            />
        </div>
    );
};

export default Budgets;