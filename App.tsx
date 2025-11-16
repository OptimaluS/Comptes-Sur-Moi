import React, { useState, useEffect, useCallback } from 'react';
// Contexte clin d'œil
const WinkContext = React.createContext({ triggerWink: () => {} });
// État pour animation clin d'œil
// ...le reste du code...
import Header from './components/Header';
import { getGreeting } from './components/Dashboard';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import Budgets from './components/Budgets';
import Reports from './components/Reports';
import ChatIA from './components/ChatIA';
import Categories from './components/Categories';
import Deadlines from './components/Deadlines';
import Goals from './components/Goals';
import AddTransactionModal from './components/AddTransactionModal';
import AddRecurringTransactionModal from './components/AddRecurringTransactionModal';
import CategoryModal from './components/CategoryEditModal';
import ConfirmationModal from './components/ConfirmationModal';
import ToastContainer from './components/ToastContainer';
import AddGoalModal from './components/AddGoalModal';
import UpdateNotification from './components/UpdateNotification';
import type { Account, Transaction, RecurringTransaction, NotificationSettings, Category, Goal, DeletableItem, Notification } from './types';
import { Frequency, UNCATEGORIZED, NotificationMethod, SPLIT_TRANSACTION, NotificationType, TransactionType } from './types';
import { recalculateBalanceHistory, getNextDueDate } from './utils';

export type View = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'reports' | 'chat' | 'settings' | 'categories' | 'deadlines' | 'goals';


const defaultCategories: Category[] = [
    { id: '1', name: 'Alimentation', icon: '🛒', color: 'bg-sky-500' },
    { id: '2', name: 'Logement', icon: '🏠', color: 'bg-orange-500' },
    { id: '3', name: 'Transport', icon: '🚗', color: 'bg-violet-500' },
    { id: '4', name: 'Loisirs', icon: '🎬', color: 'bg-pink-500' },
    { id: '5', name: 'Santé', icon: '💊', color: 'bg-red-500' },
    { id: '6', name: 'Factures', icon: '🧾', color: 'bg-amber-500' },
    { id: '7', name: 'Shopping', icon: '🛍️', color: 'bg-teal-500' },
    { id: '8', name: 'Salaire', icon: '💰', color: 'bg-emerald-500' },
    { id: '9', name: 'Solde Initial', icon: '🏦', color: 'bg-gray-400' },
    { id: '10', name: 'Virement', icon: '🔁', color: 'bg-cyan-500' },
];

const defaultNotificationSettings: NotificationSettings = {
    lowBalance: NotificationMethod.IN_APP,
    deadlines: NotificationMethod.IN_APP,
    budgets: NotificationMethod.IN_APP,
};


