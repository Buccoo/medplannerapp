## Obiettivo
Nel dialog "Nuovo Appuntamento", subito sotto il badge con l'orario ambulatoriale del medico, mostrare gli appuntamenti già fissati per quel giorno che rientrano nella fascia oraria dell'ambulatorio, così da vedere a colpo d'occhio gli slot liberi.

## Comportamento
- Compare solo quando: medico selezionato + il medico ha un orario ambulatoriale per il giorno selezionato.
- Mostra elenco compatto degli appuntamenti dell'utente per quella data il cui orario cade nell'intervallo (es. 09:00–11:00) dell'ambulatorio, ordinati per orario.
- Ogni riga: orario · nome (medico/farmacia) · badge stato.
- Se nessun appuntamento in quella fascia: messaggio "Nessun appuntamento in questa fascia — slot liberi".
- Non blocca l'inserimento (è solo informativo).

## Dettagli tecnici (src/pages/app/Agenda.tsx)
- Riutilizzo lo stato `appointments` già caricato.
- Parsing orario ambulatorio: split su `-` → `startHH:MM`, `endHH:MM`; confronto stringhe `HH:MM` (già formato usato).
- `const slotApps = appointments.filter(a => isSameDay(a.date, selectedDate) && a.time >= start && a.time <= end).sort((a,b) => a.time.localeCompare(b.time))`.
- Blocco JSX inserito subito dopo l'attuale badge "Ambulatorio {giorno}: {orario}" nel dialog.
- Stile: piccola card `bg-muted/40 rounded-lg p-2 text-xs` con lista.

Nessun'altra modifica al form, alla logica di salvataggio, o al database.