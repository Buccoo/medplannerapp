import { useState, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, TrendingUp, ChevronDown, ChevronUp, Building, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type CycleTargets = { month1: number; month2: number; month3: number };

type Product = {
  id: string;
  name: string;
  cycles: CycleTargets[];
  sold: number;
  company_forecast: number;
};

const cycleLabels = [["Gen", "Feb", "Mar"], ["Apr", "Mag", "Giu"], ["Lug", "Ago", "Set"], ["Ott", "Nov", "Dic"]];

function getCurrentCycleIndex(): number {
  return Math.floor(new Date().getMonth() / 3);
}

export default function Prodotti() {
  const { canEdit } = useSubscription();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCycle, setEditingCycle] = useState<number>(getCurrentCycleIndex());
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) { console.error(error); return; }
    setProducts((data || []).map(p => ({
      ...p,
      cycles: (p.cycles as unknown as CycleTargets[]) || Array(4).fill(null).map(() => ({ month1: 0, month2: 0, month3: 0 })),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const emptyCycles = Array(4).fill(null).map(() => ({ month1: 0, month2: 0, month3: 0 }));
    const { error } = await supabase.from("products").insert({
      user_id: user.id,
      name: fd.get("name") as string,
      sold: Number(fd.get("sold") || 0),
      company_forecast: Number(fd.get("forecast") || 0),
      cycles: emptyCycles,
    });
    if (error) { toast.error("Errore nel salvataggio"); return; }
    setOpen(false);
    toast.success("Prodotto aggiunto");
    fetchProducts();
  };

  const updateProduct = async (updated: Product) => {
    const { error } = await supabase.from("products").update({
      name: updated.name,
      cycles: JSON.parse(JSON.stringify(updated.cycles)),
      sold: updated.sold,
      company_forecast: updated.company_forecast,
    }).eq("id", updated.id);
    if (error) { toast.error("Errore nel salvataggio"); return; }
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const updateCycleTarget = (productId: string, cycleIdx: number, monthKey: keyof CycleTargets, value: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newCycles = [...product.cycles];
    newCycles[cycleIdx] = { ...newCycles[cycleIdx], [monthKey]: value };
    updateProduct({ ...product, cycles: newCycles });
  };

  const getCurrentCycleTarget = (p: Product) => {
    const ci = getCurrentCycleIndex();
    const c = p.cycles[ci];
    return c.month1 + c.month2 + c.month3;
  };

  const getTotalTarget = (p: Product) => p.cycles.reduce((sum, c) => sum + c.month1 + c.month2 + c.month3, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prodotti</h1>
        <Dialog open={open} onOpenChange={(v) => { if (v && !canEdit) { toast.error("Abbonamento scaduto. Rinnova per aggiungere dati."); return; } setOpen(v); }}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Nuovo Prodotto</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Nome Prodotto</Label><Input name="name" required className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Venduti ad oggi</Label><Input name="sold" type="number" defaultValue={0} className="rounded-xl" /></div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Building className="h-3 w-3" /> Totale previsto azienda</Label>
                <Input name="forecast" type="number" defaultValue={0} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl">Aggiungi</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {products.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Nessun prodotto</div>}
        {products.map((p, i) => {
          const cycleTarget = getCurrentCycleTarget(p);
          const pct = cycleTarget > 0 ? Math.min(100, Math.round((p.sold / cycleTarget) * 100)) : 0;
          const isComplete = pct >= 100;
          const isExpanded = expandedId === p.id;

          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl shadow-soft overflow-hidden">
              <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{p.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isComplete ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{pct}%</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                <Progress value={pct} className="h-2 rounded-full mb-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{p.sold} venduti</span>
                  <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />Target ciclo: {cycleTarget}</span>
                </div>
                {p.company_forecast > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <Building className="h-3 w-3" /> Previsto azienda: {p.company_forecast} pz
                  </div>
                )}
              </div>

              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-4 pb-4">
                  <div className="flex items-center gap-3 mb-3 bg-primary/5 rounded-xl p-3">
                    <Building className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Totale previsto azienda</p>
                      <Input type="number" min={0} value={p.company_forecast}
                        onChange={(e) => updateProduct({ ...p, company_forecast: Number(e.target.value) || 0 })}
                        className="rounded-lg h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {cycleLabels.map((_, ci) => (
                      <button key={ci} onClick={() => setEditingCycle(ci)}
                        className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${editingCycle === ci ? "bg-primary text-primary-foreground font-medium" : "bg-secondary text-muted-foreground"}`}>
                        Ciclo {ci + 1}
                      </button>
                    ))}
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {cycleLabels[editingCycle].map((monthName, mi) => {
                        const monthKey = `month${mi + 1}` as keyof CycleTargets;
                        return (
                          <div key={monthName} className="text-center">
                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">{monthName}</p>
                            <Input type="number" min={0} value={p.cycles[editingCycle][monthKey]}
                              onChange={(e) => updateCycleTarget(p.id, editingCycle, monthKey, Number(e.target.value) || 0)}
                              className="rounded-lg text-center h-9 text-sm" />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-3 text-xs text-muted-foreground border-t border-border pt-2">
                      <span>Totale ciclo: {p.cycles[editingCycle].month1 + p.cycles[editingCycle].month2 + p.cycles[editingCycle].month3} pz</span>
                      <span>Totale anno: {getTotalTarget(p)} pz</span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full rounded-xl gap-2 mt-3"><Trash2 className="h-4 w-4" /> Elimina Prodotto</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare {p.name}?</AlertDialogTitle>
                        <AlertDialogDescription>Questa azione è irreversibile.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl" onClick={async () => {
                          await supabase.from("products").delete().eq("id", p.id);
                          setProducts(prev => prev.filter(pr => pr.id !== p.id));
                          setExpandedId(null);
                          toast.success("Prodotto eliminato");
                        }}>Elimina</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
