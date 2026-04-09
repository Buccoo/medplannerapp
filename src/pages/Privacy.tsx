import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Torna alla home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Informativa sulla Privacy</h1>
        <p className="text-muted-foreground mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Titolare del Trattamento</h2>
            <p className="text-muted-foreground">
              Il Titolare del trattamento dei dati personali è il gestore dell'applicazione MedPlanner 
              (di seguito "Titolare"). Per qualsiasi richiesta relativa al trattamento dei dati personali, 
              è possibile contattare il Titolare all'indirizzo email: <strong>privacy@medplannerapp.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Dati Raccolti</h2>
            <p className="text-muted-foreground mb-2">Raccogliamo le seguenti categorie di dati personali:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Dati di registrazione:</strong> nome, cognome, indirizzo email, forniti al momento della creazione dell'account.</li>
              <li><strong>Dati di autenticazione:</strong> credenziali di accesso (email e password crittografata) o dati provenienti da Google OAuth.</li>
              <li><strong>Dati professionali:</strong> informazioni relative a medici, farmacie, appuntamenti, prodotti e obiettivi di vendita inseriti dall'utente.</li>
              <li><strong>Dati di pagamento:</strong> gestiti integralmente da Stripe Inc. (processore di pagamento PCI-DSS compliant). Non memorizziamo dati di carte di credito.</li>
              <li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, sistema operativo, dati di navigazione, raccolti automaticamente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Base Giuridica e Finalità del Trattamento</h2>
            <p className="text-muted-foreground mb-2">I dati personali sono trattati sulla base di:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Esecuzione del contratto (Art. 6.1.b GDPR):</strong> per fornire il servizio MedPlanner, gestire l'account utente e processare i pagamenti.</li>
              <li><strong>Consenso (Art. 6.1.a GDPR):</strong> per l'invio di comunicazioni promozionali (revocabile in qualsiasi momento).</li>
              <li><strong>Interesse legittimo (Art. 6.1.f GDPR):</strong> per migliorare il servizio, prevenire frodi e garantire la sicurezza.</li>
              <li><strong>Obbligo legale (Art. 6.1.c GDPR):</strong> per adempiere a obblighi fiscali e normativi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Periodo di Conservazione</h2>
            <p className="text-muted-foreground">
              I dati personali sono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong>Dati dell'account:</strong> fino alla cancellazione dell'account da parte dell'utente.</li>
              <li><strong>Dati di pagamento:</strong> 10 anni per obblighi fiscali.</li>
              <li><strong>Dati tecnici/log:</strong> massimo 12 mesi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Destinatari dei Dati</h2>
            <p className="text-muted-foreground mb-2">I dati possono essere condivisi con:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Supabase Inc.:</strong> hosting del database e autenticazione (server UE).</li>
              <li><strong>Stripe Inc.:</strong> gestione dei pagamenti (conforme PCI-DSS, Privacy Shield / SCC).</li>
              <li><strong>Google:</strong> solo se l'utente sceglie l'autenticazione tramite Google OAuth.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Non vendiamo, cediamo o condividiamo i dati personali con terze parti per finalità di marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Trasferimento Dati Extra-UE</h2>
            <p className="text-muted-foreground">
              Alcuni dei nostri fornitori di servizi (Stripe, Google) hanno sede negli Stati Uniti. 
              Il trasferimento dei dati avviene nel rispetto del GDPR tramite Clausole Contrattuali Standard (SCC) 
              approvate dalla Commissione Europea o tramite il EU-US Data Privacy Framework.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Diritti dell'Interessato</h2>
            <p className="text-muted-foreground mb-2">Ai sensi degli articoli 15-22 del GDPR, l'utente ha diritto di:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Accesso:</strong> ottenere conferma del trattamento e copia dei propri dati.</li>
              <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti.</li>
              <li><strong>Cancellazione:</strong> richiedere la cancellazione dei propri dati ("diritto all'oblio").</li>
              <li><strong>Limitazione:</strong> limitare il trattamento in determinati casi.</li>
              <li><strong>Portabilità:</strong> ricevere i propri dati in formato strutturato e leggibile da dispositivo automatico.</li>
              <li><strong>Opposizione:</strong> opporsi al trattamento basato su interesse legittimo.</li>
              <li><strong>Revoca del consenso:</strong> revocare in qualsiasi momento il consenso prestato.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Per esercitare i propri diritti, scrivere a: <strong>privacy@medplannerapp.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Reclamo all'Autorità di Controllo</h2>
            <p className="text-muted-foreground">
              L'utente ha diritto di proporre reclamo al Garante per la Protezione dei Dati Personali 
              (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.garanteprivacy.it</a>).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cookie</h2>
            <p className="text-muted-foreground">
              MedPlanner utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio 
              (autenticazione, sessione). Non utilizziamo cookie di profilazione o di tracciamento di terze parti. 
              Per questo motivo non è necessario un banner cookie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Sicurezza</h2>
            <p className="text-muted-foreground">
              Adottiamo misure tecniche e organizzative adeguate per proteggere i dati personali, tra cui: 
              crittografia in transito (TLS/SSL), crittografia a riposo del database, accesso basato su ruoli (RLS), 
              e autenticazione a più fattori ove disponibile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Modifiche all'Informativa</h2>
            <p className="text-muted-foreground">
              Ci riserviamo il diritto di modificare la presente informativa. Le modifiche saranno pubblicate su questa pagina 
              con indicazione della data di ultimo aggiornamento. In caso di modifiche sostanziali, l'utente sarà informato 
              tramite email o notifica nell'applicazione.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
