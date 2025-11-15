import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Transaction, Category, Account, Split } from '../types';
import { TransactionType } from '../types';

type Period = 'thisMonth' | 'lastMonth' | 'thisYear';
type ViewMode = 'summary' | 'details';

interface CategorySpending {
    name: string;
    icon: string;
    color: string;
    spent: number;
    percentage: number;
}

interface MonthlyCashFlow {
    month: string;
    income: number;
    expense: number;
}

interface NetWorthDataPoint {
    month: string;
    netWorth: number;
}

interface BudgetSummary {
    category: Category;
    spent: number;
}

const DonutChart: React.FC<{ data: CategorySpending[], total: number, label: string }> = ({ data, total, label }) => {
    const size = 200;
    const strokeWidth = 25;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;

    return (
        <div className="relative w-full max-w-[200px] mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
                {data.map((item, index) => {
                    const offset = circumference - (accumulatedPercentage / 100) * circumference;
                    const dash = (item.percentage / 100) * circumference;
                    accumulatedPercentage += item.percentage;
                    
                    const colorName = item.color.replace('bg-', '').replace('-500', '');
                    const colorClass = `text-${colorName}-500`;

                    return (
                        <circle
                            key={index}
                            className={colorClass}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dash} ${circumference}`}
                            strokeDashoffset={-offset}
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx={center}
                            cy={center}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-2xl font-bold text-gray-800">
                    {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
            </div>
        </div>
    );
};

const CashFlowChart: React.FC<{ data: MonthlyCashFlow[] }> = ({ data }) => {
    const chartHeight = 200;
    const barWidth = 15;
    const barGap = 20;
    const chartWidth = data.length * (barWidth * 2 + barGap);

    const maxValue = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

    return (
        <div className="w-full overflow-x-auto p-4">
            <svg width={chartWidth} height={chartHeight + 40}>
                {/* Y-Axis labels */}
                <text x="0" y="10" dy=".32em" fontSize="10" fill="#9ca3af">{maxValue.toLocaleString('fr-FR', {notation: 'compact'})} €</text>
                <text x="0" y={chartHeight} dy=".32em" fontSize="10" fill="#9ca3af">0 €</text>
                <line x1="30" y1="10" x2={chartWidth} y2="10" stroke="#e5e7eb" strokeDasharray="2,2" />
                <line x1="30" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e5e7eb" />

                <g transform="translate(35, 0)">
                    {data.map((d, i) => {
                        const incomeHeight = (d.income / maxValue) * chartHeight;
                        const expenseHeight = (d.expense / maxValue) * chartHeight;
                        const x = i * (barWidth * 2 + barGap);

                        return (
                            <g key={d.month}>
                                <rect
                                    x={x}
                                    y={chartHeight - incomeHeight}
                                    width={barWidth}
                                    height={incomeHeight}
                                    fill="#22c55e"
                                    rx="2"
                                >
                                    <title>Revenus: {d.income.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</title>
                                </rect>
                                <rect
                                    x={x + barWidth}
                                    y={chartHeight - expenseHeight}
                                    width={barWidth}
                                    height={expenseHeight}
                                    fill="#ef4444"
                                    rx="2"
                                >
                                     <title>Dépenses: {d.expense.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</title>
                                </rect>
                                <text x={x + barWidth} y={chartHeight + 15} textAnchor="middle" fontSize="10" fill="#6b7280">
                                    {d.month}
                                </text>
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    );
};

const NetWorthChart: React.FC<{ data: NetWorthDataPoint[] }> = ({ data }) => {
    const chartHeight = 200;
    const chartWidth = 500;
    const yPadding = 20;
    const xPadding = 40;

    const netWorths = data.map(d => d.netWorth);
    const minWorth = Math.min(...netWorths);
    const maxWorth = Math.max(...netWorths);
    const range = maxWorth - minWorth === 0 ? 1 : maxWorth - minWorth;

    const points = data.map((d, i) => {
        const x = xPadding + (i / (data.length - 1)) * (chartWidth - 2 * xPadding);
        const y = (chartHeight - yPadding) - ((d.netWorth - minWorth) / range) * (chartHeight - 2 * yPadding);
        return { x, y, value: d.netWorth, month: d.month };
    });

    const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return (
        <div className="w-full overflow-x-auto p-4">
            <svg width={chartWidth} height={chartHeight + 30} viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}>
                <text x={0} y={yPadding} dy=".32em" fontSize="10" fill="#9ca3af">{maxWorth.toLocaleString('fr-FR', {notation: 'compact'})} €</text>
                <text x={0} y={chartHeight - yPadding} dy=".32em" fontSize="10" fill="#9ca3af">{minWorth.toLocaleString('fr-FR', {notation: 'compact'})} €</text>
                
                <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2" />
                
                {points.map(p => (
                    <g key={p.month}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#4f46e5" />
                        <text x={p.x} y={chartHeight - yPadding + 20} textAnchor="middle" fontSize="10" fill="#6b7280">{p.month}</text>
                        <title>{p.month}: {p.value.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</title>
                    </g>
                ))}
            </svg>
        </div>
    );
};

const ReportTransactionRow: React.FC<{ tx: Transaction; accountName: string; categories: Category[] }> = ({ tx, accountName, categories }) => {
    const isSplit = tx.splits && tx.splits.length > 0;
    
    let displayCategory = tx.category;
    let displayIcon = '💸';
    let displayColor = 'bg-gray-400';

    if (isSplit) {
        displayCategory = tx.splits.map(s => s.category).join(', ');
        displayIcon = '🧩';
        displayColor = 'bg-gray-500';
    } else {
        const category = categories.find(c => c.name === tx.category);
        if (category) {
            displayCategory = category.name;
            displayIcon = category.icon;
            displayColor = category.color;
        }
    }

    const isIncome = tx.type === TransactionType.INCOME;

    return (
        <div className="flex items-center py-3 px-2 border-b border-gray-100 last:border-b-0">
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xl mr-4 ${displayColor}`}>
                {displayIcon}
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{tx.description}</p>
                <p className="text-sm text-gray-500 truncate">{displayCategory}</p>
            </div>
            <div className="hidden md:block text-sm text-gray-500 w-32 text-left truncate px-4">{accountName}</div>
            <div className="w-32 flex items-center gap-2 text-sm px-4">
                {isIncome ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L6.22 8.64a.75.75 0 11-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.03-3.03a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 12.47a.75.75 0 111.06-1.06l3.03 3.03V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                    </svg>
                )}
                <span className={`font-medium truncate ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? 'Revenu' : 'Dépense'}
                </span>
            </div>
            <div className="text-right ml-4 w-32">
                <p className={`font-bold text-base ${isIncome ? 'text-green-600' : 'text-gray-800'}`}>
                    {tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
        </div>
    );
};


const Reports: React.FC<{ transactions: Transaction[], categories: Category[], accounts: Account[] }> = ({ transactions, categories, accounts }) => {
    const [period, setPeriod] = useState<Period>('thisMonth');
    const [filterAccount, setFilterAccount] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.name, cat])), [categories]);
    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.name])), [accounts]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date();

        switch (period) {
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
        }

        return transactions.filter(t => {
            const txDate = new Date(t.date);
            const accountMatch = !filterAccount || t.accountId === filterAccount;
            const typeMatch = !filterType || t.type === filterType;
            return txDate >= startDate && txDate <= endDate && accountMatch && typeMatch;
        });
    }, [period, transactions, filterAccount, filterType]);

    const summaryData = useMemo(() => {
        const transactionsInPeriod = filteredTransactions;

        let sTitle: string;
        let dLabel: string;
        let transactionsForSpending: Transaction[];

        if (filterType === TransactionType.INCOME) {
            sTitle = "Répartition des Revenus";
            dLabel = "Total Reçu";
            transactionsForSpending = transactionsInPeriod.filter(t => t.type === TransactionType.INCOME && t.category !== 'Solde Initial');
        } else {
            sTitle = "Répartition des Dépenses";
            dLabel = "Total Dépensé";
            transactionsForSpending = transactionsInPeriod.filter(t => t.type === TransactionType.EXPENSE && t.category !== 'Solde Initial');
        }

        const spendingByCat = transactionsForSpending.reduce<Record<string, number>>((acc, t) => {
            if (t.splits && t.splits.length > 0) {
                t.splits.forEach(split => {
                    acc[split.category] = (acc[split.category] || 0) + split.amount;
                });
            } else {
                const amount = Math.abs(t.amount);
                acc[t.category] = (acc[t.category] || 0) + amount;
            }
            return acc;
        }, {});

        const total = Object.values(spendingByCat).reduce((sum, amount) => sum + amount, 0);
        
        const spendingData = Object.entries(spendingByCat)
            .map(([name, spent]) => {
                const category = categoryMap.get(name) || { name, icon: '💸', color: 'bg-gray-400' };
                return {
                    name, icon: category.icon, color: category.color, spent,
                    percentage: total > 0 ? (spent / total) * 100 : 0,
                };
            })
            .sort((a, b) => b.spent - a.spent);

        // --- Budget Summary ---
        const expensesInPeriod = transactionsInPeriod.filter(t => t.type === TransactionType.EXPENSE);

        const budgetedCategories = categories.filter(c => c.budget && c.budget > 0);
        let bSummary: BudgetSummary[] = [];
        
        if (budgetedCategories.length > 0) {
            const spendingMap = expensesInPeriod.reduce<Record<string, number>>((acc, t) => {
                if (t.splits && t.splits.length > 0) {
                    t.splits.forEach(split => {
                        acc[split.category] = (acc[split.category] || 0) + split.amount;
                    });
                } else {
                    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
                }
                return acc;
            }, {});
        
            bSummary = budgetedCategories
                .map(cat => ({
                    category: cat,
                    spent: spendingMap[cat.name] || 0,
                }))
                .sort((a, b) => {
                    const progressA = a.category.budget ? (a.spent / a.category.budget) : 0;
                    const progressB = b.category.budget ? (b.spent / b.category.budget) : 0;
                    return progressB - progressA;
                });
        }


        // --- Module 2 & 3 Data ---
        let monthlyFlow: MonthlyCashFlow[] = [];
        let netWorthData: NetWorthDataPoint[] = [];
        let hasYearData = false;
        let hasNWData = false;
        let nWTitle = "Évolution du Patrimoine Net";

        if (period === 'thisYear') {
            const now = new Date();
            const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            monthlyFlow = monthNames.map(name => ({ month: name, income: 0, expense: 0 }));

            transactionsInPeriod.forEach((t: Transaction) => {
                const monthIndex = new Date(t.date).getMonth();
                if (t.type === TransactionType.INCOME) {
                    monthlyFlow[monthIndex].income += t.amount;
                } else if (t.category !== 'Solde Initial') {
                     if (t.splits && t.splits.length > 0) {
                        t.splits.forEach((split: Split) => {
                           monthlyFlow[monthIndex].expense += split.amount;
                        });
                    } else {
                       monthlyFlow[monthIndex].expense += Math.abs(t.amount);
                    }
                }
            });
            hasYearData = monthlyFlow.some((m: MonthlyCashFlow) => m.income > 0 || m.expense > 0);
            
            // Module 3 Calculation
            const getBalanceAtDate = (account: Account, date: Date): number => {
                const relevantEntry = [...account.balanceHistory]
                    .filter(entry => new Date(entry.date) <= date)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                return relevantEntry?.amount ?? 0;
            };

            const accountsForNetWorth = filterAccount ? accounts.filter(acc => acc.id === filterAccount) : accounts;
            if (filterAccount && accountsForNetWorth.length === 1) {
                nWTitle = `Évolution du Solde : ${accountsForNetWorth[0].name}`;
            }

            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            for (let i = 0; i <= currentMonth; i++) {
                const endOfMonth = new Date(currentYear, i + 1, 0, 23, 59, 59, 999);
                const totalNetWorth = accountsForNetWorth.reduce((sum: number, acc: Account) => sum + getBalanceAtDate(acc, endOfMonth), 0);
                netWorthData.push({
                    month: monthNames[i],
                    netWorth: totalNetWorth,
                });
            }
            hasNWData = netWorthData.length > 1;
        }

        return { 
            categorySpending: spendingData, 
            totalAnalyzed: total,
            spendingTitle: sTitle,
            donutLabel: dLabel,
            monthlyCashFlow: monthlyFlow, 
            hasDataForYear: hasYearData,
            netWorthByMonth: netWorthData,
            hasNetWorthData: hasNWData,
            netWorthTitle: nWTitle,
            budgetSummary: bSummary,
        };
    }, [filteredTransactions, categories, accounts, categoryMap, period, filterType]);
    
    const { categorySpending, totalAnalyzed, spendingTitle, donutLabel, monthlyCashFlow, hasDataForYear, netWorthByMonth, hasNetWorthData, netWorthTitle, budgetSummary } = summaryData;

    const groupedDetailedTransactions: Record<string, Transaction[]> = useMemo(() => {
        if (viewMode !== 'details') return {};
        return filteredTransactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(tx);
            return acc;
        }, {});
    }, [filteredTransactions, viewMode]);

    const formatDateHeader = (dateString: string): string => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const date = new Date(dateString+'T00:00:00');

        if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (date.toDateString() === yesterday.toDateString()) return "Hier";

        return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    };

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setIsGeneratingPdf(true);

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f1f5f9'
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const pdfHeight = pdfWidth / ratio;
            
            const pageHeight = pdf.internal.pageSize.getHeight();
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`rapport-financier-${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error("Erreur lors de la génération du PDF:", error);
            alert("Une erreur est survenue lors de la génération du PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Rapports Financiers</h2>
                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    <select
                        value={filterAccount}
                        onChange={e => setFilterAccount(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        aria-label="Filtrer par compte"
                    >
                        <option value="">Tous les comptes</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        aria-label="Filtrer par type de transaction"
                    >
                        <option value="">Tous les types</option>
                        <option value={TransactionType.INCOME}>Revenus</option>
                        <option value={TransactionType.EXPENSE}>Dépenses</option>
                    </select>
                    <div className="flex items-center bg-gray-200 p-1 rounded-lg">
                        {(['thisMonth', 'lastMonth', 'thisYear'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 rounded-md transition-colors text-sm font-semibold ${period === p ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300/50'}`}
                            >
                                {p === 'thisMonth' && 'Ce mois-ci'}
                                {p === 'lastMonth' && 'Le mois dernier'}
                                {p === 'thisYear' && 'Cette année'}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center bg-gray-200 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('summary')}
                            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-semibold ${viewMode === 'summary' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300/50'}`}
                        >
                            Résumé
                        </button>
                        <button
                            onClick={() => setViewMode('details')}
                            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-semibold ${viewMode === 'details' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300/50'}`}
                        >
                            Détails
                        </button>
                    </div>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors duration-300 border border-gray-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Télécharger le rapport en PDF"
                    >
                        {isGeneratingPdf ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Génération...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                <span>PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div ref={reportRef} className="space-y-8">
                {viewMode === 'summary' ? (
                    <>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-6">{spendingTitle}</h3>
                            {totalAnalyzed > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-center">
                                    <div className="lg:col-span-2 flex justify-center">
                                        <DonutChart data={categorySpending} total={totalAnalyzed} label={donutLabel} />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <ul className="space-y-3">
                                            {categorySpending.map(item => (
                                                <li key={item.name}>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-lg ${item.color}`}>{item.icon}</div>
                                                        <span className="flex-grow font-medium text-gray-700">{item.name}</span>
                                                        <span className="font-semibold text-gray-800">{item.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                                        <span className="text-xs text-gray-500 w-12 text-right">{item.percentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 ml-11">
                                                        <div
                                                            className={`h-1.5 rounded-full ${item.color}`}
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-gray-500">
                                        {filterType === TransactionType.INCOME ? 
                                            "Aucun revenu à analyser pour la période sélectionnée." : 
                                            "Aucune dépense à analyser pour la période sélectionnée."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {(period === 'thisMonth' || period === 'lastMonth') && budgetSummary.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Résumé des Budgets</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {budgetSummary.map(({ category, spent }) => {
                                        const budget = category.budget || 0;
                                        const remaining = budget - spent;
                                        const progress = budget > 0 ? (spent / budget) * 100 : 0;
                                        const isOverBudget = remaining < 0;

                                        let progressBarColor = category.color;
                                        if (isOverBudget) progressBarColor = 'bg-red-500';
                                        else if (progress > 80 && progress <= 100) progressBarColor = 'bg-amber-500';
                                        
                                        return (
                                            <div key={category.id}>
                                                <div className="flex justify-between items-center mb-1 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                                                        <span className="font-semibold text-gray-700 truncate">{category.name}</span>
                                                    </div>
                                                    <div className="font-medium">
                                                        <span className="text-gray-800">{spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}</span>
                                                        <span className="text-gray-500"> / {budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-2 rounded-full ${progressBarColor} transition-all duration-500`}
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-right text-xs font-medium mt-1">
                                                    <span className={isOverBudget ? 'text-red-600' : 'text-gray-500'}>
                                                    {isOverBudget 
                                                        ? `${Math.abs(remaining).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })} dépassé`
                                                        : `${remaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })} restant`
                                                    }
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                         {period === 'thisYear' && (
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">Évolution des Flux de Trésorerie</h3>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-500"></div><span>Revenus</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500"></div><span>Dépenses</span></div>
                                    </div>
                                </div>
                                 {hasDataForYear ? (
                                    <CashFlowChart data={monthlyCashFlow} />
                                 ) : (
                                    <div className="text-center py-10">
                                         <p className="text-gray-500">Aucune donnée de transaction pour cette année.</p>
                                    </div>
                                 )}
                             </div>
                         )}
                         
                         {period === 'thisYear' && (
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">{netWorthTitle}</h3>
                                 {hasNetWorthData ? (
                                    <NetWorthChart data={netWorthByMonth} />
                                 ) : (
                                    <div className="text-center py-10">
                                         <p className="text-gray-500">Données insuffisantes pour afficher l'évolution du patrimoine net.</p>
                                    </div>
                                 )}
                             </div>
                         )}
                    </>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Détail des Transactions</h3>
                        {Object.keys(groupedDetailedTransactions).length > 0 ? (
                            <div>
                                <div className="flex items-center py-2 px-2 text-xs font-bold text-gray-500 uppercase border-b-2 border-gray-200 mb-2">
                                    <div className="w-10 shrink-0 mr-4"></div>
                                    <div className="flex-grow min-w-0">Description</div>
                                    <div className="hidden md:block w-32 text-left px-4">Compte</div>
                                    <div className="w-32 px-4">Type</div>
                                    <div className="text-right w-32 ml-4">Montant</div>
                                </div>
                                {Object.entries(groupedDetailedTransactions).map(([date, txs]) => (
                                    <div key={date} className="pt-2">
                                        <div className="pb-2">
                                            <h3 className="font-bold text-base text-gray-600 px-2">{formatDateHeader(date)}</h3>
                                        </div>
                                        <div>
                                            {txs.map(tx => (
                                                <ReportTransactionRow
                                                    key={tx.id}
                                                    tx={tx}
                                                    categories={categories}
                                                    accountName={accountMap.get(tx.accountId) || 'Inconnu'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500">Aucune transaction à afficher pour la période et les filtres sélectionnés.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;