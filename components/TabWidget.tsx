import React, { useState } from 'react';

interface TabWidgetProps {
  budgets: React.ReactNode;
  deadlines: React.ReactNode;
}

const TabWidget: React.FC<TabWidgetProps> = ({ budgets, deadlines }) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'deadlines'>('budgets');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'budgets' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50' : 'text-gray-500 hover:text-indigo-600'}`}
          onClick={() => setActiveTab('budgets')}
        >
          Budgets
        </button>
        <button
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'deadlines' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50' : 'text-gray-500 hover:text-indigo-600'}`}
          onClick={() => setActiveTab('deadlines')}
        >
          Échéances
        </button>
      </div>
      <div className="p-4">
        {activeTab === 'budgets' ? budgets : deadlines}
      </div>
    </div>
  );
};

export default TabWidget;
