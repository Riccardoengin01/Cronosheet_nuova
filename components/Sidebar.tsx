import React from 'react';
import { AppView, UserProfile } from '../types';
import { Table2, PieChart, ShieldCheck, Users, Receipt, Shield, Github, Crown, Star, Clock, LogOut, ChevronRight, Settings, Database } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  userProfile: UserProfile | null;
  onOpenSetup?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userProfile, onOpenSetup }) => {
  const menuItems = [
    { id: AppView.TIMESHEET, label: 'Registro', icon: Table2 },
    { id: AppView.CLIENTS, label: 'Clienti', icon: Users },
    { id: AppView.BILLING, label: 'Riepilogo', icon: Receipt },
    { id: AppView.REPORTS, label: 'Statistiche', icon: PieChart },
  ];

  if (userProfile?.role === 'admin') {
      menuItems.push({ id: AppView.ADMIN_PANEL, label: 'Admin Panel', icon: Shield });
  }

  // Helper per calcolare giorni rimanenti
  const getDaysLeft = () => {
      if (!userProfile) return 0;
      const end = new Date(userProfile.trial_ends_at).getTime();
      const now = Date.now();
      return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft();

  const renderUserStatus = () => {
      if (!userProfile) return null;

      if (userProfile.subscription_status === 'elite') {
          return (
              <div className="flex items-center gap-2 text-amber-400 mt-1">
                  <Crown size={14} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-wider">Elite Member</span>
              </div>
          );
      }
      
      if (userProfile.subscription_status === 'pro') {
          return (
              <div className="mt-1">
                  <div className="flex items-center gap-2 text-indigo-400">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold uppercase tracking-wider">Pro Plan</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                      Rinnovo tra {daysLeft} gg
                  </div>
              </div>
          );
      }

      // Default Trial
      const isExpired = daysLeft < 0;
      return (
          <div className="mt-1">
             <div className={`flex items-center gap-2 ${isExpired ? 'text-red-400' : 'text-blue-400'}`}>
                  <Clock size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Trial</span>
              </div>
              <div className={`text-[10px] mt-0.5 ${isExpired ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                  {isExpired ? 'Scaduto' : `${daysLeft} giorni rimanenti`}
              </div>
          </div>
      );
  };

  return (
    <aside className="w-20 lg:w-72 bg-slate-900 text-white flex flex-col h-full transition-all duration-300 shadow-xl z-20 print:hidden relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      {/* Header */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-indigo-500/10 p-2 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="hidden lg:block ml-3">
            <span className="font-bold text-xl tracking-tight block leading-none">Cronosheet</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">SaaS Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto custom-scrollbar">
        <p className="hidden lg:block px-4 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Menu</p>
        {menuItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center justify-center lg:justify-start lg:px-4 py-3.5 rounded-xl transition-all group relative ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'}`} />
              <span className="hidden lg:block ml-3 font-medium text-sm">{item.label}</span>
              
              {isActive && (
                 <ChevronRight className="hidden lg:block ml-auto w-4 h-4 opacity-50" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info Card (Bottom) */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 space-y-3">
        
        {/* User Card */}
        <div className="bg-slate-800/40 rounded-xl p-4 hidden lg:block border border-slate-700/30 hover:border-slate-600 transition-colors group cursor-default">
            {/* User Profile Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${userProfile?.role === 'admin' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {userProfile?.email.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate" title={userProfile?.email}>
                        {userProfile?.email.split('@')[0]}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${userProfile?.role === 'admin' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                        <p className="text-xs text-slate-400 capitalize">{userProfile?.role || 'User'}</p>
                    </div>
                </div>
            </div>
            {/* Plan Info Details */}
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                {renderUserStatus()}
            </div>
        </div>

        {/* Mobile Icon Only View */}
        <div className="lg:hidden flex flex-col items-center gap-4">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${userProfile?.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {userProfile?.email.charAt(0).toUpperCase()}
             </div>
        </div>
        
        {/* Footer Links / Setup */}
        <div className="flex justify-between items-center px-1">
             {onOpenSetup && (
                <button 
                    onClick={onOpenSetup} 
                    className="text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                    title="Configurazione Database"
                >
                    <Database size={16} />
                    <span className="hidden lg:inline text-[10px] font-bold">SETUP DB</span>
                </button>
             )}
            <a 
                href="https://github.com/Riccardoengin01/Cronosheet" 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-600 hover:text-white transition-colors"
                title="GitHub Repo"
            >
                <Github size={16} />
            </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;