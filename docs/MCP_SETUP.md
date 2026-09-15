# Collegare MedPlanner a Codex o ChatGPT desktop

MedPlanner espone un server MCP remoto sulla Supabase Edge Function `medplanner-mcp`.

## Prima attivazione in Lovable

1. Sincronizzare la repository e applicare la migration `20260915130000_mcp_access.sql`.
2. Pubblicare la Edge Function `medplanner-mcp` con verifica JWT disabilitata. La funzione verifica autonomamente il token personale e usa `SUPABASE_SERVICE_ROLE_KEY` soltanto sul server.
3. Ripubblicare l'app.

## Collegamento

1. Aprire **Pianificazione → Sicurezza** nell'app pubblicata.
2. Premere **Nuovo token**, copiarlo e conservarlo: il valore completo viene mostrato una sola volta.
3. Copiare l'URL MCP mostrato nella stessa scheda.
4. In Codex desktop aprire **Impostazioni → MCP Servers → Add**.
5. Scegliere un server remoto HTTP, incollare l'URL e configurare `Authorization: Bearer <token>`.

Il token è separato dalla password Lovable, è memorizzato solo come hash SHA-256 e può essere revocato dall'app.

## Permessi iniziali

- lettura di agenda, medici, piano settimanale e busta giornaliera;
- creazione di appuntamenti esclusivamente in stato `proposto`;
- generazione di un piano settimanale di sole proposte;
- nessuno strumento per cancellare, approvare o spostare appuntamenti protetti.

Le fasce 12:30–14:30 non possono essere proposte singolarmente via MCP: devono essere generate dal pianificatore, che applica i vincoli delle strutture.
