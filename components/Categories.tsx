import React, { useMemo, useCallback } from 'react';
import type { Category, Transaction, DeletableItem } from '../types';
import { UNCATEGORIZED } from '../types';

interface CategoriesProps {
    categories: Category[];
    transactions: Transaction[];
    handleOpenCategoryModal: (category?: Category | null) => void;
    handleDeleteRequest: (item: DeletableItem, message?: string) => void;
}

const CategoryCard: React.FC<{ category: Category; transactionCount: number; totalSpent: number; onEdit: (category: Category) => void; onDelete: (category: Category) => void; }> = ({ category, transactionCount, totalSpent, onEdit, onDelete }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${category.color}`}>{category.icon}</div>
                <div><h4 className="font-bold text-gray-800">{category.name}</h4></div>
            </div>
            <div className="flex items-center">
                <button onClick={() => onEdit(category)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors" aria-label="Modifier"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                <button onClick={() => onDelete(category)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors" aria-label="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
            </div>
        </div>
         <div className="mt-4 pt-4 border-t border-gray-200/60 text-left space-y-1">
            <p className="text-sm text-gray-500">{transactionCount} transaction(s) ce mois-ci</p>
            <p className="text-sm text-gray-500">Total dépensé: <span className="font-semibold text-gray-700">{totalSpent.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span></p>
        </div>
    </div>
);

const Categories: React.FC<CategoriesProps> = ({ categories, transactions, handleOpenCategoryModal, handleDeleteRequest }) => {

    const monthlyCategoryData = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthlyTxs = transactions.filter(t => new Date(t.date) >= startOfMonth && new Date(t.date) <= endOfMonth);
        
        return monthlyTxs.reduce((acc, t) => {
            const process = (categoryName: string, amount: number) => {
                const catName = categoryName || UNCATEGORIZED;
                if (!acc[catName]) acc[catName] = { spent: 0, count: 0 };
                if (t.type === 'DEPENSE') {
                    acc[catName].spent += amount;
                }
                acc[catName].count += 1;
            };

            if (t.splits && t.splits.length > 0) {
                t.splits.forEach(split => process(split.category, split.amount));
            } else {
                process(t.category, Math.abs(t.amount));
            }
            return acc;
        }, {} as Record<string, { spent: number; count: number }>);
    }, [transactions]);

    const handleExportCategoriesCSV = useCallback(() => {
        const categoriesToExport = categories.filter(c => c.name !== 'Solde Initial');
        if (categoriesToExport.length === 0) {
            alert("Aucune catégorie à exporter.");
            return;
        }
        const headers = ["Nom", "Icône", "Couleur", "Budget"];
        const csvRows = [
            headers.join(','),
            ...categoriesToExport.map(cat => [
                `"${cat.name.replace(/"/g, '""')}"`, `"${cat.icon}"`, `"${cat.color}"`,
                cat.budget !== undefined ? cat.budget : ''
            ].join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'categories.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [categories]);

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900">Gestion des Catégories</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCategoriesCSV} className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors duration-300 border border-gray-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        <span>Exporter</span>
                    </button>
                    <button onClick={() => handleOpenCategoryModal()} className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        <span>Nouvelle Catégorie</span>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.filter(c => c.name !== 'Solde Initial').map(cat => {
                    const data = monthlyCategoryData[cat.name] || { spent: 0, count: 0 };
                    return (
                        <CategoryCard 
                            key={cat.id} 
                            category={cat} 
                            transactionCount={data.count} 
                            totalSpent={data.spent} 
                            onEdit={handleOpenCategoryModal}
                            onDelete={(cat) => handleDeleteRequest({ type: 'category', data: cat }, "Êtes-vous sûr de vouloir supprimer cette catégorie ? Les transactions associées seront marquées comme 'Non catégorisées'.")}
                        />
                    );
                })}
            </div>

            {categories.length <= 1 && ( // Only 'Solde Initial'
                <div className="text-center py-16 px-6 bg-white border-2 border-dashed border-gray-200 rounded-2xl mt-8 col-span-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">Commencez à organiser vos finances</h3>
                    <p className="mt-1 text-gray-500">Créez des catégories pour mieux comprendre où va votre argent.</p>
                </div>
            )}
        </div>
    );
};

export default Categories;