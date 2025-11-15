import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { Account, Transaction, RecurringTransaction, Category, DeletableItem } from '../types';
import { TransactionType, Frequency, SPLIT_TRANSACTION } from '../types';
import type { View } from '../App';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { fileToBase64, getNextDueDate } from '../utils';
import ImportCsvModal from './ImportCsvModal';

type ViewMode = 'journal' | 'calendar';

// --- VUE CALENDRIER ---
const CalendarView: React.FC<{ transactions: Transaction[]; categories: Category[]; onEdit: (tx: Transaction) => void; onDelete: (tx: Transaction) => void; }> = ({ transactions, categories, onEdit, onDelete }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
    const lastDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), [currentDate]);

    const transactionsByDate = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(tx);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [transactions]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Lundi = 0

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ key: `empty-${i}`, isEmpty: true });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = date.toISOString().split('T')[0];
            days.push({
                key: dateKey,
                day,
                date,
                isToday: date.toDateString() === new Date().toDateString(),
                transactions: transactionsByDate[dateKey] || []
            });
        }
        return days;
    }, [startDayOfWeek, daysInMonth, currentDate, transactionsByDate]);
    
    const getCategoryForTx = (tx: Transaction): Category | null => {
        if(tx.splits && tx.splits.length > 0) return null;
        return categories.find(c => c.name === tx.category) || null;
    }


    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                <h3 className="text-lg font-bold text-gray-800 capitalize">{currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
            </div>
            <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-gray-500 border-b border-gray-200 pb-2 mb-2">
                <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
            </div>
            <div className="grid grid-cols-7 gap-px">
                {calendarDays.map(dayInfo => (
                    dayInfo.isEmpty ? <div key={dayInfo.key}></div> : (
                        <div key={dayInfo.key} className="h-32 p-1.5 border-t border-gray-100 flex flex-col overflow-hidden">
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${dayInfo.isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                                {dayInfo.day}
                            </span>
                            <div className="mt-1 space-y-1 overflow-y-auto pr-1">
                                {dayInfo.transactions.map(tx => {
                                    const category = getCategoryForTx(tx);
                                    const bgColor = category ? category.color : 'bg-gray-500';
                                    const isIncome = tx.type === TransactionType.INCOME;
                                    const borderColor = isIncome ? 'border-green-500' : 'border-red-500';
                                    
                                    return (
                                        <div 
                                          key={tx.id} 
                                          className={`group relative text-xs p-1 rounded-md text-white truncate cursor-pointer ${bgColor} border-l-2 ${borderColor}`}
                                          onClick={() => onEdit(tx)}
                                          title={`${tx.description}: ${tx.amount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}`}
                                        >
                                          {tx.description}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};


// --- GRAPHIQUE ---
const CashflowChart: React.FC<{ data: { date: string, income: number, expense: number }[] }> = ({ data }) => {
    const chartHeight = 150;
    const barGap = 4;
    
    const maxValue = useMemo(() => {
        const allValues = data.flatMap(d => [d.income, d.expense]);
        const max = Math.max(...allValues);
        return max > 0 ? max : 1;
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400 bg-gray-50 rounded-lg">
                Aucune donnée à afficher pour la période sélectionnée.
            </div>
        );
    }

    const barWidth = Math.max(10, (300 - (data.length -1) * barGap) / data.length);

    return (
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6">
            <h4 className="font-bold text-gray-800 mb-2">Flux de Trésorerie</h4>
            <svg width="100%" height={chartHeight + 40} viewBox={`0 0 300 ${chartHeight + 40}`} preserveAspectRatio="xMidYMax meet">
                <text x="0" y="15" fontSize="10" fill="#9ca3af">{maxValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}</text>
                <text x="0" y={chartHeight + 5} fontSize="10" fill="#9ca3af">0</text>
                <line x1="25" y1="10" x2="300" y2="10" stroke="#e5e7eb" strokeDasharray="2,2" />
                <line x1="25" y1={chartHeight} x2="300" y2={chartHeight} stroke="#e5e7eb" />
                
                <g transform="translate(30, 0)">
                    {data.map((d, i) => {
                        const incomeHeight = (d.income / maxValue) * chartHeight;
                        const expenseHeight = (d.expense / maxValue) * chartHeight;
                        const x = i * (barWidth + barGap);

                        return (
                            <g key={d.date}>
                                <rect 
                                    x={x}
                                    y={chartHeight - incomeHeight}
                                    width={barWidth / 2}
                                    height={incomeHeight}
                                    fill="#22c55e"
                                    rx="2"
                                />
                                <rect 
                                    x={x + barWidth / 2}
                                    y={chartHeight - expenseHeight}
                                    width={barWidth / 2}
                                    height={expenseHeight}
                                    fill="#ef4444"
                                    rx="2"
                                />
                                <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" fontSize="9" fill="#6b7280">
                                    {new Date(d.date+'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                </text>
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    );
};

const formatDateHeader = (dateString: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const date = new Date(dateString+'T00:00:00');

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";

    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
};

const TransactionRow: React.FC<{ tx: Transaction, categories: Category[], onEdit: (tx: Transaction) => void, onDelete: (tx: Transaction) => void }> = ({ tx, categories, onEdit, onDelete }) => {
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

    return (
        <div className="flex items-center py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xl mr-4 ${displayColor}`}>
                {displayIcon}
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{tx.description}</p>
                <p className="text-sm text-gray-500 truncate">{displayCategory}</p>
            </div>
            <div className="text-right ml-4">
                <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
            <div className="flex items-center ml-4">
                <button onClick={() => onEdit(tx)} className="p-2 text-gray-400 hover:text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.036 6.536z" /></svg></button>
                <button onClick={() => onDelete(tx)} className="p-2 text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
        </div>
    );
}

interface TransactionsProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    setActiveView: (view: View) => void;
    handleOpenTxModal: (data?: Transaction | { prefill: Partial<Transaction> } | null) => void;
    handleDeleteRequest: (item: DeletableItem, message?: string) => void;
    handleImportTransactions: (accountId: string, transactions: Omit<Transaction, 'id' | 'accountId'>[], newCategoryNames: string[]) => void;
}

const NoAccountsCTA: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => (
    <div className="text-center py-16 px-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl mt-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
        <h3 className="mt-4 text-xl font-semibold text-gray-700">Créez votre premier compte</h3>
        <p className="mt-1 text-gray-500 max-w-md mx-auto">Pour pouvoir ajouter et suivre vos transactions, vous devez d'abord créer un compte financier.</p>
        <div className="mt-6">
            <button onClick={onNavigate} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                <span>Aller aux comptes</span>
            </button>
        </div>
    </div>
);

const Transactions: React.FC<TransactionsProps> = ({ accounts, transactions, categories, setActiveView, handleOpenTxModal, handleDeleteRequest, handleImportTransactions }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('journal');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAccount, setFilterAccount] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

    const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
    const docFileInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [csvContent, setCsvContent] = useState<string | null>(null);
    const [isImportModalOpen, setImportModalOpen] = useState(false);

    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.name])), [accounts]);
    
    const handleResetFilters = useCallback(() => {
        setSearchTerm('');
        setFilterAccount('');
        setFilterType('');
        setFilterCategory('');
        setFilterStartDate('');
        setFilterEndDate('');
    }, []);

    const filteredTransactions = useMemo((): Transaction[] => {
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
            const accountMatch = !filterAccount || t.accountId === filterAccount;
            const typeMatch = !filterType || t.type === filterType;
            const categoryMatch = !filterCategory || (t.splits ? t.splits.some(s => s.category === filterCategory) : t.category === filterCategory);
            const startDate = filterStartDate ? new Date(`${filterStartDate}T00:00:00`) : null;
            const endDate = filterEndDate ? new Date(`${filterEndDate}T23:59:59`) : null;
            const dateMatch = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
            
            return searchMatch && accountMatch && typeMatch && dateMatch && categoryMatch;
            // FIX: Remove explicit types from sort callback arguments to allow TypeScript to infer them correctly.
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, searchTerm, filterAccount, filterType, filterCategory, filterStartDate, filterEndDate]);

    const groupedTransactions = useMemo(() => {
        return filteredTransactions.reduce((acc, tx) => {
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = { transactions: [], net: 0 };
            }
            acc[dateKey].transactions.push(tx);
            acc[dateKey].net += tx.amount;
            return acc;
        }, {} as Record<string, { transactions: Transaction[], net: number }>);
    }, [filteredTransactions]);

    const chartData = useMemo(() => {
        const dailyData = filteredTransactions.reduce<Record<string, { date: string, income: number, expense: number }>>((acc, tx) => {
            const dateKey = new Date(tx.date).toISOString().split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = { date: dateKey, income: 0, expense: 0 };
            if (tx.type === TransactionType.INCOME) acc[dateKey].income += tx.amount;
            else acc[dateKey].expense += Math.abs(tx.amount);
            return acc;
        }, {});
        return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredTransactions]);

    const handleExportCSV = useCallback(() => {
        if (filteredTransactions.length === 0) { alert("Aucune transaction à exporter."); return; }
        const headers = ["Date", "Description", "Montant", "Compte", "Catégorie"];
        const csvRows = [
            headers.join(','),
            ...filteredTransactions.map(tx => [
                new Date(tx.date).toLocaleDateString('fr-CA'),
                `"${tx.description.replace(/"/g, '""')}"`,
                tx.amount,
                `"${accountMap.get(tx.accountId)?.replace(/"/g, '""') || ''}"`,
                `"${(tx.splits ? tx.splits.map(s => `${s.category} (${s.amount.toFixed(2)})`).join(' | ') : tx.category).replace(/"/g, '""')}"`,
            ].join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'transactions.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredTransactions, accountMap]);

    const handleAnalyzeDocument = async (file: File) => {
        setIsAnalyzingDoc(true);
        try {
            const base64Data = await fileToBase64(file);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: {
                    parts: [
                        { inlineData: { mimeType: file.type, data: base64Data } },
                        { text: "Extrais le nom du vendeur, le montant total et la date de ce document. Formate la date en YYYY-MM-DD." }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            vendeur: { type: Type.STRING },
                            montant: { type: Type.NUMBER },
                            date: { type: Type.STRING }
                        }
                    }
                }
            });

            const parsed: {vendeur: string; montant: number; date: string} = JSON.parse(response.text);
            const { vendeur, montant, date } = parsed;
            
            if (!vendeur || !montant || !date) {
                 throw new Error("Impossible d'extraire toutes les informations.");
            }

            handleOpenTxModal({ prefill: {
                description: vendeur,
                amount: montant,
                date: new Date(`${date}T00:00:00`),
            }});

        } catch (error) {
            console.error("Erreur d'analyse du document:", error);
            alert("Désolé, je n'ai pas pu lire les informations sur ce document. Veuillez essayer avec une image plus claire.");
        } finally {
            setIsAnalyzingDoc(false);
        }
    };

    const handleDocFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleAnalyzeDocument(file);
        }
        event.target.value = '';
    };

    const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setCsvContent(text);
                setImportModalOpen(true);
            };
            reader.readAsText(file);
        }
        event.target.value = ''; // Réinitialiser pour permettre la sélection du même fichier
    };


    if (accounts.length === 0) {
        return (
            <div className="container mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Mes Transactions</h2>
                <NoAccountsCTA onNavigate={() => setActiveView('accounts')} />
            </div>
        );
    }

    return (
        <div className="container mx-auto">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900">Journal des Transactions</h2>
                 <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                    <input type="file" ref={docFileInputRef} onChange={handleDocFileChange} className="hidden" accept="image/*" />
                    <input type="file" ref={csvInputRef} onChange={handleCsvFileSelect} className="hidden" accept=".csv" />
                    <button onClick={handleExportCSV} className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors duration-300 border border-gray-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                         <span>Exporter</span>
                    </button>
                     <button onClick={() => csvInputRef.current?.click()} className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors duration-300 border border-gray-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        <span>Importer CSV</span>
                    </button>
                    <button onClick={() => docFileInputRef.current?.click()} disabled={isAnalyzingDoc} className="bg-indigo-200 hover:bg-indigo-300 text-indigo-800 font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isAnalyzingDoc ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                        <span>{isAnalyzingDoc ? 'Analyse...' : 'Scanner un reçu'}</span>
                    </button>
                    <button onClick={() => handleOpenTxModal()} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        <span>Ajouter Transaction</span>
                    </button>
                 </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex items-center gap-4">
                        <h4 className="font-bold text-gray-800">Filtres</h4>
                         <div className="flex items-center bg-gray-200 p-1 rounded-lg">
                            <button onClick={() => setViewMode('journal')} className={`px-3 py-1.5 rounded-md transition-colors text-sm font-semibold ${viewMode === 'journal' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300/50'}`}>Journal</button>
                            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded-md transition-colors text-sm font-semibold ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-300/50'}`}>Calendrier</button>
                        </div>
                    </div>
                    <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className="p-1 text-gray-500 hover:text-indigo-600 flex items-center gap-1 text-sm mt-2 sm:mt-0">
                        <span>{isFilterPanelOpen ? 'Masquer' : 'Afficher'} les filtres</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                {isFilterPanelOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end mt-4">
                        <div className="relative xl:col-span-2">
                            <label className="text-xs text-gray-500">Recherche</label>
                            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-lg pl-10 pr-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                        </div>
                         <div><label className="text-xs text-gray-500">Compte</label><select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Tous les comptes</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></div>
                         <div><label className="text-xs text-gray-500">Type</label><select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Tous les types</option><option value={TransactionType.INCOME}>Revenu</option><option value={TransactionType.EXPENSE}>Dépense</option></select></div>
                         <div><label className="text-xs text-gray-500">Date de début</label><input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light]"/></div>
                         <div><label className="text-xs text-gray-500">Date de fin</label><input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:light]"/></div>
                         <button onClick={handleResetFilters} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-lg text-sm">Réinitialiser</button>
                    </div>
                )}
            </div>
            
            {viewMode === 'journal' ? (
                Object.keys(groupedTransactions).length > 0 ? (
                    <div className="space-y-6">
                        {Object.keys(groupedTransactions).map((date) => {
                            const group = groupedTransactions[date];
                            return (
                                <div key={date}>
                                    <div className="flex justify-between items-baseline pb-2 mb-2 border-b border-gray-200">
                                        <h3 className="font-bold text-lg text-gray-800">{formatDateHeader(date)}</h3>
                                        <span className={`font-semibold ${group.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{group.net.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {group.transactions.map(tx => <TransactionRow key={tx.id} tx={tx} categories={categories} onEdit={() => handleOpenTxModal(tx)} onDelete={() => handleDeleteRequest({ type: 'transaction', data: tx })} />)}
                                    </div>
                                </div>
                            );
                        })}
                         <CashflowChart data={chartData} />
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">Aucune transaction ne correspond à vos filtres.</div>
                )
            ) : (
                <CalendarView 
                    transactions={filteredTransactions}
                    categories={categories}
                    onEdit={(tx) => handleOpenTxModal(tx)}
                    onDelete={(tx) => handleDeleteRequest({ type: 'transaction', data: tx })}
                />
            )}
             <ImportCsvModal 
                isOpen={isImportModalOpen}
                onClose={() => setImportModalOpen(false)}
                onSave={handleImportTransactions}
                accounts={accounts}
                csvContent={csvContent}
            />
        </div>
    );
};

export default Transactions;