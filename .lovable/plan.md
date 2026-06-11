## Obiettivo
Popolare l'account `buccolie@gmail.com` (user_id `3aeae7d8-9d74-4fee-9d2e-07249b7ff223`) con dati di esempio realistici, senza toccare gli altri account.

## Dati da inserire

Tutti gli `INSERT` filtrano esplicitamente sul `user_id` di buccolie. Nessun altro utente verrà modificato.

**Medici (~10)** — mix di specialità (MMG, Cardiologo, Pediatra, Ginecologo, Ortopedico, Dermatologo, ecc.), alcuni con prefisso "Dr."/"Dott."/"Prof." per testare il badge titolo, `paese` e `microarea` realistici (Milano Nord, Milano Sud, Monza…), `visits`, `k_client`/`c_client`, `target_class` (A/B/C).

**Farmacie (~8)** — nomi tipo "Farmacia Centrale", "Farmacia San Marco", indirizzi, telefoni, paese/microarea coerenti con i medici, qualche nota.

**Prodotti (~5)** — nomi farmaceutici inventati (Cardiomax, Pediavit, Dermolen, Gastroease, Osteoflex), con `cycles` jsonb (es. 3 cicli con target), `sold`, `company_forecast`, `cycle_targets_override`.

**Appuntamenti (~15)** — distribuiti tra ieri, oggi e prossime 3 settimane. Mix di `type` (visita/farmacia) e `status` (programmato/completato/annullato), con `name`, `date`, `time`, alcuni con `products` jsonb riferiti ai prodotti creati e qualche nota di visita.

## Tecnica
- Un solo `INSERT` tramite supabase--insert per ciascuna tabella, in ordine: doctors → pharmacies → products → appointments.
- Nessuna modifica di schema, nessuna migrazione.
- Nessuna eliminazione di dati esistenti.
