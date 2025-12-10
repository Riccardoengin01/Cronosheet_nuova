import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import * as DB from '../services/db';
import { Check, Shield, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

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

    const handleTogglePro = async (user: UserProfile) => {
        const newStatus = user.subscription_status === 'pro' ? 'active' : 'pro';
        try {
            await DB.updateUserProfileAdmin({ id: user.id, subscription_status: newStatus });
            loadUsers();
        } catch (e) {
            alert("Errore modifica piano");
        }
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm('Sei sicuro? Questo rimuoverà il profilo.')) {
            try {
                await DB.deleteUserAdmin(userId);
                loadUsers();
            } catch (e) {
                alert("Errore eliminazione utente");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-emerald-400" /> Pannello Amministrazione
                    </h2>
                    <p className="text-slate-400">Gestisci gli accessi e i piani degli utenti.</p>
                </div>
                <button onClick={loadUsers} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">Utente</th>
                            <th className="px-6 py-4">Stato Approvazione</th>
                            <th className="px-6 py-4">Piano</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 && !loading && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nessun utente trovato</td></tr>
                        )}
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{u.email || 'Nessuna Email'}</div>
                                    <div className="text-xs text-gray-400 font-mono">ID: {u.id.slice(0, 8)}...</div>
                                </td>
                                <td className="px-6 py-4">
                                    {u.is_approved ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                            <Check size={12} /> Approvato
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                                            <AlertTriangle size={12} /> In attesa
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`uppercase font-mono text-xs font-bold ${u.subscription_status === 'pro' ? 'text-indigo-600' : 'text-gray-500'}`}>
                                        {u.subscription_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {!u.is_approved && (
                                        <button 
                                            onClick={() => handleApprove(u)}
                                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700"
                                        >
                                            Approva
                                        </button>
                                    )}
                                    
                                    {u.role !== 'admin' && (
                                        <>
                                            <button 
                                                onClick={() => handleTogglePro(u)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${u.subscription_status === 'pro' ? 'border-gray-300 text-gray-600' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}
                                            >
                                                {u.subscription_status === 'pro' ? 'Rimuovi Pro' : 'Rendi Pro'}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(u.id)}
                                                className="text-red-400 hover:text-red-600 p-2"
                                                title="Elimina Utente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
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