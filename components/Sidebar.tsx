import React from 'react';
import { AppView, UserProfile } from '../types';
import { Table2, PieChart, ShieldCheck, Users, Receipt, Shield } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  userRole?: 'admin' | 'user';
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole }) => {
  const menuItems = [
    { id: AppView.TIMESHEET, label: 'Registro', icon: Table2 },
    { id: AppView.CLIENTS, label: 'Clienti', icon: Users },
    { id: AppView.BILLING, label: 'Riepilogo', icon: Receipt },
    { id: AppView.REPORTS, label: 'Statistiche', icon: PieChart },
  ];

  if (userRole === 'admin') {
      menuItems.push({ id: AppView.ADMIN_PANEL, label: 'Admin', icon: Shield });
  }

  return (
    <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col h-full transition-all duration-300 shadow-xl z-20 print:hidden">
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
        <ShieldCheck className="w-8 h-8 text-indigo-400" />
        <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight">Cronosheet</span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-2">
        {menuItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center justify-center lg:justify-start lg:px-4 py-4 rounded-xl transition-all group relative ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="hidden lg:block ml-3 font-medium text-base">{item.label}</span>
              
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full lg:hidden"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3 hidden lg:block">
            <p className="text-xs text-slate-500 mb-1">{userRole === 'admin' ? 'Amministratore' : 'Utente'}</p>
            <p className="text-sm font-medium truncate opacity-70">Cronosheet v2.1</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;