# Cronosheet SaaS

Un'applicazione moderna per la gestione delle ore, turni e fatturazione, con supporto multi-utente e sicurezza dei dati tramite Supabase.

## 🚀 Come Pubblicare (Deployment)

### 1. Preparazione Database (Supabase)
1. Vai su [Supabase.com](https://supabase.com) e crea un nuovo progetto.
2. Una volta pronto, vai su **SQL Editor** ed esegui lo script SQL fornito (vedi sotto o chiedi all'assistente AI di generarlo di nuovo se lo hai perso). Questo creerà le tabelle e le regole di sicurezza (RLS).
3. Vai su **Project Settings > API**. Copia:
   - `Project URL`
   - `anon public` key

### 2. Pubblicazione su GitHub
1. Crea un nuovo repository su GitHub.
2. Carica tutti i file di questo progetto.

### 3. Pubblicazione su Vercel
1. Vai su [Vercel](https://vercel.com) e clicca "Add New > Project".
2. Importa il repository GitHub appena creato.
3. Nella sezione **Environment Variables**, aggiungi queste due variabili con i dati presi da Supabase:
   - `VITE_SUPABASE_URL`: (Il tuo URL Supabase)
   - `VITE_SUPABASE_KEY`: (La tua chiave anon)
4. Clicca **Deploy**.

## 🛠 Sviluppo Locale
Se vuoi testare in locale, crea un file `.env` nella root del progetto:

```
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_KEY=tua-chiave-anon-public
```

## 🔐 Credenziali Admin Iniziali
Dopo aver creato il database, il primo utente che si registra sarà un utente normale.
Per renderlo Admin:
1. Vai su Supabase > Table Editor > `profiles`.
2. Trova il tuo utente e cambia la colonna `role` da `user` a `admin`.
3. Cambia `is_approved` a `TRUE`.