const App: React.FC = () => {

    // Déclaration des hooks d'état
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [categories, setCategories] = useState<Category[]>(defaultCategories);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toasts, setToasts] = useState<Notification[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Animation clin d'œil
    const [wink, setWink] = useState(false);
    const triggerWink = useCallback(() => {
        setWink(true);
        setTimeout(() => setWink(false), 1000);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            (async () => {
                try {
                    const stateToSave = {
                        accounts,
                        transactions,
                        recurringTransactions,
                        categories,
                        notificationSettings,
                        goals
                    };
                    await window.api.saveData(stateToSave);
                    if (window.api.saveBackup) {
                        await window.api.saveBackup(stateToSave, 'auto');
                        setToasts(prev => [...prev, {
                            id: crypto.randomUUID(),
                            type: NotificationType.DEADLINE_SOON,
                            message: 'Une sauvegarde automatique a été créée.',
                            date: new Date(),
                            isRead: false,
                            relatedId: 'auto-backup'
                        }]);
                    }
                } catch (err) {
                    setToasts(prev => [...prev, {
                        id: crypto.randomUUID(),
                        type: NotificationType.OVERDUE,
                        message: 'Erreur lors de la sauvegarde automatique.',
                        date: new Date(),
                        isRead: false,
                        relatedId: 'auto-save-error'
                    }]);
                }
            })();
        }, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, [accounts, transactions, recurringTransactions, categories, notificationSettings, goals]);

    // Expose l'état global et la fonction de restauration pour Settings APRÈS l'initialisation des hooks
    useEffect(() => {
        window.__APP_STATE__ = {
            accounts,
            transactions,
            recurringTransactions,
            categories,
            notificationSettings,
            goals,
        };
        window.__APP_RESTORE__ = (restored) => {
            setAccounts((restored.accounts || []).map((acc) => ({
                ...acc,
                balanceHistory: (acc.balanceHistory || []).map((entry) => ({ ...entry, date: new Date(entry.date) }))
            })));
            setTransactions((restored.transactions || []).map((tx) => ({ ...tx, date: new Date(tx.date) })));
            setRecurringTransactions((restored.recurringTransactions || []).map((rtx) => ({
                ...rtx,
                startDate: new Date(rtx.startDate),
                endDate: rtx.endDate ? new Date(rtx.endDate) : undefined,
            })));
            setCategories(restored.categories || defaultCategories);
            setNotificationSettings(restored.notificationSettings || defaultNotificationSettings);
            setGoals(restored.goals || []);
        };
    }, [accounts, transactions, recurringTransactions, categories, notificationSettings, goals]);
    // Expose l'état global et la fonction de restauration pour Settings APRÈS l'initialisation
    React.useEffect(() => {
        window.__APP_STATE__ = {
            accounts,
            transactions,
            recurringTransactions,
            categories,
            notificationSettings,
            goals,
        };
        window.__APP_RESTORE__ = (restored) => {
            setAccounts((restored.accounts || []).map((acc) => ({
                ...acc,
                balanceHistory: (acc.balanceHistory || []).map((entry) => ({ ...entry, date: new Date(entry.date) }))
            })));
            setTransactions((restored.transactions || []).map((tx) => ({ ...tx, date: new Date(tx.date) })));
            setRecurringTransactions((restored.recurringTransactions || []).map((rtx) => ({
                ...rtx,
                startDate: new Date(rtx.startDate),
                endDate: rtx.endDate ? new Date(rtx.endDate) : undefined,
            })));
            setCategories(restored.categories || defaultCategories);
            setNotificationSettings(restored.notificationSettings || defaultNotificationSettings);
            setGoals(restored.goals || []);
        };
    }, [accounts, transactions, recurringTransactions, categories, notificationSettings, goals]);


  // --- Gestion centralisée des modales ---
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [prefilledTxData, setPrefilledTxData] = useState<Partial<Omit<Transaction, 'id' | 'type' | 'category' | 'accountId'>> & { amount?: number } | null>(null);
  
  const [isRecurringTxModalOpen, setIsRecurringTxModalOpen] = useState(false);
  const [recurringTxToEdit, setRecurringTxToEdit] = useState<RecurringTransaction | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{item: DeletableItem, message?: string} | null>(null);


  // Effet pour charger l'état depuis le fichier au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedState = await window.api.readData();
        if (savedState) {
            // "Réhydrater" les dates qui sont stockées en tant que chaînes ISO
            const hydratedTransactions = (savedState.transactions || []).map((tx: any) => ({
                ...tx,
                date: new Date(tx.date),
            }));
            const hydratedRecurringTxs = (savedState.recurringTransactions || []).map((rtx: any) => ({
                ...rtx,
                startDate: new Date(rtx.startDate),
                endDate: rtx.endDate ? new Date(rtx.endDate) : undefined,
            }));
             const hydratedAccounts = (savedState.accounts || []).map((acc: any) => ({
                ...acc,
                balanceHistory: (acc.balanceHistory || []).map((entry: any) => ({
                    ...entry,
                    date: new Date(entry.date)
                }))
            }));

            setAccounts(hydratedAccounts);
            setTransactions(hydratedTransactions);
            setRecurringTransactions(hydratedRecurringTxs);
            setCategories(savedState.categories || defaultCategories);
            setNotificationSettings(savedState.notificationSettings || defaultNotificationSettings);
            setGoals(savedState.goals || []);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
      }
    };
    loadData();
  }, []);

  // Effet pour sauvegarder l'état dans un fichier à chaque modification
  useEffect(() => {
    const saveData = async () => {
        try {
            const stateToSave = {
                accounts,
                transactions,
                recurringTransactions,
                categories,
                notificationSettings,
                goals,
            };
            await window.api.saveData(stateToSave);
        } catch (err) {
            console.error("Erreur lors de la sauvegarde des données:", err);
        }
    };
    // On ne sauvegarde que si les données ont été chargées initialement pour éviter d'écraser le fichier avec un état vide
    if(accounts.length > 0 || transactions.length > 0 || recurringTransactions.length > 0 || goals.length > 0) {
        saveData();
    }
  }, [accounts, transactions, recurringTransactions, categories, notificationSettings, goals]);


  const handleCloseToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // --- Handlers pour la modale de transaction ---
  const handleOpenTxModal = useCallback((data: Transaction | { prefill: Partial<Transaction> } | null = null) => {
      if (data && 'id' in data) { 
          setTransactionToEdit(data);
          setPrefilledTxData(null);
      } else if (data && 'prefill' in data) {
          setTransactionToEdit(null);
          setPrefilledTxData(data.prefill);
      } else {
          setTransactionToEdit(null);
          setPrefilledTxData(null);
      }
      setIsTxModalOpen(true);
  }, []);

    const handleCloseTxModal = useCallback(() => {
        setIsTxModalOpen(false);
        setTransactionToEdit(null);
        setPrefilledTxData(null);
        setTimeout(() => {
            triggerWink();
        }, 1000);
    }, [triggerWink]);
  
    const handleSaveTransaction = useCallback((data: Omit<Transaction, 'id'>) => {
      const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
      const categoriesToCreate: string[] = [];

      if (data.splits) {
        data.splits.forEach(s => categoriesToCreate.push(s.category));
      } else {
        categoriesToCreate.push(data.category);
      }

      categoriesToCreate.forEach(catName => {
          const finalCategoryName = catName.trim() || UNCATEGORIZED;
          if (finalCategoryName !== UNCATEGORIZED && !categoryMap.has(finalCategoryName)) {
              const newCategory: Category = { id: crypto.randomUUID(), name: finalCategoryName, icon: '🏷️', color: 'bg-gray-500' };
              setCategories(prev => [...prev, newCategory]);
          }
      });
      
      let updatedTransactions: Transaction[];
      const affectedAccountIds = new Set<string>();

      if (transactionToEdit) {
          const originalTx = transactions.find(t => t.id === transactionToEdit.id);
          if(originalTx) affectedAccountIds.add(originalTx.accountId);
          const updatedTx = { ...transactionToEdit, ...data };
          updatedTransactions = transactions.map(t => t.id === transactionToEdit.id ? updatedTx : t);
          affectedAccountIds.add(updatedTx.accountId);
      } else {
           const newTx: Transaction = { ...data, id: crypto.randomUUID() };
           updatedTransactions = [...transactions, newTx];
           affectedAccountIds.add(newTx.accountId);
      }

      setTransactions(updatedTransactions);
      setAccounts(prevAccounts => prevAccounts.map(account => {
          if (!affectedAccountIds.has(account.id)) return account;
          const newBalanceHistory = recalculateBalanceHistory(updatedTransactions.filter(t => t.accountId === account.id));
          return { ...account, balanceHistory: newBalanceHistory };
      }));
      triggerWink();
      handleCloseTxModal();
  }, [transactionToEdit, transactions, categories, handleCloseTxModal]);

  const handleImportTransactions = useCallback((accountId: string, importedTxs: (Omit<Transaction, 'id' | 'accountId'>)[], newCategoryNames: string[]) => {
      // 1. Créer de nouvelles catégories si elles n'existent pas
      const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat]));
      const categoriesToAdd: Category[] = newCategoryNames
          .map(name => name.trim())
          .filter(name => name && !categoryMap.has(name.toLowerCase()))
          // Éviter les doublons dans le lot à ajouter
          .filter((name, index, self) => self.indexOf(name) === index)
          .map(name => ({ id: crypto.randomUUID(), name, icon: '🏷️', color: 'bg-gray-500' }));

      if (categoriesToAdd.length > 0) {
          setCategories(prev => [...prev, ...categoriesToAdd]);
      }

      // 2. Créer de nouvelles transactions
      const newTransactions: Transaction[] = importedTxs.map(tx => ({
          ...tx,
          id: crypto.randomUUID(),
          accountId: accountId,
      }));

      // 3. Mettre à jour les états
      const updatedTransactions = [...transactions, ...newTransactions];
      setTransactions(updatedTransactions);

      // 4. Recalculer le solde pour le compte affecté
      setAccounts(prevAccounts => prevAccounts.map(account => {
          if (account.id !== accountId) return account;
          const newBalanceHistory = recalculateBalanceHistory(updatedTransactions.filter(t => t.accountId === account.id));
          return { ...account, balanceHistory: newBalanceHistory };
      }));

      // 5. Afficher une notification de succès
      setToasts(prev => [...prev, {
          id: crypto.randomUUID(),
          type: NotificationType.DEADLINE_SOON, // Utilisation d'un type existant pour le style
          message: `${newTransactions.length} transaction(s) importée(s) avec succès !`,
          date: new Date(),
          isRead: false,
          relatedId: 'import-success'
      }]);
  }, [transactions, categories]);

  // --- Handlers pour la modale de transaction récurrente ---
  const handleOpenRecurringTxModal = useCallback((tx: RecurringTransaction | null = null) => {
    setRecurringTxToEdit(tx);
    setIsRecurringTxModalOpen(true);
  }, []);
  
  const handleSaveRecurringTransaction = useCallback((data: Omit<RecurringTransaction, 'id'>) => {
      const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
      const categoriesToCreate = data.splits ? data.splits.map(s => s.category) : [data.category];

      categoriesToCreate.forEach(catName => {
          const finalCategoryName = catName.trim() || UNCATEGORIZED;
          if (finalCategoryName !== UNCATEGORIZED && !categoryMap.has(finalCategoryName)) {
              const newCategory: Category = { id: crypto.randomUUID(), name: finalCategoryName, icon: '🏷️', color: 'bg-gray-500' };
              setCategories(prev => [...prev, newCategory]);
          }
      });
      
      if (recurringTxToEdit) {
          setRecurringTransactions(prev => prev.map(rt => rt.id === recurringTxToEdit.id ? { ...recurringTxToEdit, ...data } : rt));
      } else {
          setCategories(prev => [...prev, { ...categoryData, id: crypto.randomUUID() }]);
      }
      setIsCategoryModalOpen(false);
      setCategoryToEdit(null);
  }, [categoryToEdit]);

  // --- Handlers pour la modale d'objectif ---
  const handleOpenGoalModal = useCallback((goal: Goal | null = null) => {
    setGoalToEdit(goal);
    setIsGoalModalOpen(true);
  }, []);

  const handleSaveGoal = useCallback((data: Omit<Goal, 'id'>) => {
      if (goalToEdit) {
          setGoals(prev => prev.map(g => g.id === goalToEdit.id ? { ...goalToEdit, ...data } : g));
      } else {
          setGoals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
      }
      setIsGoalModalOpen(false);
      setGoalToEdit(null);
  }, [goalToEdit]);
  
  // --- Handlers pour la modale de confirmation ---
  const handleDeleteRequest = useCallback((item: DeletableItem, message?: string) => {
      setItemToDelete({ item, message });
      setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
      if (!itemToDelete) return;
      const { type, data } = itemToDelete.item;

    useEffect(() => {
        const interval = setInterval(() => {
            (async () => {
                try {
                    const stateToSave = {
                        accounts,
                        transactions,
                        recurringTransactions,
                        categories,
                        notificationSettings,
                        goals
                    };
                    await window.api.saveData(stateToSave);
                    if (window.api.saveBackup) {
                        await window.api.saveBackup(stateToSave, 'auto');
                        setToasts(prev => [...prev, {
                            id: crypto.randomUUID(),
                            type: NotificationType.DEADLINE_SOON,
                            message: 'Une sauvegarde automatique a été créée.',
                            date: new Date(),
                            isRead: false,
                            relatedId: 'auto-backup'
                        }]);
                    }
                } catch (err) {
                    setToasts(prev => [...prev, {
                        id: crypto.randomUUID(),
                        type: NotificationType.OVERDUE,
                        message: 'Erreur lors de la sauvegarde automatique.',
                        date: new Date(),
                        isRead: false,
                        relatedId: 'auto-save-error'
                    }]);
                }
            })();
        }, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, [accounts, transactions, recurringTransactions, categories, notificationSettings, goals]);
                  if (rt.splits) {
                      const newSplits = rt.splits.filter(s => s.category !== cat.name);
                      if (newSplits.length === 0) return { ...rt, category: UNCATEGORIZED, splits: undefined };
                      if (newSplits.length < rt.splits.length) return { ...rt, splits: newSplits };
                  }
                  if (rt.category === cat.name) return { ...rt, category: UNCATEGORIZED };
                  return rt;
              }));
              break;
          }
          case 'goal': {
              setGoals(prev => prev.filter(g => g.id !== data.id));
              break;
          }
      }
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }, [itemToDelete, transactions]);




  // Effet pour générer les transactions récurrentes
  useEffect(() => {
    const now = new Date();
    const newTransactionsToCreate: Transaction[] = [];

    recurringTransactions.forEach(rule => {
        const generatedTransactions = transactions.filter(t => t.recurringTransactionId === rule.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastGeneratedDate = generatedTransactions.length > 0 ? new Date(generatedTransactions[0].date) : new Date(rule.startDate);
        let nextDueDate = new Date(lastGeneratedDate);

        if (generatedTransactions.length === 0) { 
             if (nextDueDate > now) return;
        } else {
             if (rule.frequency === Frequency.MONTHLY) nextDueDate.setMonth(nextDueDate.getMonth() + 1);
             else nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }

        while (nextDueDate <= now && (!rule.endDate || nextDueDate <= new Date(rule.endDate))) {
            newTransactionsToCreate.push({
                id: crypto.randomUUID(), recurringTransactionId: rule.id, description: rule.description,
                amount: rule.amount, type: rule.type, category: rule.category, splits: rule.splits,
                date: new Date(nextDueDate), accountId: rule.accountId,
            });
            if (rule.frequency === Frequency.MONTHLY) nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            else nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }
    });

    if (newTransactionsToCreate.length > 0) {
        const updatedTransactions = [...transactions, ...newTransactionsToCreate];
        setTransactions(updatedTransactions);
        const affectedAccountIds = new Set(newTransactionsToCreate.map(t => t.accountId));
        setAccounts(prevAccounts => prevAccounts.map(account => {
            if (affectedAccountIds.has(account.id)) {
                 const transactionsForAccount = updatedTransactions.filter(t => t.accountId === account.id);
                 return { ...account, balanceHistory: recalculateBalanceHistory(transactionsForAccount) };
            }
            return account;
        }));
    }
  }, [recurringTransactions]); // Ne dépend que des règles pour éviter des exécutions inutiles

  // Effet pour générer les notifications de solde bas
  useEffect(() => {
      if (notificationSettings.lowBalance !== NotificationMethod.IN_APP) {
          setNotifications(prev => prev.filter(n => n.type !== NotificationType.LOW_BALANCE));
          return;
      }

      const lowBalanceNotifs: Notification[] = [];
      accounts.forEach(account => {
          if (account.lowBalanceAlertThreshold !== undefined && account.balanceHistory.length > 0) {
              const currentBalance = account.balanceHistory[0].amount;
              if (currentBalance <= account.lowBalanceAlertThreshold) {
                  lowBalanceNotifs.push({
                      id: crypto.randomUUID(),
                      type: NotificationType.LOW_BALANCE,
                      message: `Le solde du compte "${account.name}" est bas : ${currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}.`,
                      date: new Date(),
                      isRead: false,
                      relatedId: account.id,
                  });
              }
          }
      });

      setNotifications(prev => {
          const existingLowBalanceIds = new Set(prev.filter(n => n.type === NotificationType.LOW_BALANCE).map(n => n.relatedId));
          const newNotifs = lowBalanceNotifs.filter(n => !existingLowBalanceIds.has(n.relatedId));
          
          if(newNotifs.length > 0) {
              setToasts(currentToasts => [...currentToasts, ...newNotifs]);
          }

          const stillLowBalanceAccountIds = new Set(lowBalanceNotifs.map(n => n.relatedId));
          const prevWithoutResolved = prev.filter(n => n.type !== NotificationType.LOW_BALANCE || stillLowBalanceAccountIds.has(n.relatedId));

          return [...prevWithoutResolved, ...newNotifs];
      });
  }, [accounts, notificationSettings.lowBalance]);

  // Effet pour générer les notifications d'échéances
  useEffect(() => {
      if (notificationSettings.deadlines !== NotificationMethod.IN_APP) {
          setNotifications(prev => prev.filter(n => n.type !== NotificationType.DEADLINE_SOON && n.type !== NotificationType.OVERDUE));
          return;
      }
      const deadlineNotifs: Notification[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      recurringTransactions.forEach(rule => {
          const nextDueDate = getNextDueDate(rule, transactions);
          if (nextDueDate) {
              const diffTime = nextDueDate.getTime() - today.getTime();
              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              const commonNotifData = {
                  id: crypto.randomUUID(),
                  date: new Date(),
                  isRead: false,
                  relatedId: `${rule.id}-${nextDueDate.toISOString()}`,
              };

              if (daysRemaining < 0) {
                  deadlineNotifs.push({
                      ...commonNotifData,
                      type: NotificationType.OVERDUE,
                      message: `L'échéance "${rule.description}" est en retard depuis le ${nextDueDate.toLocaleDateString('fr-FR')}.`,
                  });
              } else if (rule.reminderDays !== undefined && daysRemaining <= rule.reminderDays) {
                  deadlineNotifs.push({
                      ...commonNotifData,
                      type: NotificationType.DEADLINE_SOON,
                      message: `L'échéance "${rule.description}" arrive à expiration le ${nextDueDate.toLocaleDateString('fr-FR')}.`,
                  });
              }
          }
      });

      setNotifications(prev => {
          const existingDeadlineIds = new Set(prev.filter(n => n.type === NotificationType.DEADLINE_SOON || n.type === NotificationType.OVERDUE).map(n => n.relatedId));
          const newNotifs = deadlineNotifs.filter(n => !existingDeadlineIds.has(n.relatedId));
          
          if(newNotifs.length > 0) {
              setToasts(currentToasts => [...currentToasts, ...newNotifs]);
          }

          const activeDeadlineRelatedIds = new Set(deadlineNotifs.map(n => n.relatedId));
          const prevWithoutResolved = prev.filter(n => 
              (n.type !== NotificationType.DEADLINE_SOON && n.type !== NotificationType.OVERDUE) || activeDeadlineRelatedIds.has(n.relatedId)
          );

          return [...prevWithoutResolved, ...newNotifs];
      });

  }, [recurringTransactions, transactions, notificationSettings.deadlines]);

  // Effet pour générer les notifications de budget
  useEffect(() => {
      if (notificationSettings.budgets !== NotificationMethod.IN_APP) {
          setNotifications(prev => prev.filter(n => n.type !== NotificationType.BUDGET_APPROACHING && n.type !== NotificationType.BUDGET_EXCEEDED));
          return;
      }
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const yearMonth = `${now.getFullYear()}-${now.getMonth()}`;

      const monthlyExpenses = transactions.filter(t => {
          const txDate = new Date(t.date);
          return t.type === TransactionType.EXPENSE && txDate >= startOfMonth && txDate <= endOfMonth;
      });

      const spendingMap = monthlyExpenses.reduce((acc, t) => {
          if (t.splits) {
              t.splits.forEach(split => acc.set(split.category, (acc.get(split.category) || 0) + split.amount));
          } else {
              acc.set(t.category, (acc.get(t.category) || 0) + Math.abs(t.amount));
          }
          return acc;
      }, new Map<string, number>());
      
      const newBudgetNotifs: Notification[] = [];
      const budgetedCategories = categories.filter(c => c.budget && c.budget > 0);

      budgetedCategories.forEach(cat => {
          const spent = spendingMap.get(cat.name) || 0;
          const budget = cat.budget as number;
          const progress = (spent / budget) * 100;

          if (progress > 100) {
              newBudgetNotifs.push({
                  id: crypto.randomUUID(),
                  type: NotificationType.BUDGET_EXCEEDED,
                  message: `Vous avez dépassé votre budget de ${cat.name} de ${(spent - budget).toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}.`,
                  date: new Date(),
                  isRead: false,
                  relatedId: `budget-${cat.id}-${yearMonth}-exceeded`,
              });
          } else if (progress >= 90) {
              newBudgetNotifs.push({
                  id: crypto.randomUUID(),
                  type: NotificationType.BUDGET_APPROACHING,
                  message: `Vous avez dépensé ${Math.floor(progress)}% de votre budget pour ${cat.name}.`,
                  date: new Date(),
                  isRead: false,
                  relatedId: `budget-${cat.id}-${yearMonth}-approaching`,
              });
          }
      });
      
      setNotifications(prev => {
          const otherNotifs = prev.filter(n => n.type !== NotificationType.BUDGET_APPROACHING && n.type !== NotificationType.BUDGET_EXCEEDED);
          const existingPrevBudgetIds = new Set(otherNotifs.map(n => n.relatedId));
          const newBudgetNotifIds = new Set(newBudgetNotifs.map(n => n.relatedId));

          const trulyNewNotifs = newBudgetNotifs.filter(n => !existingPrevBudgetIds.has(n.relatedId));
          
          if (trulyNewNotifs.length > 0) {
            setToasts(currentToasts => [...currentToasts, ...trulyNewNotifs]);
          }

          const notifsToAdd = newBudgetNotifs.filter(n => {
              if(n.type === NotificationType.BUDGET_APPROACHING) {
                  const exceededId = n.relatedId.replace('approaching', 'exceeded');
                  if (newBudgetNotifIds.has(exceededId)) return false;
              }
              return true;
          });
          
          return [...otherNotifs, ...notifsToAdd];
      });

  }, [transactions, categories, notificationSettings.budgets]);


  return (
    <div className="relative flex h-screen bg-slate-50 text-gray-800 font-sans">
      {isSidebarOpen && (
          <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
          />
      )}
            <Sidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                accounts={accounts} 
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                wink={wink}
            />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
                    notifications={notifications} 
                    setNotifications={setNotifications}
                    setIsSidebarOpen={setIsSidebarOpen}
                    greeting={getGreeting()}
                />
                <UpdateNotification />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeView === 'dashboard' && <Dashboard 
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              recurringTransactions={recurringTransactions}
              notifications={notifications} 
              setNotifications={setNotifications} 
          />}
          {activeView === 'accounts' && (
            <Accounts
              accounts={accounts}
              setAccounts={setAccounts}
              transactions={transactions}
              setTransactions={setTransactions}
              handleDeleteRequest={handleDeleteRequest}
            />
          )}
          {activeView === 'transactions' && (
            <Transactions
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              setActiveView={setActiveView}
              handleOpenTxModal={handleOpenTxModal}
              handleDeleteRequest={handleDeleteRequest}
              handleImportTransactions={handleImportTransactions}
            />
          )}
           {activeView === 'categories' && (
            <Categories
              categories={categories}
              transactions={transactions}
              handleOpenCategoryModal={handleOpenCategoryModal}
              handleDeleteRequest={handleDeleteRequest}
            />
          )}
          {activeView === 'deadlines' && (
            <Deadlines
                recurringTransactions={recurringTransactions}
                transactions={transactions}
                accounts={accounts}
                handleOpenRecurringTxModal={handleOpenRecurringTxModal}
                handleDeleteRequest={handleDeleteRequest}
            />
          )}
          {activeView === 'goals' && (
            <Goals 
                goals={goals}
                accounts={accounts}
                handleOpenGoalModal={handleOpenGoalModal}
                handleDeleteRequest={handleDeleteRequest}
            />
          )}
          {activeView === 'budgets' && (
            <Budgets 
              transactions={transactions}
              categories={categories}
              setCategories={setCategories}
              setActiveView={setActiveView}
            />
          )}
          {activeView === 'reports' && (
            <Reports 
              transactions={transactions}
              categories={categories}
              accounts={accounts}
            />
          )}
          {activeView === 'chat' && (
            <ChatIA 
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              handleOpenTxModal={handleOpenTxModal}
            />
          )}
          {activeView === 'settings' && (
              <Settings settings={notificationSettings} setSettings={setNotificationSettings} />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onClose={handleCloseToast} />

      <AddTransactionModal 
          isOpen={isTxModalOpen} 
          onClose={handleCloseTxModal} 
          onSave={handleSaveTransaction}
          accounts={accounts}
          transactionToEdit={transactionToEdit}
          prefilledData={prefilledTxData}
          categories={categories}
      />
      <AddRecurringTransactionModal 
          isOpen={isRecurringTxModalOpen}
          onClose={() => setIsRecurringTxModalOpen(false)}
          onSave={handleSaveRecurringTransaction}
          accounts={accounts}
          recurringTransactionToEdit={recurringTxToEdit}
          categories={categories}
      />
      <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleSaveCategory}
          categoryToEdit={categoryToEdit}
          existingCategories={categories}
      />
      <AddGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        goalToEdit={goalToEdit}
        accounts={accounts}
      />
      <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmer la suppression"
          message={itemToDelete?.message || "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."}
      />
    </div>
  );
};

export default App;