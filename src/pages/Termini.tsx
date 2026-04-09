import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Termini = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Torna alla home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termini e Condizioni d'Uso</h1>
        <p className="text-muted-foreground mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Definizioni</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>"Servizio":</strong> l'applicazione web MedPlanner, accessibile all'indirizzo medplannerapp.lovable.app.</li>
              <li><strong>"Utente":</strong> qualsiasi persona fisica che si registra e utilizza il Servizio.</li>
              <li><strong>"Titolare":</strong> il gestore dell'applicazione MedPlanner.</li>
              <li><strong>"Contenuti dell'Utente":</strong> tutti i dati, testi e file caricati dall'Utente nel Servizio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Accettazione dei Termini</h2>
            <p className="text-muted-foreground">
              Registrandosi e utilizzando MedPlanner, l'Utente dichiara di aver letto, compreso e accettato 
              integralmente i presenti Termini e Condizioni d'Uso e l'Informativa sulla Privacy. 
              L'utilizzo del Servizio è subordinato all'accettazione dei presenti Termini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Descrizione del Servizio</h2>
            <p className="text-muted-foreground">
              MedPlanner è un'applicazione di gestione e pianificazione per Informatori Scientifici del Farmaco (ISF). 
              Permette di organizzare appuntamenti con medici, gestire contatti di farmacie, monitorare obiettivi 
              di vendita sui prodotti e pianificare l'attività lavorativa quotidiana.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Registrazione e Account</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>L'Utente deve fornire dati veritieri e aggiornati al momento della registrazione.</li>
              <li>L'Utente è responsabile della sicurezza delle proprie credenziali di accesso.</li>
              <li>L'Utente deve notificare immediatamente qualsiasi uso non autorizzato del proprio account.</li>
              <li>Il Titolare si riserva il diritto di sospendere o eliminare account che violino i presenti Termini.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Abbonamento e Pagamenti</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>L'accesso al Servizio è disponibile previa sottoscrizione di un piano a pagamento (mensile o annuale).</li>
              <li>Al primo accesso è previsto un periodo di prova gratuita di 7 giorni.</li>
              <li>Prima dell'attivazione della prova gratuita, l'Utente dispone di 24 ore per valutare il Servizio.</li>
              <li>I pagamenti sono gestiti da Stripe Inc. e soggetti ai loro <a href="https://stripe.com/it/legal" target="_blank" rel="noopener noreferrer" className="text-primary underline">termini di servizio</a>.</li>
              <li>L'abbonamento si rinnova automaticamente alla scadenza, salvo disdetta.</li>
              <li>La disdetta può essere effettuata in qualsiasi momento dalle Impostazioni dell'app. L'accesso resta attivo fino alla fine del periodo pagato.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Diritto di Recesso</h2>
            <p className="text-muted-foreground">
              Ai sensi dell'art. 52 del Codice del Consumo (D.Lgs. 206/2005), l'Utente consumatore ha diritto 
              di recedere dal contratto entro 14 giorni dalla sottoscrizione dell'abbonamento, senza dover 
              fornire alcuna motivazione. Per esercitare il diritto di recesso, contattare: <strong>supporto@medplannerapp.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contenuti dell'Utente</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>L'Utente mantiene la piena titolarità dei Contenuti caricati nel Servizio.</li>
              <li>Il Titolare non accede, utilizza o condivide i Contenuti dell'Utente per scopi diversi dalla fornitura del Servizio.</li>
              <li>L'Utente è responsabile della liceità dei Contenuti inseriti e garantisce di avere i diritti necessari.</li>
              <li>In caso di cancellazione dell'account, i Contenuti dell'Utente saranno eliminati entro 30 giorni.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Obblighi dell'Utente</h2>
            <p className="text-muted-foreground mb-2">L'Utente si impegna a:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Utilizzare il Servizio in modo lecito e conforme ai presenti Termini.</li>
              <li>Non tentare di accedere a dati di altri utenti o compromettere la sicurezza del sistema.</li>
              <li>Non utilizzare il Servizio per attività illegali, diffamatorie o contrarie all'ordine pubblico.</li>
              <li>Non effettuare reverse engineering, decompilazione o disassemblaggio del software.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Proprietà Intellettuale</h2>
            <p className="text-muted-foreground">
              Il Servizio, inclusi design, codice sorgente, marchi, logo e contenuti originali, sono di proprietà 
              esclusiva del Titolare e protetti dalle leggi vigenti in materia di proprietà intellettuale. 
              È vietata qualsiasi riproduzione, distribuzione o utilizzo non autorizzato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitazione di Responsabilità</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Il Servizio è fornito "così com'è" (as is) e "come disponibile" (as available).</li>
              <li>Il Titolare non garantisce la continuità ininterrotta del Servizio e non è responsabile per eventuali interruzioni temporanee.</li>
              <li>Il Titolare non è responsabile per la perdita di dati causata da azioni dell'Utente o di terzi.</li>
              <li>La responsabilità del Titolare è limitata all'importo pagato dall'Utente negli ultimi 12 mesi.</li>
              <li>MedPlanner è uno strumento organizzativo e non fornisce consulenza medica o farmaceutica.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Disponibilità del Servizio</h2>
            <p className="text-muted-foreground">
              Il Titolare si impegna a garantire la migliore disponibilità possibile del Servizio, ma non garantisce 
              un uptime del 100%. Interventi di manutenzione programmata saranno comunicati con ragionevole anticipo. 
              In caso di interruzioni non programmate, il Titolare si adopererà per ripristinare il Servizio nel minor tempo possibile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Modifiche ai Termini</h2>
            <p className="text-muted-foreground">
              Il Titolare si riserva il diritto di modificare i presenti Termini in qualsiasi momento. 
              Le modifiche saranno comunicate all'Utente tramite email o notifica nell'applicazione almeno 15 giorni 
              prima della loro entrata in vigore. L'uso continuato del Servizio dopo tale periodo costituisce 
              accettazione delle modifiche.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Legge Applicabile e Foro Competente</h2>
            <p className="text-muted-foreground">
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia derivante 
              dall'interpretazione o esecuzione dei presenti Termini, sarà competente il Foro del luogo di 
              residenza o domicilio dell'Utente consumatore, ai sensi dell'art. 33 del Codice del Consumo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contatti</h2>
            <p className="text-muted-foreground">
              Per qualsiasi domanda o comunicazione relativa ai presenti Termini:<br />
              Email: <strong>supporto@medplannerapp.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Termini;
