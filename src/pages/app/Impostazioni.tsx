import { ArrowLeft, Check, LogOut, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Impostazioni() {
  const navigate = useNavigate();
  const { accentHsl, setAccentHsl, colors } = useAccentColor();
  const { user, signOut } = useAuth();
  const { status, planType } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-5 shadow-soft mb-6">
        <h2 className="font-semibold mb-4">Profilo</h2>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Nome</Label><Input defaultValue="Marco Informatore" className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input defaultValue="marco@esempio.it" className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>Zona</Label><Input defaultValue="Lombardia" className="rounded-xl" /></div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold mb-4">Colore Accento</h2>
        <div className="grid grid-cols-4 gap-3">
          {colors.map(c => (
            <button
              key={c.hsl}
              onClick={() => setAccentHsl(c.hsl)}
              className={cn(
                "h-12 rounded-xl transition-all flex items-center justify-center",
                accentHsl === c.hsl ? "ring-2 ring-offset-2 ring-foreground scale-105" : "hover:scale-105"
              )}
              style={{ backgroundColor: `hsl(${c.hsl})` }}
              title={c.name}
            >
              {accentHsl === c.hsl && <Check className="h-5 w-5" style={{ color: "white" }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Abbonamento */}
      <div className="glass rounded-2xl p-5 shadow-soft mt-6">
        <h2 className="font-semibold mb-4">Abbonamento</h2>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Stato</p>
            <p className="font-medium capitalize">{status === "grace_period" ? "Periodo di prova" : status}</p>
          </div>
          {planType && (
            <div>
              <p className="text-sm text-muted-foreground">Piano</p>
              <p className="font-medium capitalize">{planType}</p>
            </div>
          )}
        </div>
        {(status === "active" || status === "trialing") && (
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            {portalLoading ? "Caricamento..." : "Gestisci Abbonamento"}
          </button>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20"
      >
        <LogOut className="h-4 w-4" />
        Esci
      </button>
    </div>
  );
}
