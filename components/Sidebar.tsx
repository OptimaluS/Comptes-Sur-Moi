import React from 'react';
import type { View } from '../App';
import type { Account } from '../types';

const AppLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
            <radialGradient id="appLogoGoldGradient" cx="50%" cy="40%" r="60%" fx="50%" fy="30%">
                <stop offset="0%" stopColor="#FDE047" /> {/* Tailwind yellow-300 */}
                <stop offset="60%" stopColor="#F59E0B" /> {/* Tailwind amber-500 */}
                <stop offset="100%" stopColor="#B45309" /> {/* Tailwind amber-700 */}
            </radialGradient>
        </defs>
        {/* Coin Body */}
        <circle cx="12" cy="12" r="11" fill="url(#appLogoGoldGradient)" />
        <circle cx="12" cy="12" r="11" fill="transparent" stroke="#92400E" strokeWidth="1.2" />
        {/* Inner Rim */}
        <circle cx="12" cy="12" r="9.5" fill="transparent" stroke="#FBBF24" strokeOpacity="0.6" strokeWidth="1" />

        {/* Simple Wink Face */}
        <g stroke="#92400E" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Left Eye */}
            <circle cx="8.5" cy="10.5" r="0.5" fill="#92400E" stroke="none" />
            {/* Right Eye (Wink) */}
            <path d="M13.5 11.5 C 14.5 10, 15.5 10, 16.5 11.5" />
            {/* Smile */}
            <path d="M8 14 Q 12 16, 16 14" />
        </g>
    </svg>
);

const menuIcons = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#818cf8" fill="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /><path stroke="#4f46e5" fill="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" /></svg>,
    accounts: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#34d399" fill="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" /><path stroke="#059669" fill="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M16.5 13.5h.008v.008h-.008v-.008z" /></svg>,
    transactions: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#38bdf8" fill="#bae6fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5" /><path stroke="#0ea5e9" fill="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 16.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>,
    categories: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#a78bfa" fill="#ddd6fe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke="#7c3aed" fill="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>,
    deadlines: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#fb923c" fill="#fed7aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" /><path stroke="#f97316" fill="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 12.75h.008v.008H12v-.008z" /></svg>,
    goals: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#fbbf24" fill="#fde68a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.25a14.98 14.98 0 00-5.84 7.38" /><path stroke="#f59e0b" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M5.84 14.37a14.98 14.98 0 017.38 5.84m-13.22 0a14.98 14.98 0 015.84-7.38m5.84 2.58l-2.12-2.12" /></svg>,
    budgets: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#2dd4bf" fill="#99f6e4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" /><path stroke="#0d9488" fill="#5eead4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    reports: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#22d3ee" fill="#a5f3fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v12c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" /><path stroke="#06b6d4" fill="#67e8f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 21v-7.875zM21 4.125c0-.621-.504-1.125-1.125-1.125h-2.25a1.125 1.125 0 00-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125.504 1.125-1.125V4.125z" /></svg>,
    chat: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#f472b6" fill="#fbcfe8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.741c0-1.602 1.123-2.995 2.707-3.228A48.394 48.394 0 0012 3c2.392 0 4.744.175 7.043.513C20.878 3.746 22 5.14 22 6.741v6.018c0 1.602-1.123 2.995-2.707 3.228A48.294 48.294 0 0012 16.5c-2.392 0-4.744-.175-7.043-.513C3.373 15.746 2.25 14.35 2.25 12.75V6.741z" /><path stroke="#ec4899" fill="#f9a8d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M12 16.5h.008v.008H12v-.008z" /></svg>,
    settings: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path stroke="#64748b" fill="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke="#475569" fill="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, disabled = false, tooltip }) => {
  const isDisabled = disabled || !onClick;
  
  const activeClasses = isActive && !isDisabled
    ? 'bg-indigo-100 text-indigo-600 font-bold' 
    : 'text-gray-600 hover:bg-indigo-50/70 hover:text-indigo-600';
    
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    
  return (
    <li className="relative group">
      <button
        type="button"
        onClick={isDisabled ? undefined : onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-left ${activeClasses} ${disabledClasses}`}
        disabled={isDisabled}
        aria-disabled={isDisabled}
      >
        {isActive && !isDisabled && <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />}
        {icon}
        <span className="font-medium">{label}</span>
      </button>
      {isDisabled && tooltip && (
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-20">
            {tooltip}
        </span>
      )}
    </li>
  );
};

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    accounts: Account[];
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, accounts, isSidebarOpen, setIsSidebarOpen }) => {
  const hasAccounts = accounts.length > 0;

  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsSidebarOpen(false); // Ferme le menu sur mobile après la navigation
  };

  return (
    <aside className={`w-64 bg-white p-4 flex flex-col shrink-0 border-r border-gray-200 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between gap-3 px-2 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <AppLogo />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Comptes Sur Moi
          </h1>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Fermer le menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      <nav className="mt-6">
        <ul className="space-y-1.5">
          <NavItem icon={menuIcons.dashboard} label="Tableau de bord" isActive={activeView === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon={menuIcons.accounts} label="Comptes" isActive={activeView === 'accounts'} onClick={() => handleNavClick('accounts')} />
          <NavItem 
            icon={menuIcons.chat} 
            label="Assistant IA" 
            isActive={activeView === 'chat'} 
            onClick={() => handleNavClick('chat')}
          />
          <NavItem 
            icon={menuIcons.transactions} 
            label="Transactions" 
            isActive={activeView === 'transactions'} 
            onClick={() => handleNavClick('transactions')}
            disabled={!hasAccounts}
            tooltip={!hasAccounts ? "Veuillez d'abord créer un compte" : undefined}
          />
           <NavItem 
            icon={menuIcons.categories} 
            label="Catégories" 
            isActive={activeView === 'categories'} 
            onClick={() => handleNavClick('categories')}
            disabled={!hasAccounts}
            tooltip={!hasAccounts ? "Veuillez d'abord créer un compte" : undefined}
          />
          <NavItem 
            icon={menuIcons.deadlines} 
            label="Échéances" 
            isActive={activeView === 'deadlines'} 
            onClick={() => handleNavClick('deadlines')}
            disabled={!hasAccounts}
            tooltip={!hasAccounts ? "Veuillez d'abord créer un compte" : undefined}
          />
          <NavItem 
            icon={menuIcons.budgets} 
            label="Budgets" 
            isActive={activeView === 'budgets'} 
            onClick={() => handleNavClick('budgets')}
            disabled={!hasAccounts}
            tooltip={!hasAccounts ? "Veuillez d'abord créer un compte" : undefined}
          />
          <NavItem 
            icon={menuIcons.goals} 
            label="Objectifs" 
            isActive={activeView === 'goals'} 
            onClick={() => handleNavClick('goals')}
            disabled={!hasAccounts}
            tooltip={!hasAccounts ? "Veuillez d'abord créer un compte" : undefined}
          />
          <NavItem 
            icon={menuIcons.reports} 
            label="Rapports" 
            isActive={activeView === 'reports'} 
            onClick={() => handleNavClick('reports')}
            disabled={!hasAccounts}
            tooltip={!hasAccounts ? "Veuillez d'abord créer un compte" : undefined}
          />
        </ul>
      </nav>

      <div className="mt-auto">
        <ul className="space-y-1.5">
            <NavItem icon={menuIcons.settings} label="Paramètres" isActive={activeView === 'settings'} onClick={() => handleNavClick('settings')} />
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
            <p>Vos données sont sauvegardées localement sur votre appareil.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;