# Deploy e collaudo della pianificazione MedPlanner

## 1. Migrazione Supabase

Applicare nell'ordine tutte le migrazioni, inclusa:

`supabase/migrations/20260914120000_planning_data_safety.sql`

Con Supabase CLI collegata al progetto:

```bash
npx supabase migration list
npx supabase db push
```

La migrazione è additiva. Prima di applicarla in produzione è comunque consigliato un backup Supabase. Il backfill marca tutti gli appuntamenti futuri esistenti come `programmato`, `is_locked = true` e prova a collegarli al medico tramite una corrispondenza esatta del nome. Non cancella righe.

Verifiche SQL post-deploy:

```sql
select count(*) from appointments where date >= current_date and not is_locked;
select planning_status, count(*) from appointments group by planning_status;
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
```

La prima query deve restituire zero immediatamente dopo il backfill, prima della creazione di nuove proposte.

## 2. Edge Function

```bash
npx supabase functions deploy planning-api
```

La funzione usa solo `SUPABASE_URL` e `SUPABASE_ANON_KEY` forniti dall'ambiente Supabase. Non aggiungere una service-role key al client. JWT verification è abilitata in `supabase/config.toml`.

Per lo snapshot giornaliero, configurare una chiamata schedulata autenticata a `create_data_snapshot('daily', null)` tramite una funzione server-side dedicata o Supabase Cron/Vault. Non è incluso un token statico nella repository: la schedulazione va completata nell'ambiente di deploy.

## 3. Test manuale

### Protezione appuntamenti

1. Aprire un appuntamento futuro già esistente e verificare il badge “Protetto”.
2. Tentare una modifica di giorno/orario tramite API: il database deve rispondere `LOCKED_APPOINTMENT`.
3. Eliminare dall'Agenda: la riga deve sparire dall'agenda, comparire in Pianificazione → Sicurezza → Cestino e rimanere in `appointments` con `deleted_at` valorizzato.
4. Ripristinarla: deve tornare attiva e protetta.

### Import e changeset

1. Aprire Dashboard → Piano settimanale → Import.
2. Caricare CSV/XLSX con intestazioni `nome`, `specialità`, `comune`, `microarea`, `indirizzo`, `struttura` e opzionalmente `external_id`.
3. Controllare le quattro classificazioni in anteprima.
4. Premere “Salva in staging”: verificare il file nel bucket privato `planning-imports`, una riga in `imports` e le righe in `import_staging`.
5. Confermare che nessun medico sia stato modificato: l'applicazione dei record certi resta volutamente dietro il futuro scope `apply_certain`.

### Strutture e piano

1. Inserire ospedale/ASL/clinica/poliambulatorio con microarea e indirizzo.
2. Usare i test automatici per verificare anti-duplicazione, conflitti e fascia 12:30–14:30.
3. Le proposte create tramite `planning-api` devono avere `planning_status = 'proposto'` e `is_locked = false`.
4. Dopo approvazione con `approve_weekly_plan`, devono diventare `programmato`, protette e precedute da snapshot.

### Busta e backup

1. Collegare obiettivi medico-prodotto in `visit_product_goals` a visite approvate.
2. Calcolare la busta per la data: la quantità deve essere la somma dei `patient_goal` (1 campione = 1 paziente-obiettivo).
3. Creare uno snapshot manuale dalla sezione Sicurezza e verificare `data_snapshots`.
4. Verificare che `audit_log` e `appointment_revisions` crescano dopo inserimenti e modifiche e che un utente autenticato non possa aggiornarli o cancellarli.

## 4. Verifiche locali

```bash
npm test
npm run lint
npm run build
```

## 5. Limiti intenzionali e prossima fase MCP

- La UI carica e classifica CSV/XLSX ma non applica automaticamente le righe: serve una RPC transazionale `apply_certain` con precedenza dei `manual_fields`, snapshot, changeset e idempotenza.
- Il motore deterministico contiene le regole di sicurezza, ma la generazione completa da AB Plan/R-O/IMS richiede mapping e file reali dell'utente; non vengono inventate associazioni prodotto-specialità.
- La vista corrente espone il contenitore del piano, la busta e i conflitti; editor completo per giorno/microarea/struttura e approvazione riga-per-riga sono la fase UI successiva.
- Lo snapshot giornaliero richiede configurazione Cron/Vault nell'ambiente Supabase.
- Prima di esporre MCP, implementare scopes server-side (`read`, `propose`, `apply_certain`), idempotency key obbligatoria e test d'integrazione contro un progetto Supabase locale.
