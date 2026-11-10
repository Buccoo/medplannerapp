import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Calendar, Clock } from "lucide-react";

interface Article {
  id: string;
  title: string;
  subtitle: string;
  datePublished: string;
  readingTime: string;
  category: string;
  keywords: string[];
  summary: string;
  sections: { heading: string; paragraphs: string[] }[];
}

const ARTICLES: Article[] = [
  {
    id: "organizzazione-lavoro-informatore-scientifico-farmaco-isf",
    title:
      "Organizzazione del Lavoro per l'Informatore Scientifico del Farmaco (ISF): Come Pianificare Visite Mediche e Giro Visite in Modo Efficiente",
    subtitle:
      "Metodologie pratiche per ottimizzare l'agenda settimanale tra studi di medicina generale, specialisti ambulatoriali, reparti ospedalieri e farmacie di territorio.",
    datePublished: "2026-11-10",
    readingTime: "8 min",
    category: "Pianificazione & Produttività ISF",
    keywords: [
      "informatore scientifico del farmaco",
      "agenda visite mediche ISF",
      "pianificazione giro visite",
      "app per informatori scientifici",
      "organizzazione territorio farmaceutico",
    ],
    summary:
      "Guida operativa per Informatori Scientifici del Farmaco (ISF) su come strutturare il piano visite settimanale, ridurre i tempi morti tra gli ambulatori e massimizzare la qualità degli incontri con la classe medica.",
    sections: [
      {
        heading: "1. La complessità della gestione territoriale nell'informazione medico-scientifica",
        paragraphs: [
          "Il lavoro quotidiano dell'Informatore Scientifico del Farmaco (ISF) richiede un equilibrio costante tra rigore scientifico, capacità relazionale e precisione logistica. Ogni settimana un professionista ISF deve coordinare decine di appuntamenti con Medici di Medicina Generale (MMG), pediatri di libera scelta, medici specialisti in strutture ospedaliere o poliambulatori e farmacisti titolari o collaboratori.",
          "Senza una pianificazione strutturata degli orari di ricevimento, delle finestre di accesso agli studi e della distribuzione geografica per micro-aree o CAP, il rischio principale è dedicare gran parte della giornata agli spostamenti e alle sale d'attesa, riducendo il numero e la qualità dei colloqui effettivamente svolti.",
        ],
      },
      {
        heading: "2. Pianificazione per cluster geografici e fascia di priorità clinica",
        paragraphs: [
          "Un giro visite efficace nasce dalla suddivisione della propria zona operativa in cluster territoriali omogenei. Raggruppare gli appuntamenti della mattina e del pomeriggio in base alla vicinanza tra ambulatori e farmacie limitrofe consente di incrementare fino al 30% il numero di contatti utili per singola giornata lavorativa.",
          "Attraverso l'Agenda Smart di MedPlanner, l'informatore può visualizzare immediatamente gli impegni del giorno, verificare lo storico delle ultime visite effettuate a ciascun medico, annotare i prodotti presentati e programmare il successivo follow-up con pochi tocchi direttamente dallo smartphone.",
        ],
      },
      {
        heading: "3. Continuità del dialogo scientifico e preparazione pre-call",
        paragraphs: [
          "Il valore percepito dal medico dipende dalla pertinenza dell'informazione scientifica ricevuta. Consultare in trenta secondi, prima di entrare in studio, le note dell'incontro precedente, le specialità farmaceutiche o i nutraceutici di maggiore interesse per quel professionista e le eventuali richieste di letteratura clinica trasforma ogni visita in una consulenza mirata e autorevole.",
        ],
      },
    ],
  },
  {
    id: "gestione-schedario-medici-farmacie-target-isf",
    title:
      "Gestione Schedario Medici e Farmacie per ISF: Strategie di Segmentazione del Portfolio e Monitoraggio degli Obiettivi di Vendita",
    subtitle:
      "Come costruire una rubrica medici sempre aggiornata, coordinare la presenza del prodotto in farmacia e tenere sotto controllo KPI, copertura e frequenza di visita.",
    datePublished: "2026-11-10",
    readingTime: "8 min",
    category: "Gestione Schedario & Target",
    keywords: [
      "schedario medici ISF",
      "gestione farmacie informatore",
      "target vendita farmaceutico",
      "copertura e frequenza visite ISF",
      "CRM informatori scientifici",
    ],
    summary:
      "Strategie per mantenere uno schedario medici pulito e segmentato per specializzazione e potenziale prescrittivo, integrando la gestione delle farmacie di zona e il monitoraggio dei target di vendita.",
    sections: [
      {
        heading: "1. Costruire e mantenere uno schedario medici ad alto valore informativo",
        paragraphs: [
          "Lo schedario medici rappresenta il patrimonio professionale più importante per ogni Informatore Scientifico del Farmaco. Un database efficace non si limita a nome, specializzazione e telefono: deve raccogliere giorni e fasce orarie di ricevimento per gli ISF, modalità di accesso (su appuntamento, tramite segreteria o accesso libero), recapiti dei diversi studi in cui il professionista riceve e linee terapeutiche di riferimento.",
          "Mantenere queste informazioni aggiornate in tempo reale su MedPlanner evita visite a vuoto per cambi d'orario imprevisti e permette di filtrare istantaneamente i medici per specializzazione, località o stato di copertura nel ciclo corrente.",
        ],
      },
      {
        heading: "2. Sinergia tra informazione medica e presidio della farmacia territoriale",
        paragraphs: [
          "Nel mercato farmaceutico moderno — in particolare per integratori, dispositivi medici, dermocosmesi e farmaci a prescrizione non ripetibile o SOP/OTC — il lavoro svolto nello studio medico deve trovare immediata continuità nella farmacia di riferimento. Se il medico consiglia o prescrive un prodotto non disponibile sugli scaffali delle farmacie vicine allo studio, il paziente rischia una sostituzione e il lavoro di informazione perde efficacia.",
          "Affiancare alla rubrica medici un'anagrafica puntuale delle farmacie di zona consente all'ISF di verificare la rotazione dei prodotti, concordare ordini diretti o tramite grossista e segnalare ai medici le farmacie presidiate nel quartiere.",
        ],
      },
      {
        heading: "3. Monitoraggio obiettivi di vendita, copertura e frequenza in tempo reale",
        paragraphs: [
          "Avere sempre sott'occhio l'avanzamento rispetto ai target mensili o trimestrali per ciascun prodotto del listino permette di intervenire tempestivamente durante il ciclo lavorativo, concentrando le visite sulle referenze che richiedono maggiore spinta informativa prima della chiusura del periodo.",
        ],
      },
    ],
  },
  {
    id: "digitalizzazione-informazione-scientifica-farmaco-crm-cloud",
    title:
      "Digitalizzazione dell'Informazione Scientifica del Farmaco: Vantaggi di un'Agenda Cloud e CRM Dedicato Rispetto ai Fogli di Calcolo",
    subtitle:
      "Perché abbandonare agende cartacee e file Excel frammentati a favore di una web app veloce, sicura e pensata per la mobilità dell'informatore medico-scientifico.",
    datePublished: "2026-11-10",
    readingTime: "7 min",
    category: "Innovazione Digitale & Sicurezza",
    keywords: [
      "software informatori scientifici del farmaco",
      "agenda digitale ISF",
      "CRM farmaceutico cloud",
      "sicurezza dati GDPR ISF",
      "MedPlanner app",
    ],
    summary:
      "Confronto pratico tra l'utilizzo di strumenti tradizionali (agende cartacee, fogli Excel) e l'adozione di una piattaforma cloud specializzata come MedPlanner per la gestione quotidiana dell'attività ISF.",
    sections: [
      {
        heading: "1. I limiti operativi di fogli Excel e agende cartacee in mobilità",
        paragraphs: [
          "Consultare o modificare un foglio di calcolo complesso dallo schermo dello smartphone tra una visita medica e l'altra è lento, scomodo e soggetto a errori di digitazione o perdite di sincronizzazione. Allo stesso modo, l'agenda cartaceo-manuale rende impossibile ricercare rapidamente tutti i cardiologi o i pediatri non ancora visitati nel mese o calcolare in automatico le statistiche di attività.",
          "Un'applicazione web progressiva progettata mobile-first come MedPlanner offre un'interfaccia immediata, leggibile con una sola mano e sincronizzata istantaneamente tra telefono, tablet e computer di casa.",
        ],
      },
      {
        heading: "2. Sicurezza dei dati professionali, backup automatico e conformità GDPR",
        paragraphs: [
          "Lo smarrimento di un'agenda cartacea o il guasto di un dispositivo locale può comportare la perdita definitiva di anni di annotazioni sullo schedario di zona. Affidarsi a un'infrastruttura cloud europea con trasmissione crittografata (TLS) e politiche di isolamento dei dati (Row-Level Security) garantisce che ogni informatore abbia accesso esclusivo al proprio portafoglio professionale, con backup continui e tutela della riservatezza.",
        ],
      },
      {
        heading: "3. Semplicità d'uso rispetto ai portali aziendali complessi",
        paragraphs: [
          "Molti CRM enterprise imposti dalle mandanti sono pensati per la rendicontazione direzionale più che per aiutare concretamente l'informatore sul campo. MedPlanner nasce invece come assistente personale dell'ISF (monomandatario o plurimandatario): zero burocrazia inutile, registrazione di una visita in pochi secondi e controllo immediato su agenda, medici, farmacie e prodotti.",
        ],
      },
    ],
  },
];

