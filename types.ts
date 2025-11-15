export enum TransactionType {
  INCOME = 'REVENU',
  EXPENSE = 'DEPENSE',
}

export const UNCATEGORIZED = 'Non catégorisé';
export const SPLIT_TRANSACTION = 'Transaction Partagée';

export interface Split {
    category: string;
    amount: number; // Toujours positif. Le type de la transaction globale (dépense/revenu) s'applique.
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string; // Sera SPLIT_TRANSACTION si splits est utilisé
  splits?: Split[];
  date: Date;
  accountId: string;
  recurringTransactionId?: string;
  transferId?: string;
}

export enum AccountType {
  CHECKING = 'Courant',
  SAVINGS = 'Épargne',
  TERM = 'À terme',
  JOINT = 'Joint',
  INDIVIDUAL = 'Individuel',
}

export interface BalanceEntry {
  date: Date;
  amount: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balanceHistory: BalanceEntry[];
  lowBalanceAlertThreshold?: number;
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    linkedAccountId: string; // ID of the savings account
}

export enum Frequency {
    MONTHLY = 'Mensuelle',
    YEARLY = 'Annuelle',
}

export interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string; // Sera SPLIT_TRANSACTION si splits est utilisé
    splits?: Split[];
    accountId: string;
    frequency: Frequency;
    startDate: Date;
    endDate?: Date;
    reminderDays?: number;
}

export enum NotificationMethod {
    OFF = 'off',
    IN_APP = 'in-app',
}

export interface NotificationSettings {
    lowBalance: NotificationMethod;
    deadlines: NotificationMethod;
    budgets: NotificationMethod;
}

export interface Category {
    id: string;
    name: string;
    icon: string; // Emoji
    color: string; // Tailwind bg color class
    budget?: number;
}

// --- Nouveaux types pour les notifications ---
export enum NotificationType {
    LOW_BALANCE = 'low-balance',
    DEADLINE_SOON = 'deadline-soon',
    OVERDUE = 'overdue',
    BUDGET_APPROACHING = 'budget-approaching',
    BUDGET_EXCEEDED = 'budget-exceeded',
}

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    date: Date;
    isRead: boolean;
    relatedId: string; // ID du compte ou de la transaction récurrente + date pour l'unicité
}

// Type pour la suppression sécurisée
export type DeletableItem = 
  | { type: 'account'; data: Account; }
  | { type: 'transaction'; data: Transaction; }
  | { type: 'recurringTransaction'; data: RecurringTransaction; }
  | { type: 'category'; data: Category; }
  | { type: 'goal'; data: Goal; };