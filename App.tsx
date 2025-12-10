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
import DatabaseSetup from './components/DatabaseSetup';
import * as DB from './services/db';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Plus, Lock, LogOut, Loader2, Database, Github, Crown, Star, Play, AlertCircle, Clock } from 'lucide-react';
import { generateId } from './utils';

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showDbSetup, setShowDbSetup] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const [view, setView] = useState<AppView>(AppView.TIMESHEET);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>(undefined);

  // 0. Environment Check & Demo Logic
  useEffect(() => {
    if (!isSupabaseConfigured && !demoMode) {
        // Stop loading and let the UI show the Setup/Demo screen
        setLoadingAuth(false);
    } else if (demoMode) {
        // Initialize Demo User
        initializeDemo();
    }
  }, [demoMode]);

  const initializeDemo = async () => {
      setLoadingAuth(true);
      const demoId = 'demo-user-1';
      // Create or get demo profile
      const p = await DB.createUserProfile(demoId, 'demo@cronosheet.com');
      if (p) {
          setProfile(p);
          fetchData(p.id);
      }
      setLoadingAuth(false);
  };

  // 1. Real Auth Check (only if configured and not in demo)
  useEffect(() => {
    if (!isSupabaseConfigured || demoMode) return;

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
  }, [demoMode]);

  const fetchUserProfile = async (user: { id: string, email?: string }) => {
      let p = await DB.getUserProfile(user.id);
      
      if (!p && user.email) {
          console.log("Profilo mancante. Tentativo di creazione automatica...");
          p = await DB.createUserProfile(user.id, user.email);
      }

      if (!p) {
          setShowDbSetup(true);
          setLoadingAuth(false);
          return;
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
      if (demoMode) {
          setDemoMode(false);
          setProfile(null);
          setEntries([]);
          setProjects([]);
          return;
      }
      await supabase.auth.signOut();
      setProfile(null);
      setEntries([]);
      setProjects([]);
      setView(AppView.TIMESHEET);
      setShowDbSetup(false);
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

  const getExpirationInfo = () => {
    if (!profile) return null;

    const endDate = new Date(profile.trial_ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // STATUS ELITE
    if (profile.subscription_status === 'elite') {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200 shadow-sm">
                <Crown size={14} fill="currentColor" />
                <span className="text-xs font-bold uppercase tracking-wide">Elite Member</span>
            </div>
        );
    }

    // STATUS PRO
    if (profile.subscription_status === 'pro') {
        // Mostra scadenza solo se negli ultimi 30 giorni
        if (diffDays <= 30 && diffDays > 0) {
             return (
                <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 shadow-sm">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-bold uppercase">Pro</span>
                    </div>
                    <span className="text-xs font-medium text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        Rinnovo tra {diffDays} gg
                    </span>
                </div>
            );
        }
        // Altrimenti solo badge Pro
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 shadow-sm">
                <Star size={14} fill="currentColor" />
                <span className="text-xs font-bold uppercase tracking-wide">Pro Plan</span>
            </div>
        );
    }

    // STATUS TRIAL (Default)
    const isExpired = diffDays < 0;
    return (
        <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 shadow-sm mb-1">
                <Clock size={14} />
                <span className="text-xs font-bold uppercase tracking-wide">Trial</span>
            </div>
            <span className={`text-[10px] font-mono font-medium ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
                {isExpired ? 'Scaduto' : `Scade: ${endDate.toLocaleDateString()}`} ({diffDays > 0 ? diffDays : 0}gg)
            </span>
        </div>
    );
  };

  // --- RENDER LOGIC ---

  // Schermata "Database non collegato" con opzione Demo
  if (!isSupabaseConfigured && !demoMode && !loadingAuth) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
              <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-8 text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
                  
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                      <Database className="w-10 h-10 text-slate-600" />
                  </div>
                  
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Benvenuto in Cronosheet</h1>
                    <p className="text-slate-500 text-lg">
                        L'applicazione non è ancora collegata al cloud.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-left shadow-inner">
                      <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                          <Play className="w-5 h-5 fill-indigo-600 text-indigo-600" /> Anteprima Immediata
                      </h3>
                      <p className="text-indigo-700 mb-4 text-sm leading-relaxed">
                          Puoi avviare l'applicazione in <strong>Modalità Demo</strong>. I dati verranno salvati temporaneamente nel tuo browser. Ideale per testare l'interfaccia.
                      </p>
                      <button 
                        onClick={() => setDemoMode(true)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-200 active:scale-95 flex justify-center items-center gap-2"
                      >
                          Avvia Modalità Demo
                      </button>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                      <button 
                         onClick={() => setShowDbSetup(true)}
                         className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
                      >
                          <Database size={14} /> Voglio collegare il Database Reale
                      </button>
                  </div>
              </div>
              
              {showDbSetup && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl relative">
                          <button onClick={() => setShowDbSetup(false)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-slate-200">
                              <LogOut size={20}/>
                          </button>
                          <DatabaseSetup />
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (loadingAuth) {
      return <div className="h-screen flex items-center justify-center bg-gray-50 text-indigo-600 flex-col gap-4">
          <Loader2 className="animate-spin w-10 h-10"/>
          <p className="text-sm font-medium animate-pulse">Caricamento Cronosheet...</p>
      </div>;
  }
  
  if (showDbSetup) {
      return <DatabaseSetup />;
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
                    {demoMode && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded border border-orange-200">
                            MODALITÀ DEMO (Dati Locali)
                        </span>
                    )}
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
               {/* User Badge Info */}
               <div className="hidden md:flex flex-col items-end mr-2">
                   {getExpirationInfo()}
               </div>

               <div className="text-right hidden md:block">
                   <div className="flex items-center justify-end gap-2">
                       <p className="text-sm font-bold text-gray-800">{profile.email}</p>
                       {profile.role === 'admin' && (
                           <span title="Amministratore" className="bg-amber-100 p-1 rounded-full text-amber-600 border border-amber-200">
                               <Crown size={14} fill="currentColor" />
                           </span>
                       )}
                   </div>
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