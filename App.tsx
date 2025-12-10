import React, { useState, useEffect } from 'react';
import { AppView, TimeEntry, Project, UserProfile } from './types';
import Sidebar from './components/Sidebar';
import TimeLogTable from './components/TimeLogTable';
import Reports from './components/Reports';
import EntryModal from './components/EntryModal';
import ManageClients from './components/ManageClients';
import Billing from './components/Billing';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import * as DB from './services/db';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Plus, Lock, LogOut, Loader2, Database, Github, AlertTriangle } from 'lucide-react';

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [view, setView] = useState<AppView>(AppView.TIMESHEET);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>(undefined);

  // 0. Environment Check
  if (!isSupabaseConfigured) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
              <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                      <Database className="w-10 h-10 text-amber-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800">Database non collegato</h1>
                  <p className="text-slate-600 text-lg">
                      L'applicazione è pronta, ma non è collegata a Supabase.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Github className="w-5 h-5" /> Come procedere:
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-slate-600">
                          <li>Carica questo codice sul tuo repository <strong>GitHub</strong>.</li>
                          <li>Crea un progetto su <strong>Supabase</strong> (Database).</li>
                          <li>Collega il repository GitHub a <strong>Vercel</strong>.</li>
                          <li>
                              In Vercel, vai su <em>Settings &gt; Environment Variables</em> e aggiungi:
                              <ul className="list-disc list-inside ml-6 mt-1 font-mono text-sm text-indigo-600 bg-indigo-50 p-2 rounded">
                                  <li>VITE_SUPABASE_URL</li>
                                  <li>VITE_SUPABASE_KEY</li>
                              </ul>
                          </li>
                      </ol>
                  </div>
                  
                  <div className="flex justify-center gap-4 pt-4">
                      <a 
                        href="https://supabase.com/dashboard" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                      >
                          Vai su Supabase
                      </a>
                      <a 
                        href="https://vercel.com/dashboard" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors"
                      >
                          Vai su Vercel
                      </a>
                  </div>
              </div>
          </div>
      );
  }

  // 1. Auth Check (Real Supabase Auth)
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            fetchUserProfile(session.user);
        } else {
            setLoadingAuth(false);
        }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            fetchUserProfile(session.user);
        } else {
            setProfile(null);
            setLoadingAuth(false);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (user: { id: string, email?: string }) => {
      let p = await DB.getUserProfile(user.id);
      
      // Se il profilo non esiste (es. mancava il trigger SQL), proviamo a crearlo al volo
      if (!p && user.email) {
          console.log("Profilo mancante. Tentativo di creazione automatica...");
          p = await DB.createUserProfile(user.id, user.email);
      }

      setProfile(p);
      setLoadingAuth(false);
  };

  // 2. Data Fetching when profile changes
  useEffect(() => {
      if (profile && profile.is_approved) {
          fetchData(profile.id);
      }
  }, [profile]);

  const fetchData = async (userId: string) => {
      setLoadingData(true);
      const [p, e] = await Promise.all([DB.getProjects(userId), DB.getEntries(userId)]);
      setProjects(p);
      setEntries(e);
      setLoadingData(false);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setEntries([]);
      setProjects([]);
      setView(AppView.TIMESHEET);
  };

  // Handlers
  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Eliminare questo servizio?')) {
        await DB.deleteEntry(id);
        if (profile) fetchData(profile.id);
    }
  };

  const handleManualEntryClick = () => {
    if (projects.length === 0) {
        alert("Devi prima creare almeno una postazione/cliente.");
        setView(AppView.CLIENTS);
        return;
    }
    setEditingEntry(undefined);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (entry: TimeEntry) => {
    if (profile) {
        await DB.saveEntry(entry, profile.id);
        fetchData(profile.id);
    }
  };

  const handleSaveProject = async (project: Project) => {
      if (profile) {
          await DB.saveProject(project, profile.id);
          fetchData(profile.id);
      }
  };

  const handleDeleteProject = async (id: string) => {
      if (window.confirm('Eliminare postazione?')) {
          await DB.deleteProject(id);
          if (profile) fetchData(profile.id);
      }
  };

  // --- RENDER LOGIC ---

  if (loadingAuth) {
      return <div className="h-screen flex items-center justify-center bg-gray-50 text-indigo-600"><Loader2 className="animate-spin w-8 h-8"/></div>;
  }

  if (!profile) {
      return <Auth onLoginSuccess={() => {}} />;
  }

  // Blocco se non approvato
  if (!profile.is_approved) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
                  <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="text-amber-600 w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Account in attesa</h1>
                  <p className="text-gray-600 mb-6">
                      Il tuo account è stato creato ed è in attesa di approvazione da parte dell'amministratore.
                  </p>
                  <div className="bg-indigo-50 p-4 rounded-lg text-xs text-left mb-6 text-indigo-800">
                      <strong>ID Utente:</strong> <span className="font-mono">{profile.id}</span><br/>
                      <strong>Stato:</strong> In attesa di verifica manuale.
                      <p className="mt-2 text-slate-500 italic">Se sei l'amministratore, vai su Supabase &gt; Table Editor &gt; profiles e imposta <code>is_approved = TRUE</code> e <code>role = admin</code> per questo utente.</p>
                  </div>
                  <button onClick={handleLogout} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800">
                      Torna al Login
                  </button>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    if (loadingData) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
    }

    switch (view) {
      case AppView.TIMESHEET:
        return (
          <div className="space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Registro Servizi</h1>
                    <p className="text-gray-500 mt-1">
                        Piano: <span className="uppercase font-bold text-indigo-600">{profile?.subscription_status}</span> 
                        {profile?.subscription_status === 'trial' && ` (Scade: ${new Date(profile.trial_ends_at).toLocaleDateString()})`}
                    </p>
                </div>
                <button 
                    onClick={handleManualEntryClick}
                    className="flex items-center justify-center gap-2 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <Plus size={20} /> Aggiungi Servizio
                </button>
             </div>
             
             <TimeLogTable 
                entries={entries} 
                projects={projects} 
                onDelete={handleDeleteEntry} 
                onEdit={(e) => { setEditingEntry(e); setIsModalOpen(true); }}
            />
          </div>
        );
      case AppView.CLIENTS:
          return <ManageClients projects={projects} onSave={handleSaveProject} onDelete={handleDeleteProject} />;
      case AppView.BILLING:
          return <Billing entries={entries} projects={projects} />;
      case AppView.REPORTS:
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Analisi Produttività</h2>
                <Reports entries={entries} projects={projects} />
            </div>
        );
      case AppView.ADMIN_PANEL:
          if (profile.role !== 'admin') return <div className="text-red-500 p-8">Accesso Negato. Richiede permessi Admin.</div>;
          return <AdminPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar currentView={view} onChangeView={setView} userRole={profile.role} />
      
      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-gray-50/50">
          {/* Header Mobile / User Info */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
               <div className="text-right hidden md:block">
                   <p className="text-sm font-bold text-gray-800">{profile.email}</p>
                   <p className="text-xs text-indigo-600 capitalize">
                       {profile.role} • {profile.subscription_status}
                   </p>
               </div>
               <button onClick={handleLogout} className="bg-white p-2 rounded-lg shadow-sm text-gray-500 hover:text-red-500 transition-colors" title="Esci">
                   <LogOut size={20} />
               </button>
          </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 mt-10 md:mt-0">
            {renderContent()}
        </div>
      </main>

      <EntryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        initialEntry={editingEntry}
        projects={projects}
      />
    </div>
  );
}

export default App;