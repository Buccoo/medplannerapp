## Obiettivo
Aggiungere un bottone WhatsApp (link `wa.me`) per aprire velocemente la chat con un medico o una farmacia, sia nella lista Medici/Farmacie sia negli appuntamenti in Agenda.

## Comportamento
- Il bottone compare solo se il contatto ha un numero di telefono salvato.
- Il numero viene normalizzato per wa.me: rimossi spazi, trattini, parentesi e il `+` iniziale; se manca il prefisso internazionale (numero italiano a 10 cifre che inizia con 0 oppure con 3), viene anteposto `39`.
- Click → apre `https://wa.me/<numero>` in nuova scheda/app WhatsApp.
- Icona: `MessageCircle` di lucide (verde), affiancata al bottone telefono già esistente.

## Posizioni
1. **Medici** (`src/pages/app/Medici.tsx`)
   - Dialog dettaglio medico: bottone WhatsApp accanto alla riga telefono.
2. **Farmacie** (`src/pages/app/Farmacie.tsx`)
   - Dialog dettaglio farmacia: bottone WhatsApp accanto alla riga telefono.
3. **Agenda** (`src/pages/app/Agenda.tsx`)
   - Dialog dettaglio appuntamento: bottone WhatsApp accanto alla riga telefono (funziona sia per appuntamenti medico che farmacia).
   - Card medico nel dialog: bottone WhatsApp accanto al telefono.

## Dettagli tecnici
- Helper condiviso `src/lib/whatsapp.ts`:
  ```ts
  export const whatsappUrl = (phone: string): string | null => {
    let n = (phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
    if (!n) return null;
    if (n.startsWith("0") || (n.length === 10 && n.startsWith("3"))) n = "39" + n;
    return `https://wa.me/${n}`;
  };
  ```
- In ogni punto: `const wa = whatsappUrl(phone); if (wa) window.open(wa, "_blank")`.
- Bottone: `Button` ghost/icona verde (`text-green-600`) con `MessageCircle`, stesso stile delle azioni telefono esistenti.

Nessuna modifica al database o alla logica di salvataggio.
