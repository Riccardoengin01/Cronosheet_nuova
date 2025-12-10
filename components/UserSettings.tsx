import React from 'react';
import { UserProfile } from '../types';
import { User, Mail, Shield, Calendar, CreditCard, CheckCircle, Crown, Star, Clock, Zap } from 'lucide-react';

interface UserSettingsProps {
    user: UserProfile;
}

const UserSettings: React.FC<UserSettingsProps> = ({ user }) => {

    // Fix data 1970
    const getTrialEndDate = () => {
        const d = new Date(user.trial_ends_at);
        if (d.getTime() < 100000000000) {
            // Se data invalida (1970), assumi 60 giorni da oggi per visualizzazione
            const fixDate = new Date();
            fixDate.setDate(fixDate.getDate() + 60);
            return fixDate;
        }
        return d;
    };

    const trialEnd = getTrialEndDate();
    const now = new Date();
    const totalTrialDays = 60;
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const progress = Math.max(0, Math.min(100, ((totalTrialDays - daysLeft) / totalTrialDays) * 100));

    const plans = [
        {
            id: 'trial',
            name: 'Start',
            price: 'Gratis',
            features: ['Registro Orari', 'Export PDF', 'Supporto Base'],
            current: user.subscription_status === 'trial',
            color: 'bg-blue-500'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '€9.99/mese',
            features: ['Tutto Start', 'Statistiche Avanzate', 'AI Assistant', 'Priorità Supporto'],
            current: user.subscription_status === 'pro',
            color: 'bg-indigo-600'
        },
        {
            id: 'elite',
            name: 'Elite',
            price: '€29.99/mese',
            features: ['Tutto Pro', 'Multi-Team', 'API Access', 'Account Manager Dedicato'],
            current: user.subscription_status === 'elite',
            color: 'bg-amber-500'
        }
    ];

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Il mio Profilo</h1>
                <p className="text-gray-500 mt-1">Gestisci le tue informazioni e il piano di abbonamento.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Colonna Sinistra: Info Utente */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg ${user.role === 'admin' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-700'}`}>
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{user.email.split('@')[0]}</h2>
                        <span className="text-sm text-gray-500 mb-4">{user.email}</span>
                        
                        <div className="flex gap-2">
                             <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase border border-slate-200 flex items-center gap-1">
                                 <User size={12} /> {user.role}
                             </span>
                             {user.is_approved && (
                                 <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase border border-emerald-100 flex items-center gap-1">
                                     <CheckCircle size={12} /> Verificato
                                 </span>
                             )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-indigo-500"/> Dettagli Sicurezza
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">User ID</span>
                                <span className="font-mono text-gray-700 text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[120px]" title={user.id}>{user.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Registrato il</span>
                                <span className="text-gray-700 font-medium">11 Dic 2024</span>
                            </div>
                            <div className="pt-2">
                                <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1">
                                    <Mail size={12} /> Cambia Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colonna Destra: Stato Abbonamento */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Status Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            {user.subscription_status === 'elite' ? <Crown size={120} /> : <Zap size={120} />}
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Piano Attivo</p>
                                    <h2 className="text-3xl font-bold text-gray-800 capitalize flex items-center gap-3">
                                        {user.subscription_status} Plan
                                        {user.subscription_status === 'elite' && <Crown className="text-amber-500 fill-amber-500" size={24} />}
                                        {user.subscription_status === 'pro' && <Star className="text-indigo-500 fill-indigo-500" size={24} />}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Stato</p>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        Attivo
                                    </span>
                                </div>
                            </div>

                            {/* Trial Progress */}
                            {user.subscription_status === 'trial' && (
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                            <Clock size={16} /> Periodo di Prova
                                        </span>
                                        <span className="text-sm font-bold text-slate-800">{daysLeft} giorni rimanenti</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-indigo-600 h-3 rounded-full transition-all duration-1000" 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 text-right">Scadenza: {trialEnd.toLocaleDateString()}</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-200">
                                    Gestisci Pagamenti
                                </button>
                                <button className="bg-white text-gray-600 border border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50">
                                    Scarica Fatture
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Piani Disponibili</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map(plan => (
                                <div key={plan.id} className={`rounded-xl p-6 border-2 transition-all cursor-pointer hover:shadow-lg ${plan.current ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-100 bg-white hover:border-indigo-200'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{plan.name}</h4>
                                            <p className="text-gray-500 text-sm font-medium">{plan.price}</p>
                                        </div>
                                        {plan.current && <CheckCircle className="text-indigo-600" size={20} />}
                                    </div>
                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((feat, i) => (
                                            <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <button 
                                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${
                                            plan.current 
                                            ? 'bg-indigo-100 text-indigo-700 cursor-default' 
                                            : 'bg-slate-800 text-white hover:bg-slate-900'
                                        }`}
                                    >
                                        {plan.current ? 'Piano Attuale' : 'Passa a ' + plan.name}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserSettings;