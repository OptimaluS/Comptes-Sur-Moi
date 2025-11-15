import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Account, Transaction, Category } from '../types';

interface AiInsightsProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
}

const InsightSkeleton: React.FC = () => (
    <div className="animate-pulse flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
        <div className="w-full space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);


const AiInsights: React.FC<AiInsightsProps> = ({ accounts, transactions, categories }) => {
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const dataSignature = useMemo(() => {
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balanceHistory[0]?.amount ?? 0), 0);
        return `${accounts.length}-${transactions.length}-${categories.length}-${totalBalance}`;
    }, [accounts, transactions, categories]);


    useEffect(() => {
        const generateInsights = async () => {
            if (transactions.length < 5) {
                setIsLoading(false);
                setInsights([]);
                return;
            }

            setIsLoading(true);
            setError(null);
            
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const now = new Date();
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

                const formatDataForPrompt = () => {
                    const accountsSummary = accounts.map(a => `  - ${a.name} (Solde: ${a.balanceHistory[0]?.amount.toFixed(2)}€)`).join('\n');
                    const goalsSummary = accounts.filter(a => a.goalName && a.goalAmount)
                        .map(a => `  - Objectif '${a.goalName}' pour le compte '${a.name}': ${a.balanceHistory[0]?.amount.toFixed(2)}€ / ${a.goalAmount?.toFixed(2)}€`)
                        .join('\n');
                    const budgetsSummary = categories.filter(c => c.budget && c.budget > 0)
                        .map(c => `  - ${c.name}: ${c.budget.toFixed(2)}€`)
                        .join('\n');
                    
                    const recentTransactions = transactions.filter(t => new Date(t.date) >= startOfLastMonth)
                        .map(t => `  - ${new Date(t.date).toISOString().split('T')[0]}: ${t.description} (${t.amount.toFixed(2)}€) [Catégorie: ${t.category}]`)
                        .join('\n');

                    return `
                        Date Actuelle: ${now.toISOString().split('T')[0]}
                        Comptes de l'utilisateur:\n${accountsSummary}
                        Objectifs d'épargne:\n${goalsSummary || "Aucun"}
                        Budgets mensuels:\n${budgetsSummary || "Aucun"}
                        Transactions des 2 derniers mois:\n${recentTransactions}
                    `;
                };

                const prompt = `
                    En tant qu'assistant financier perspicace, analyse les données suivantes et génère 2 ou 3 observations ou conseils clés, courts et pertinents pour l'utilisateur.
                    Concentre-toi sur les tendances, les anomalies, les progrès vers les objectifs et les habitudes de dépenses.
                    Sois proactif et utilise un ton encourageant.
                    
                    Exemples de bonnes observations :
                    - "J'ai remarqué que vos dépenses en 'Restaurant' ont augmenté de 20% ce mois-ci par rapport au mois dernier."
                    - "Vous êtes en bonne voie pour atteindre votre objectif d'épargne pour votre 'Voyage au Japon' ce mois-ci !"
                    - "Attention, vous avez presque atteint votre budget pour la catégorie 'Shopping'."
                    - "Bravo, vos revenus ce mois-ci sont supérieurs de 150€ à ceux du mois dernier."

                    Voici les données de l'utilisateur:
                    ${formatDataForPrompt()}
                `;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                insights: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                }
                            }
                        }
                    }
                });

                const parsedResponse = JSON.parse(response.text);
                if (parsedResponse.insights && Array.isArray(parsedResponse.insights)) {
                    setInsights(parsedResponse.insights);
                } else {
                    setInsights([]);
                }

            } catch (err) {
                console.error("Erreur lors de la génération des insights IA:", err);
                setError("Désolé, impossible de générer les aperçus pour le moment.");
            } finally {
                setIsLoading(false);
            }
        };

        generateInsights();

    }, [dataSignature, accounts, transactions, categories]);

    if (isLoading) {
        return (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-1.082.186l-6.25 6.25a1 1 0 000 1.414l8.75 8.75a1 1 0 001.414 0l6.25-6.25a1 1 0 00-.186-1.082l-5-2.5a1 1 0 00-1.082.186l-2.22 2.22a1 1 0 01-1.414 0l-2.122-2.122a1 1 0 010-1.414l2.22-2.22a1 1 0 00-.186-1.082l-2.5-5z" /><path d="M9 4.75A.75.75 0 019.75 4h.5a.75.75 0 010 1.5h-.5A.75.75 0 019 4.75zM11.75 6h.5a.75.75 0 010 1.5h-.5a.75.75 0 010-1.5zM4 9.75A.75.75 0 014.75 9h.5a.75.75 0 010 1.5h-.5A.75.75 0 014 9.75zM6 11.75a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z" /></svg>
                    <span>Aperçus de l'IA</span>
                </h3>
                <div className="space-y-3">
                    <InsightSkeleton />
                    <InsightSkeleton />
                </div>
            </div>
        )
    }

    if (error || insights.length === 0) {
        return null;
    }
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-1.082.186l-6.25 6.25a1 1 0 000 1.414l8.75 8.75a1 1 0 001.414 0l6.25-6.25a1 1 0 00-.186-1.082l-5-2.5a1 1 0 00-1.082.186l-2.22 2.22a1 1 0 01-1.414 0l-2.122-2.122a1 1 0 010-1.414l2.22-2.22a1 1 0 00-.186-1.082l-2.5-5z" /><path d="M9 4.75A.75.75 0 019.75 4h.5a.75.75 0 010 1.5h-.5A.75.75 0 019 4.75zM11.75 6h.5a.75.75 0 010 1.5h-.5a.75.75 0 010-1.5zM4 9.75A.75.75 0 014.75 9h.5a.75.75 0 010 1.5h-.5A.75.75 0 014 9.75zM6 11.75a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z" /></svg>
                <span>Aperçus de l'IA</span>
            </h3>
            <div className="space-y-3">
                {insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.252a.25.25 0 00.5 0V2.75A.75.75 0 0112 2h.25a.25.25 0 000-.5H12a.75.75 0 01-.75.75V3a.25.25 0 00-.5 0V2.25A.75.75 0 0110 2zM8 2a.75.75 0 01.75.75v.252a.25.25 0 00.5 0V2.75A.75.75 0 0110 2h.25a.25.25 0 000-.5H10a.75.75 0 01-.75.75V3a.25.25 0 00-.5 0V2.25A.75.75 0 018 2zM6.21 4.77a.75.75 0 01.02-1.06l.354-.353a.25.25 0 000-.354l-.354-.353a.75.75 0 111.06-1.06l.354.353a.25.25 0 00.354 0l.353-.353a.75.75 0 111.06 1.06l-.353.353a.25.25 0 000 .354l.353.353a.75.75 0 11-1.06 1.06l-.353-.353a.25.25 0 00-.354 0l-.354.353a.75.75 0 01-1.06-.02zM10 6a4 4 0 100 8 4 4 0 000-8zm-6.25 4a.75.75 0 01.75-.75h.252a.25.25 0 000-.5H4.75a.75.75 0 010-1.5h.252a.25.25 0 000-.5H4.75a.75.75 0 010-1.5H5a.25.25 0 00.5 0H4.75A.75.75 0 014 10zm11.25 0a.75.75 0 01.75-.75h.252a.25.25 0 000-.5H16.75a.75.75 0 010-1.5h.252a.25.25 0 000-.5H16.75a.75.75 0 010-1.5H17a.25.25 0 00.5 0H16.75a.75.75 0 01-.75.75v.25a.25.25 0 00.5 0v-.25A.75.75 0 0116 10zM10 18a.75.75 0 01.75-.75v-.252a.25.25 0 00-.5 0v.252A.75.75 0 0110 18zm-1.75.75a.75.75 0 010-1.5h.252a.25.25 0 000 .5h-.252a.75.75 0 010 1.5zM12 18a.75.75 0 01.75-.75v-.252a.25.25 0 00-.5 0v.252A.75.75 0 0112 18z" clipRule="evenodd" /></svg>
                        </div>
                        <p className="text-sm text-gray-800">{insight}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiInsights;
