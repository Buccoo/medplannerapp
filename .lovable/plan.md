## 1. Auto-redirect utente loggato

`src/pages/Landing.tsx`: aggiungere `useEffect` che, quando `loading === false && user` è valido, esegue `navigate("/app", { replace: true })`. Così l'utente già autenticato salta del tutto la landing senza dover cliccare "Vai all'app". I bottoni esistenti restano come fallback per il brevissimo flash prima del redirect.

## 2. Titolo "Dr." come badge, ignorato nella ricerca/ordinamento

### Nuovo helper `src/lib/doctorName.ts`

```ts
const TITLE_RE = /^\s*(prof\.?\s*ssa|prof\.?|dott\.?\s*ssa|dr\.?\s*ssa|dott\.?|dr\.?)\s+/i;

export function splitDoctorTitle(fullName: string): { title: string; name: string } {
  const m = (fullName || "").match(TITLE_RE);
  if (!m) return { title: "", name: (fullName || "").trim() };
  const raw = m[1].toLowerCase().replace(/\s+/g, "");
  const map: Record<string, string> = {
    "dr": "Dr.", "dr.": "Dr.",
    "drssa": "Dr.ssa", "dr.ssa": "Dr.ssa",
    "dott": "Dott.", "dott.": "Dott.",
    "dottssa": "Dott.ssa", "dott.ssa": "Dott.ssa",
    "prof": "Prof.", "prof.": "Prof.",
    "profssa": "Prof.ssa", "prof.ssa": "Prof.ssa",
  };
  return { title: map[raw] ?? m[1].trim(), name: fullName.slice(m[0].length).trim() };
}

export const stripDoctorTitle = (n: string) => splitDoctorTitle(n).name;
```

### `src/pages/app/Medici.tsx`

- Importare `splitDoctorTitle` / `stripDoctorTitle`.
- Fetch: dopo `select("*").order("name")` ordinare lato client per `stripDoctorTitle(name)` con `localeCompare("it", { sensitivity: "base" })`.
- `filtered`: confrontare `stripDoctorTitle(d.name).toLowerCase().includes(search.toLowerCase())`.
- Card medico (linea 309-312): l'iniziale dell'avatar deve usare `stripDoctorTitle(d.name).split(" ").slice(-1)[0]?.[0]`. Aggiungere un `Badge` accanto al nome con il titolo (`{title}` se presente). Il nome mostrato resta `d.name` completo? → No, mostrare `stripDoctorTitle(d.name)` con badge a sinistra del nome — così la D non confonde più visivamente.
- Sheet/dettaglio: stessa cosa nel titolo (`<SheetTitle>`).

### `src/pages/app/Agenda.tsx` (ricerca medico)

Estendere il `useMemo filteredDoctors` già aggiornato:
- Normalizzare anche rimuovendo il titolo prima dello split per parole: `norm(stripDoctorTitle(d.name)).split(...)`.
- Ordinamento alfabetico con `stripDoctorTitle` lato confronto.
- La visualizzazione del nome nei suggerimenti può restare `d.name` (con "Dr."): non confonde l'ordine perché ora il sort è sul nome stripped.

## Verifica

- Logout → la landing si vede. Login → al refresh della "/" si finisce subito in `/app`.
- In Medici, ricerca per "Ros" trova "Dr. Rossi" e "Rossini"; i Dr. compaiono nell'ordine alfabetico del cognome, non tutti raggruppati sotto la D. Badge "Dr." visibile sulla card.
- In Agenda → Nuovo appuntamento, digitando "B" appaiono solo i medici il cui nome (senza titolo) inizia per B.

Nessuna modifica al DB.
