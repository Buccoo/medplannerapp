## Problemi nella ricerca medico (Agenda → Nuovo Appuntamento)

In `src/pages/app/Agenda.tsx`, `filteredDoctors` usa `name.toLowerCase().includes(...)` e non deduplica né riordina.

### Fix

1. **Match solo per iniziali** (parole del nome): tokenizzare `d.name` su spazi/punteggiatura e controllare che almeno una parola **inizi** con la stringa di ricerca (case-insensitive, accent-insensitive). Es. "B" trova "Bianchi Marco" ma non "Alberti".
   - Se l'utente scrive più caratteri (es. "Bia"), continua a fare prefix-match su parola.

2. **Ordinamento alfabetico**: ordinare `filteredDoctors` con `localeCompare(..., "it", { sensitivity: "base" })`.

3. **Deduplica**: rimuovere medici con lo stesso `name` (normalizzato: trim + lowercase) tramite `Map`, mantenendo la prima occorrenza. La duplicazione può derivare da record duplicati nel DB o dal mix dei filtri.

### Modifica

Solo `src/pages/app/Agenda.tsx`, `useMemo filteredDoctors`:

```ts
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const filteredDoctors = useMemo(() => {
  let list = doctors;
  if (selectedMicroarea) list = list.filter(d => d.microarea?.trim().toLowerCase() === selectedMicroarea.trim().toLowerCase());
  if (selectedPaese)     list = list.filter(d => d.paese?.trim().toLowerCase() === selectedPaese.trim().toLowerCase());
  if (doctorSearch) {
    const q = norm(doctorSearch.trim());
    list = list.filter(d =>
      norm(d.name).split(/[\s,.'-]+/).some(w => w.startsWith(q))
    );
  }
  // dedup per nome normalizzato
  const seen = new Map<string, typeof list[number]>();
  for (const d of list) {
    const k = norm(d.name).trim();
    if (!seen.has(k)) seen.set(k, d);
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "it", { sensitivity: "base" })
  );
}, [doctors, doctorSearch, selectedPaese, selectedMicroarea]);
```

Nessun'altra modifica.
