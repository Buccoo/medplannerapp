## Problemi

1. La navbar è "volante" perché ha `bottom: calc(env(safe-area-inset-bottom) + 10px)`. Su iOS, quando l'address bar di Safari si nasconde/mostra (scroll up/down), `100dvh` cambia e la nav appare spostarsi. Inoltre lascia un gap trasparente in basso da cui si vede il contenuto.
2. Il tap su "Agenda" (e altri) a volte fallisce: probabilmente perché il button rotondo "Home" centrale (`-top-5`, h-14 w-14, z-implicit dentro `relative`) si sovrappone parzialmente alle aree tap delle voci adiacenti e/o intercetta tap pensati per Agenda quando il dito tocca poco sotto il bordo.

## Soluzione

Rendere la navbar veramente fissa al fondo e opaca, alzando solo i contenuti (icone/etichette) sopra l'area swipe iPhone — non l'intera nav.

### Modifiche a `src/components/BottomNav.tsx`

- Ancorare la nav a `bottom: 0`, `left: 0`, `right: 0`.
- Aggiungere `paddingBottom: env(safe-area-inset-bottom)` al wrapper interno così la barra riempie fino al bordo dello schermo (niente gap), ma le icone restano sopra l'home indicator.
- Aumentare leggermente l'altezza tap area: portare `h-16` a `h-[68px]` e aggiungere un padding-top extra per "respiro" rispetto al pulsante Home rialzato.
- Rendere lo sfondo solido (rimuovere `glass-strong` translucido → usare `bg-background/95` con `border-t` per coerenza, così non si vede il contenuto dietro).
- Dare al pulsante Home centrale `pointer-events-auto` e ai NavLink laterali un'area cliccabile più ampia con `flex-1 min-w-0` invece di `px-3 py-1`, così "Agenda" copre tutto lo spazio fra il bordo sinistro e il pulsante centrale.
- Assicurarsi che il pulsante Home centrale non si estenda lateralmente sopra Agenda/Farmacie: lo spacer centrale resta `w-16` e il bottone resta `w-14`, ma lo wrapper del bottone Home prende `pointer-events-none` sull'area trasparente attorno (solo il cerchio è cliccabile) → impostiamo `pointer-events-none` sul container assoluto e `pointer-events-auto` sul cerchio + label.

### Modifiche a `src/layouts/AppLayout.tsx`

- Sostituire il padding inline con `paddingBottom: calc(env(safe-area-inset-bottom) + 5.5rem)` (perché la nav ora include la safe-area al suo interno, quindi il contenuto deve solo evitare l'altezza visibile della nav + la safe-area una sola volta — manteniamo conservativo).

### Verifica

- Apertura preview mobile (430×777), tap rapidi su Agenda/Medici/Farmacie/Prodotti e verifica navigazione immediata.
- Scroll su/giù: la nav rimane incollata al bordo inferiore senza spostamenti.
- Nessun contenuto visibile sotto la nav.

Nessuna modifica a logica di routing.
