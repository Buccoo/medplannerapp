## Problema

Su iPhone la `BottomNav` è ancorata a `bottom-0`, sovrapponendosi alla zona di swipe del sistema (home indicator). Questo causa:
- Tap "persi" perché iOS intercetta il gesto per cambiare app
- Necessità di toccare due volte per cambiare pagina

## Soluzione

Sollevare leggermente la bottom nav e rispettare la safe-area inferiore dell'iPhone, senza cambiare nient'altro del comportamento o del look.

### Modifiche

1. **`src/components/BottomNav.tsx`**
   - Sostituire `bottom-0` con un offset che combina:
     - `env(safe-area-inset-bottom)` (gestisce automaticamente il notch/home indicator)
     - un piccolo padding extra (~8px) per allontanarla dalla zona di swipe
   - Rimuovere la classe placeholder `safe-area-pb` (non definita in `index.css`) e usare uno stile inline `paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)'` oppure `bottom: 'calc(env(safe-area-inset-bottom) + 8px)'`.

2. **`src/layouts/AppLayout.tsx`**
   - Aumentare il padding inferiore del contenitore da `pb-20` a qualcosa come `pb-28` (oppure `style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}`) così il contenuto non viene coperto dalla nav rialzata.

3. **`index.html`** (verifica)
   - Assicurarsi che il meta viewport includa `viewport-fit=cover`, necessario perché `env(safe-area-inset-bottom)` funzioni su iOS. Se manca, aggiungerlo.

### Verifica

- Controllo in preview mobile (430×777) che la nav sia visibile, non tagliata, e il contenuto delle pagine (Dashboard, Agenda, Medici, Farmacie, Prodotti) non finisca sotto la nav.
- Verifica che il pulsante centrale Home (rialzato di `-top-5`) e il badge Admin (`-top-4`) restino correttamente posizionati rispetto al nuovo offset.

Nessuna modifica a logica di routing o stato: il problema è puramente di posizionamento/CSS.