export default function Articoli() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Articoli e Guide per Informatori Scientifici del Farmaco (ISF) | MedPlanner";
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": ARTICLES.map((article) => ({
      "@type": "BlogPosting",
      "@id": `https://medplannerapp.com/articoli#${article.id}`,
      headline: article.title,
      description: article.summary,
      datePublished: article.datePublished,
      dateModified: article.datePublished,
      inLanguage: "it-IT",
      author: {
        "@type": "Organization",
        name: "MedPlanner Editorial Team",
        url: "https://medplannerapp.com/",
      },
      publisher: {
        "@type": "Organization",
        name: "MedPlanner",
        url: "https://medplannerapp.com/",
        logo: {
          "@type": "ImageObject",
          url: "https://medplannerapp.com/favicon.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://medplannerapp.com/articoli",
      },
      keywords: article.keywords.join(", "),
      articleSection: article.category,
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-border sticky top-0 z-40 bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">Med</span>Planner
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-12 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            <BookOpen className="w-4 h-4" />
            Guide &amp; Approfondimenti per ISF
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Articoli per l'Informatore Scientifico del Farmaco: Agenda, Schedario Medici e Produttività
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Risorse pratiche e metodologie organizzative dedicate agli Informatori Scientifici del Farmaco
            (ISF) per migliorare la pianificazione del giro visite, la gestione dello schedario medici e il
            raggiungimento dei target in farmacia.
          </p>
        </div>

        <nav aria-label="Indice degli articoli" className="mb-14 p-6 rounded-2xl border border-border bg-card">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Indice degli approfondimenti
          </h2>
          <ol className="space-y-2.5 list-decimal list-inside text-sm md:text-base">
            {ARTICLES.map((article) => (
              <li key={article.id}>
                <a
                  href={`#${article.id}`}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {article.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-16">
          {ARTICLES.map((article) => (
            <article
              key={article.id}
              id={article.id}
              className="scroll-mt-24 border-b border-border pb-14 last:border-b-0"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {article.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <time dateTime={article.datePublished}>10 Novembre 2026</time>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Lettura {article.readingTime}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-snug">
                {article.title}
              </h2>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                {article.subtitle}
              </p>

              <div className="space-y-7">
                {article.sections.map((section) => (
                  <section key={section.heading} className="space-y-3">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      {section.heading}
                    </h3>
                    {section.paragraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </section>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {article.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/termini" className="hover:text-foreground transition-colors">Termini e Condizioni</Link>
            <span>·</span>
            <Link to="/articoli" className="text-muted-foreground/70 hover:text-foreground transition-colors">Articoli</Link>
          </div>
          <p className="text-muted-foreground/70">
            BUCCOLIERO GIANLUCA — Partita IVA: 03470330733
          </p>
          <p>© {new Date().getFullYear()} MedPlanner. Tutti i diritti riservati.</p>
          <div>
            <a
              href="https://tattica.online"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <span>Powered by:</span>
              <span aria-hidden="true" className="text-sm leading-none">♞</span>
              <span className="font-semibold">tattica.online</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
