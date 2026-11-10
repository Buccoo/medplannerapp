import { useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Package, ChevronRight, BarChart3, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Calendar, title: "Agenda Smart", desc: "Organizza visite e appuntamenti con un calendario intuitivo." },
  { icon: Users, title: "Rubrica Medici", desc: "Gestisci il tuo portfolio clienti con schede dettagliate." },
  { icon: Package, title: "Catalogo Prodotti", desc: "Monitora obiettivi di vendita e performance in tempo reale." },
  { icon: BarChart3, title: "Dashboard", desc: "Panoramica istantanea su visite, target e risultati." },
  { icon: Shield, title: "Dati Sicuri", desc: "I tuoi dati professionali sempre protetti e sincronizzati." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen gradient-hero">
      {/* Nav */}
      <nav className="glass-strong sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-gradient">Med</span>Planner
        </span>
        <div className="flex gap-3">
          {!loading && user ? (
            <Button size="sm" className="shadow-glow" onClick={() => navigate("/app")}>Vai all'App</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Accedi</Button>
              <Button size="sm" className="shadow-glow" onClick={() => navigate("/login?mode=register")}>Inizia Gratis</Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-20 pb-16 text-center max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <span>✨</span> Il tuo assistente ISF
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
            Organizza le tue visite.<br />
            <span className="text-gradient">Raggiungi i tuoi obiettivi.</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            MedPlanner è l'app pensata per l'Informatore Scientifico del Farmaco: gestisci medici, farmacie e target di vendita in un'unica interfaccia elegante.
          </p>
          <div className="flex gap-3 justify-center">
            {!loading && user ? (
              <Button size="lg" className="shadow-glow text-base px-8" onClick={() => navigate("/app")}>
                Vai all'App <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button size="lg" className="shadow-glow text-base px-8" onClick={() => navigate("/login?mode=register")}>
                  Inizia Ora <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base" onClick={() => navigate("/login")}>Accedi</Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="glass rounded-2xl p-6 shadow-soft hover:shadow-glow transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
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
