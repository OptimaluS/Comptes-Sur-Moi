import type { Transaction, RecurringTransaction, BalanceEntry } from './types';
import { Frequency } from './types';

/**
 * Recalcule l'historique complet des soldes pour un compte en fonction de ses transactions.
 * @param transactionsForAccount - Toutes les transactions appartenant à un seul compte.
 * @returns Un tableau d'objets BalanceEntry, trié du plus récent au plus ancien.
 */
export const recalculateBalanceHistory = (transactionsForAccount: Transaction[]): BalanceEntry[] => {
    if (transactionsForAccount.length === 0) {
        return [];
    }
    
    // Fonction d'assistance pour obtenir une clé de date cohérente (YYYY-MM-DD)
    const toYYYYMMDD = (d: Date) => {
        const date = new Date(d);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Regrouper les transactions par jour et additionner les montants pour obtenir le changement net de chaque jour
    const dailyChanges = transactionsForAccount.reduce((acc, tx) => {
        const dateKey = toYYYYMMDD(tx.date);
        acc[dateKey] = (acc[dateKey] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    // Trier les dates par ordre chronologique pour calculer correctement le solde cumulé
    const sortedDates = Object.keys(dailyChanges).sort();
    
    let cumulativeBalance = 0;
    const finalHistory: BalanceEntry[] = sortedDates.map(dateKey => {
        cumulativeBalance += dailyChanges[dateKey];
        // Utiliser une heure spécifique pour éviter les problèmes de fuseau horaire
        return { date: new Date(`${dateKey}T12:00:00`), amount: cumulativeBalance };
    });
    
    // Trier l'historique final par ordre décroissant (le plus récent en premier) pour l'affichage
    return finalHistory.sort((a: BalanceEntry, b: BalanceEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Convertit un objet Fichier en une chaîne de caractères base64.
 * @param file - Le fichier à convertir.
 * @returns Une promesse qui se résout avec la chaîne base64 (sans le préfixe MIME).
 */
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Retirer "data:mime/type;base64,"
    };
    reader.onerror = (error) => reject(error);
  });

/**
 * Calcule la prochaine date d'échéance pour une règle de transaction récurrente.
 * @param rule - La règle de transaction récurrente.
 * @param allTransactions - La liste de toutes les transactions pour trouver la dernière occurrence.
 * @returns La prochaine date d'échéance, ou null si la règle est terminée.
 */
export const getNextDueDate = (rule: RecurringTransaction, allTransactions: Transaction[]): Date | null => {
    const generatedTransactions = allTransactions
        .filter(t => t.recurringTransactionId === rule.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastGeneratedDate = generatedTransactions.length > 0
        ? new Date(generatedTransactions[0].date)
        : null;

    let nextDueDate: Date;

    if (lastGeneratedDate) {
        nextDueDate = new Date(lastGeneratedDate);
        if (rule.frequency === Frequency.MONTHLY) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        } else { // YEARLY
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }
    } else {
        nextDueDate = new Date(rule.startDate);
    }

    if (rule.endDate && nextDueDate > new Date(rule.endDate)) {
        return null;
    }

    return nextDueDate;
};

/**
 * Tente de parser une chaîne de date dans différents formats courants.
 * @param dateString - La chaîne de date à parser.
 * @returns Un objet Date ou null si le format est invalide.
 */
export const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;

    // 1. Essayer le format YYYY-MM-DD (le plus fiable)
    let d = new Date(dateString);
    if (!isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(d.getTime() + d.getTimezoneOffset() * 60000); // Corriger le fuseau horaire
    }

    // 2. Essayer les formats DD/MM/YYYY ou MM/DD/YYYY
    const parts = dateString.match(/(\d+)/g);
    if (parts && parts.length === 3) {
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const p3 = parseInt(parts[2], 10);

        // Heuristique simple: si p3 > 1000, c'est l'année.
        if (p3 > 1000) { // Format DD/MM/YYYY
            d = new Date(p3, p2 - 1, p1);
            if (!isNaN(d.getTime())) return d;
        } else if (p1 > 1000) { // Format YYYY/MM/DD
             d = new Date(p1, p2 - 1, p3);
             if (!isNaN(d.getTime())) return d;
        }
    }
    
    // 3. Essayer de le parser directement, au cas où
    d = new Date(dateString);
    if (!isNaN(d.getTime())) return d;

    return null;
};

/**
 * Parse un contenu CSV en un tableau de tableaux de chaînes.
 * Gère les champs entre guillemets.
 * @param csvContent - Le contenu du fichier CSV.
 * @returns Un tableau représentant les lignes et les cellules.
 */
export const parseCSV = (csvContent: string): string[][] => {
    const rows = csvContent.replace(/\r/g, '').split('\n');
    return rows
        .map(row => {
            const result: string[] = [];
            let current = '';
            let inQuote = false;
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        })
        .filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''));
};
