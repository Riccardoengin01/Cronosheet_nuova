import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import * as DB from '../services/db';
import { Check, Shield, Trash2, AlertTriangle, RefreshCw, Crown, Star, Clock, UserCog, User } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const list = await DB.getAllProfiles();
        setUsers(list);
        setLoading(false);
    };

    const handleApprove = async (user: UserProfile) => {
        try {
            await DB.updateUserProfileAdmin({ id: user.id, is_approved: true });
            loadUsers();
        } catch (e) {
            alert("Errore durante l'approvazione");
        }
    };

    const handleChangePlan = async (user: UserProfile, newStatus: 'trial' | 'pro' | 'elite') => {
        try {
            await DB.updateUserProfileAdmin({ id: user.id, subscription_status: newStatus });
            loadUsers();
        } catch (e) {
            alert("Errore modifica piano");
        }
    };

    const handleToggleRole = async (user: UserProfile) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        if (newRole === 'user' && !window.confirm("Sei sicuro di voler rimuovere i permessi di Admin a questo utente?")) {
            return;
        }
        try {
            await DB.updateUserProfileAdmin({ id: user.id, role: newRole });
            loadUsers();
        } catch (e) {
            alert("Errore modifica ruolo");
        }
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm('Sei sicuro? Questo rimuoverà il profilo e tutti i dati associati.')) {
            try {
                await DB.deleteUserAdmin(userId);
                loadUsers();
            } catch (e) {
                alert("Errore eliminazione utente");
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'elite':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200"><Crown size={12} /> ELITE</span>;
            case 'pro':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200"><Star size={12} /> PRO</span>;
            case 'trial':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100"><Clock size={12} /> TRIAL</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold uppercase">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-emerald-400" /> Pannello Amministrazione
                    </h2>
                    <p className="text-slate-400">Gestisci gli accessi e i livelli degli utenti.</p>
                </div>
                <button onClick={loadUsers} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4 border-b border-gray-100">Utente</th>
                            <th className="px-6 py-4 border-b border-gray-100">Ruolo</th>
                            <th className="px-6 py-4 border-b border-gray-100">Piano</th>
                            <th className="px-6 py-4 text-right border-b border-gray-100">Gestione</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 && !loading && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nessun utente trovato</td></tr>
                        )}
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                {/* Colonna Utente */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                                            {u.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{u.email || 'Nessuna Email'}</div>
                                            <div className="text-xs text-gray-400 font-mono">
                                                ID: {u.id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Colonna Ruolo */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {u.role === 'admin' ? (
                                            <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs font-bold border border-purple-100">
                                                <Shield size={12} /> ADMIN
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-bold">
                                                <User size={12} /> USER
                                            </span>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleToggleRole(u)}
                                            className="ml-2 text-gray-300 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded transition-colors"
                                            title={u.role === 'admin' ? "Rimuovi Admin" : "Promuovi ad Admin"}
                                        >
                                            <UserCog size={16} />
                                        </button>
                                    </div>
                                </td>

                                {/* Colonna Piano */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2 items-start">
                                        {getStatusBadge(u.subscription_status)}
                                        <div className="flex bg-gray-100 rounded-lg p-0.5 mt-1">
                                            <button 
                                                onClick={() => handleChangePlan(u, 'trial')}
                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${u.subscription_status === 'trial' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Trial
                                            </button>
                                            <button 
                                                onClick={() => handleChangePlan(u, 'pro')}
                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${u.subscription_status === 'pro' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Pro
                                            </button>
                                            <button 
                                                onClick={() => handleChangePlan(u, 'elite')}
                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${u.subscription_status === 'elite' ? 'bg-white shadow text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Elite
                                            </button>
                                        </div>
                                    </div>
                                </td>

                                {/* Colonna Azioni */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {!u.is_approved ? (
                                            <button 
                                                onClick={() => handleApprove(u)}
                                                className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-sm flex items-center gap-1"
                                            >
                                                <Check size={14} /> APPROVA
                                            </button>
                                        ) : (
                                            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 justify-end opacity-50 cursor-default">
                                                <Check size={14} /> Attivo
                                            </span>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleDelete(u.id)}
                                            className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Elimina Utente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;