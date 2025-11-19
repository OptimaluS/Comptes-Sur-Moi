import React from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface WeeklySpendingStackedBarChartProps {
  transactions: Transaction[];
  categories: Category[];
}

function getLast30DaysWeeks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const end = new Date(today);
    end.setDate(today.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    weeks.unshift({ start, end });
  }
  return weeks;
}

function getWeeklySpending(transactions: Transaction[], categories: Category[]) {
  const weeks = getLast30DaysWeeks();
  // Filtrer strictement les transactions de type DEPENSE (exclure revenus et virements)
  const expenseCategories = categories.filter(c => c.name !== 'Salaire' && c.name !== 'Solde Initial' && c.name !== 'Virement').map(c => c.name);
  const data = weeks.map(({ start, end }) => {
    const weekTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      // Exclure tout sauf DEPENSE
      return tx.type === TransactionType.EXPENSE && txDate >= start && txDate <= end;
    });
    const byCategory: Record<string, number> = {};
    expenseCategories.forEach(cat => { byCategory[cat] = 0; });
    weekTxs.forEach(tx => {
      if (tx.splits) {
        tx.splits.forEach(s => {
          if (expenseCategories.includes(s.category)) {
            byCategory[s.category] = (byCategory[s.category] || 0) + s.amount;
          }
        });
      } else {
        if (expenseCategories.includes(tx.category)) {
          byCategory[tx.category] = (byCategory[tx.category] || 0) + Math.abs(tx.amount);
        }
      }
    });
    // Vérification de l'empilement : toutes les catégories présentes sont bien ajoutées
    return byCategory;
  });
  return { weeks, data, expenseCategories };
}

const palette = [
  '#2563eb', '#ef4444', '#10b981', '#f59e42', '#a21caf', '#f472b6', '#14b8a6', '#fbbf24', '#3b82f6', '#a78bfa', '#34d399', '#eab308', '#f87171', '#6ee7b7', '#818cf8', '#f43f5e', '#22d3ee', '#c026d3', '#fde68a', '#4ade80', '#fca5a5', '#a3e635'
];

const WeeklySpendingStackedBarChart: React.FC<WeeklySpendingStackedBarChartProps> = ({ transactions, categories }) => {
  const { weeks, data, expenseCategories } = getWeeklySpending(transactions, categories);

  // Attribution dynamique des couleurs vives
  const colorMap: Record<string, string> = {};
  expenseCategories.forEach((cat, i) => {
    colorMap[cat] = palette[i % palette.length];
  });

  const datasets = expenseCategories.map((cat) => ({
    label: cat,
    data: data.map(week => week[cat]),
    backgroundColor: colorMap[cat],
    stack: 'spending',
    borderWidth: 1,
  }));

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`;
          }
        }
      }
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Semaine' },
        ticks: {
          callback: function(_: any, idx: number) {
            const { start, end } = weeks[idx];
            return `Semaine ${idx + 1}\n${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`;
          }
        }
      },
      y: {
        stacked: true,
        title: { display: true, text: 'Montant (€)' },
      }
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <h3 className="font-bold text-gray-800 mb-4">Dépenses Hebdomadaires</h3>
      <Bar data={{ labels: weeks.map((_, i) => `Semaine ${i + 1}`), datasets }} options={options} />
      <div className="flex flex-wrap gap-4 justify-center mt-6">
        {expenseCategories.map(cat => (
          <div key={cat} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: colorMap[cat] }}></span>
            <span className="font-medium text-gray-700">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySpendingStackedBarChart;
