import { useEffect, useState } from "react";
import { ArrowLeft, Check, LogOut, CreditCard, Save, Plus, X, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MICROAREAS = ["LE07", "LE08", "LE09", "LE10", "LE11", "LE12", "LE13"];

export default function Impostazioni() {
  const navigate = useNavigate();
  const { accentHsl, setAccentHsl, colors } = useAccentColor();
  const { user, signOut } = useAuth();
  const { status, planType } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [zona, setZona] = useState("");
  const [saving, setSaving] = useState(false);

  // Microarea towns state
  const [microareaTowns, setMicroareaTowns] = useState<Record<string, { id: string; town: string }[]>>({});
  const [newTownInputs, setNewTownInputs] = useState<Record<string, string>>({});
  const [expandedMicroarea, setExpandedMicroarea] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name || "");
        setZona(data.zona || "");
      }
    });
    fetchMicroareaTowns();
  }, [user]);

  const fetchMicroareaTowns = async () => {
    if (!user) return;
    const { data } = await supabase.from("microarea_towns").select("*").eq("user_id", user.id).order("town");
    if (!data) return;
    const grouped: Record<string, { id: string; town: string }[]> = {};
    MICROAREAS.forEach(m => grouped[m] = []);
    data.forEach(row => {
      if (!grouped[row.microarea]) grouped[row.microarea] = [];
      grouped[row.microarea].push({ id: row.id, town: row.town });
    });
    setMicroareaTowns(grouped);
  };

  const addTown = async (microarea: string) => {
    const town = (newTownInputs[microarea] || "").trim();
    if (!town || !user) return;
    const { error } = await supabase.from("microarea_towns").insert({ user_id: user.id, microarea, town });
    if (error) {
      if (error.code === "23505") toast.error("Paese già presente");
      else toast.error("Errore");
      return;
    }
    setNewTownInputs(prev => ({ ...prev, [microarea]: "" }));
    fetchMicroareaTowns();
    toast.success(`${town} aggiunto a ${microarea}`);
  };

  const removeTown = async (id: string) => {
    await supabase.from("microarea_towns").delete().eq("id", id);
    fetchMicroareaTowns();
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      display_name: displayName,
      zona: zona,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error("Errore nel salvataggio"); return; }
    toast.success("Impostazioni salvate");
  };

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
    <div className="px-5 pt-6 pb-24">
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
          <div className="space-y-1.5"><Label>Nome</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="rounded-xl" placeholder="Il tuo nome" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email || ""} disabled className="rounded-xl opacity-60" /></div>
          <div className="space-y-1.5"><Label>Zona</Label><Input value={zona} onChange={e => setZona(e.target.value)} className="rounded-xl" placeholder="es. Lombardia" /></div>
          <Button onClick={saveSettings} disabled={saving} className="w-full rounded-xl gap-2">
            <Save className="h-4 w-4" /> {saving ? "Salvataggio..." : "Salva Profilo"}
          </Button>
        </div>
      </div>

      {/* Microaree */}
      <div className="glass rounded-2xl p-5 shadow-soft mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Microaree
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Associa i paesi a ciascuna microarea. Questi verranno utilizzati nei filtri dell'agenda e dell'anagrafica medici.</p>
        <div className="space-y-2">
          {MICROAREAS.map(m => {
            const towns = microareaTowns[m] || [];
            const isExpanded = expandedMicroarea === m;
            return (
              <div key={m} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedMicroarea(isExpanded ? null : m)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm text-primary shrink-0">{m}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {towns.length > 0 ? towns.map(t => t.town).join(", ") : "Nessun paese"}
                    </span>
                  </div>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full shrink-0">{towns.length}</span>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t space-y-3">
                    {towns.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {towns.map(t => (
                          <span key={t.id} className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-full text-xs font-medium">
                            {t.town}
                            <button onClick={() => removeTown(t.id)} className="h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center">
                              <X className="h-3 w-3 text-destructive" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={newTownInputs[m] || ""}
                        onChange={e => setNewTownInputs(prev => ({ ...prev, [m]: e.target.value }))}
                        placeholder="Aggiungi paese..."
                        className="rounded-xl text-sm"
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTown(m); } }}
                      />
                      <Button size="sm" onClick={() => addTown(m)} className="rounded-xl shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold mb-4">Colore Accento</h2>
        <div className="grid grid-cols-4 gap-3">
          {colors.map(c => (
            <button key={c.hsl} onClick={() => setAccentHsl(c.hsl)}
              className={cn("h-12 rounded-xl transition-all flex items-center justify-center", accentHsl === c.hsl ? "ring-2 ring-offset-2 ring-foreground scale-105" : "hover:scale-105")}
              style={{ backgroundColor: `hsl(${c.hsl})` }} title={c.name}>
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
          <button onClick={openPortal} disabled={portalLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50">
            <CreditCard className="h-4 w-4" />
            {portalLoading ? "Caricamento..." : "Gestisci Abbonamento"}
          </button>
        )}
      </div>

      {/* Logout */}
      <button onClick={signOut}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20">
        <LogOut className="h-4 w-4" /> Esci
      </button>
    </div>
  );
}