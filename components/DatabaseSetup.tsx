import React, { useState } from 'react';
import { Database, Copy, Check, RefreshCw, Terminal } from 'lucide-react';

const SQL_SCRIPT = `-- 1. Crea la tabella PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text default 'user',
  subscription_status text default 'trial',
  trial_ends_at timestamptz,
  is_approved boolean default false,
  created_at timestamptz default now()
);

-- 2. Abilita sicurezza (RLS)
alter table public.profiles enable row level security;

-- 3. Crea policy per permettere agli utenti di inserire il proprio profilo
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

-- 4. Tabelle Progetti e Orari
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text,
  default_hourly_rate numeric,
  shifts jsonb,
  created_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "Users can CRUD their own projects" on public.projects
  for all using (auth.uid() = user_id);

create table if not exists public.time_entries (
  id text not null primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  description text,
  start_time bigint,
  end_time bigint,
  duration numeric,
  hourly_rate numeric,
  expenses jsonb,
  is_night_shift boolean default false,
  created_at timestamptz default now()
);
alter table public.time_entries enable row level security;
create policy "Users can CRUD their own entries" on public.time_entries
  for all using (auth.uid() = user_id);
`;

const DatabaseSetup = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(SQL_SCRIPT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-amber-500 p-6 text-white flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                        <Database size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Configurazione Database Mancante</h1>
                        <p className="opacity-90">Le tabelle su Supabase non esistono o mancano i permessi.</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-gray-600 text-lg">
                        L'app è connessa, ma non riesce a salvare il tuo profilo. Questo succede quando non hai eseguito lo script di inizializzazione.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                         <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                             <Terminal size={18} className="text-indigo-600"/> Come Risolvere:
                         </h3>
                         <ol className="list-decimal list-inside text-slate-700 space-y-1 ml-2">
                             <li>Copia lo script qui sotto.</li>
                             <li>Vai su <a href="https://supabase.com/dashboard" target="_blank" className="text-indigo-600 font-bold underline">Supabase Dashboard</a>.</li>
                             <li>Apri la sezione <strong>SQL Editor</strong> (icona terminale a sinistra).</li>
                             <li>Incolla il codice e clicca <strong>Run</strong> in basso a destra.</li>
                         </ol>
                    </div>

                    <div className="relative">
                        <div className="absolute top-3 right-3">
                            <button 
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                            >
                                {copied ? <Check size={14}/> : <Copy size={14}/>}
                                {copied ? 'Copiato!' : 'Copia SQL'}
                            </button>
                        </div>
                        <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm font-mono h-64 border-4 border-slate-100">
                            <code>{SQL_SCRIPT}</code>
                        </pre>
                    </div>

                    <div className="flex justify-center pt-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                        >
                            <RefreshCw size={20} /> Ho eseguito lo script, Riprova
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseSetup;