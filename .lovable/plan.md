## Obiettivo
Aggiungere uno slot "Priorità della giornata" nella pagina **Agenda**, posizionato tra il calendario (selettore giorni) e la lista degli appuntamenti, visibile nelle viste **Giorno** e **Settimana** (non in Mese).

## Cosa cambia per l'utente
- Sotto al calendario settimanale (o sotto all'header navigazione data in vista Giorno) compare una card con titolo "Priorità della giornata".
- L'utente può scrivere/modificare un testo libero (es. elenco priorità) per la **data selezionata**.
- Il testo viene salvato automaticamente (debounce alla perdita di focus) ed è specifico per giorno e per utente.
- Cambiando giorno, la card mostra le priorità di quel giorno (vuota se non impostate).

## Dettagli tecnici

### Nuova tabella `daily_priorities`
Migration:
```
id uuid pk, user_id uuid, date date, content text, created_at, updated_at
UNIQUE (user_id, date)
```
- GRANT su `authenticated` + `service_role`.
- RLS: policy `auth.uid() = user_id` per SELECT/INSERT/UPDATE/DELETE.

### Modifica `src/pages/app/Agenda.tsx`
- Stato `dailyPriority: string` + `prioritySaving: boolean`.
- `useEffect` su `selectedDate` → fetch `daily_priorities` per quella data.
- Funzione `savePriority()` che fa upsert su `(user_id, date)` al `onBlur` del textarea (o debounce 800ms), bloccata se `!canEdit`.
- Inserire il nuovo blocco JSX **dopo** il calendario settimanale / header (riga ~415) e **prima** della lista appuntamenti (riga ~443), renderizzato solo quando `viewMode !== "month"`.
- Stile coerente: card `glass rounded-2xl p-3 shadow-soft` con icona ⭐/Flag, label "Priorità della giornata · {data}" e `Textarea` compatto (min-h ~70px), placeholder "Scrivi le priorità per oggi…".

Nessuna modifica ad altre pagine o alla logica appuntamenti.
