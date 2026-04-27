import { useState, useEffect, useMemo } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, TrendingUp, ChevronDown, ChevronUp, Building, Trash2, Target, MapPin, RotateCcw, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Archivio from "@/components/Archivio";

type CycleTargets = { month1: number; month2: number; month3: number };

type Product = {
  id: string;
  name: string;
  cycles: CycleTargets[];
  cycle_targets_override: (number | null)[];
  sold: number;
  company_forecast: number;
};

type MicroareaTarget = {
  id?: string;
  product_id: string;
  microarea: string;
  cycle_index: number;
  month_index: number;
  target: number;
  sold: number;
};

type MicroareaCompanyTarget = {
  id?: string;
  product_id: string;
  microarea: string;
  cycle_index: number;
  company_target: number;
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

  // Microarea targets state
  const [microareas, setMicroareas] = useState<string[]>([]);
  const [maTargets, setMaTargets] = useState<MicroareaTarget[]>([]);
  const [maCompanyTargets, setMaCompanyTargets] = useState<MicroareaCompanyTarget[]>([]);
  const [maSelectedProduct, setMaSelectedProduct] = useState<string>("");
  // Multi-selezione prodotti per la vista "Tabella completa" (es. Broncalt = somma di più prodotti)
  const [maSelectedProductIds, setMaSelectedProductIds] = useState<string[]>([]);
  const [maSelectedMicroarea, setMaSelectedMicroarea] = useState<string>("");
  const [maEditingCycle, setMaEditingCycle] = useState<number>(getCurrentCycleIndex());

  const fetchProducts = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) { console.error(error); return; }
    setProducts((data || []).map(p => ({
      ...p,
      cycles: (p.cycles as unknown as CycleTargets[]) || Array(4).fill(null).map(() => ({ month1: 0, month2: 0, month3: 0 })),
      cycle_targets_override: ((p as any).cycle_targets_override as (number | null)[]) || [null, null, null, null],
    })));
    setLoading(false);
  };

  const fetchMicroareas = async () => {
    if (!user) return;
    const { data } = await supabase.from("microarea_towns").select("microarea");
    const unique = Array.from(new Set((data || []).map((r: any) => r.microarea))).sort();
    setMicroareas(unique);
  };

  const fetchMicroareaTargets = async () => {
    if (!user) return;
    const { data } = await supabase.from("microarea_targets").select("*");
    setMaTargets((data || []) as MicroareaTarget[]);
  };

  const fetchMicroareaCompanyTargets = async () => {
    if (!user) return;
    const { data } = await supabase.from("microarea_company_targets").select("*");
    setMaCompanyTargets((data || []) as MicroareaCompanyTarget[]);
  };

  useEffect(() => { fetchProducts(); fetchMicroareas(); fetchMicroareaTargets(); fetchMicroareaCompanyTargets(); }, [user]);

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
      cycle_targets_override: JSON.parse(JSON.stringify(updated.cycle_targets_override)) as any,
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

  const updateCycleOverride = (productId: string, cycleIdx: number, value: number | null) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newOverride = [...product.cycle_targets_override];
    newOverride[cycleIdx] = value;
    updateProduct({ ...product, cycle_targets_override: newOverride });
  };

  const getCycleMonthsSum = (p: Product, ci: number) => {
    const c = p.cycles[ci];
    return c.month1 + c.month2 + c.month3;
  };

  const getCycleTarget = (p: Product, ci: number) => {
    const o = p.cycle_targets_override?.[ci];
    return o != null ? o : getCycleMonthsSum(p, ci);
  };

  const getCurrentCycleTarget = (p: Product) => getCycleTarget(p, getCurrentCycleIndex());
  const getTotalTarget = (p: Product) => p.cycles.reduce((sum, _, i) => sum + getCycleTarget(p, i), 0);

  // ===== Microarea targets helpers =====
  const getMaCell = (productId: string, microarea: string, ci: number, mi: number): MicroareaTarget => {
    return maTargets.find(t => t.product_id === productId && t.microarea === microarea && t.cycle_index === ci && t.month_index === mi)
      || { product_id: productId, microarea, cycle_index: ci, month_index: mi, target: 0, sold: 0 };
  };

  const upsertMaCell = async (productId: string, microarea: string, ci: number, mi: number, field: "target" | "sold", value: number) => {
    if (!user) return;
    const existing = maTargets.find(t => t.product_id === productId && t.microarea === microarea && t.cycle_index === ci && t.month_index === mi);
    const payload = {
      user_id: user.id,
      product_id: productId,
      microarea,
      cycle_index: ci,
      month_index: mi,
      target: existing?.target ?? 0,
      sold: existing?.sold ?? 0,
      [field]: value,
    };
    const { data, error } = await supabase
      .from("microarea_targets")
      .upsert(payload as any, { onConflict: "user_id,product_id,microarea,cycle_index,month_index" })
      .select()
      .single();
    if (error) { toast.error("Errore salvataggio"); return; }
    setMaTargets(prev => {
      const others = prev.filter(t => !(t.product_id === productId && t.microarea === microarea && t.cycle_index === ci && t.month_index === mi));
      return [...others, data as MicroareaTarget];
    });
  };

  const getCompanyTarget = (productId: string, microarea: string, ci: number): number => {
    return maCompanyTargets.find(t => t.product_id === productId && t.microarea === microarea && t.cycle_index === ci)?.company_target ?? 0;
  };

  const upsertCompanyTarget = async (productId: string, microarea: string, ci: number, value: number) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      product_id: productId,
      microarea,
      cycle_index: ci,
      company_target: value,
    };
    const { data, error } = await supabase
      .from("microarea_company_targets")
      .upsert(payload as any, { onConflict: "user_id,product_id,microarea,cycle_index" })
      .select()
      .single();
    if (error) { toast.error("Errore salvataggio obiettivo aziendale"); return; }
    setMaCompanyTargets(prev => {
      const others = prev.filter(t => !(t.product_id === productId && t.microarea === microarea && t.cycle_index === ci));
      return [...others, data as MicroareaCompanyTarget];
    });
  };

  const cycleMaTotals = useMemo(() => {
    if (!maSelectedProduct || !maSelectedMicroarea) return { target: 0, sold: 0 };
    let target = 0, sold = 0;
    for (let mi = 0; mi < 3; mi++) {
      const c = getMaCell(maSelectedProduct, maSelectedMicroarea, maEditingCycle, mi);
      target += c.target; sold += c.sold;
    }
    return { target, sold };
  }, [maTargets, maSelectedProduct, maSelectedMicroarea, maEditingCycle]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
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

      <Tabs defaultValue="prodotti" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-xl mb-4">
          <TabsTrigger value="prodotti" className="rounded-lg">Prodotti</TabsTrigger>
          <TabsTrigger value="microaree" className="rounded-lg">Obiettivi Microaree</TabsTrigger>
          <TabsTrigger value="archivio" className="rounded-lg">Archivio</TabsTrigger>
        </TabsList>

        {/* ============== TAB PRODOTTI ============== */}
        <TabsContent value="prodotti" className="space-y-3 mt-0">
          {products.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Nessun prodotto</div>}
          {products.map((p, i) => {
            const cycleTarget = getCurrentCycleTarget(p);
            const pct = cycleTarget > 0 ? Math.min(100, Math.round((p.sold / cycleTarget) * 100)) : 0;
            const isComplete = pct >= 100;
            const isExpanded = expandedId === p.id;
            const monthsSum = getCycleMonthsSum(p, editingCycle);
            const overrideVal = p.cycle_targets_override?.[editingCycle];
            const displayTotal = overrideVal != null ? overrideVal : monthsSum;

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

                    {/* Totale obiettivo ciclo - auto-calcolato modificabile */}
                    <div className="bg-accent/40 rounded-xl p-3 mb-3 border border-accent">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs flex items-center gap-1 font-medium">
                          <Target className="h-3 w-3" /> Totale obiettivo Ciclo {editingCycle + 1}
                        </Label>
                        {overrideVal != null && (
                          <button
                            onClick={() => updateCycleOverride(p.id, editingCycle, null)}
                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                            title="Ripristina somma mensile"
                          >
                            <RotateCcw className="h-3 w-3" /> Auto
                          </button>
                        )}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={displayTotal}
                        onChange={(e) => updateCycleOverride(p.id, editingCycle, Number(e.target.value) || 0)}
                        className="rounded-lg h-9 text-sm font-semibold"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {overrideVal != null
                          ? `Manuale (somma mesi: ${monthsSum})`
                          : "Auto-calcolato dalla somma dei mesi (modificabile)"}
                      </p>
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
                        <span>Somma mesi: {monthsSum} pz</span>
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
        </TabsContent>

        {/* ============== TAB MICROAREE ============== */}
        <TabsContent value="microaree" className="space-y-4 mt-0">
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Aggiungi prima un prodotto</div>
          ) : microareas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aggiungi prima delle microaree in Impostazioni
            </div>
          ) : (
            <Tabs defaultValue="rapido" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl mb-3">
                <TabsTrigger value="rapido" className="rounded-lg text-xs">Inserimento rapido</TabsTrigger>
                <TabsTrigger value="tabella" className="rounded-lg text-xs">Tabella completa</TabsTrigger>
              </TabsList>

              {/* ===== INSERIMENTO RAPIDO ===== */}
              <TabsContent value="rapido" className="space-y-3 mt-0">
                <div className="glass rounded-2xl shadow-soft p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs mb-1 block">Prodotto</Label>
                      <Select value={maSelectedProduct} onValueChange={setMaSelectedProduct}>
                        <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block flex items-center gap-1"><MapPin className="h-3 w-3" /> Microarea</Label>
                      <Select value={maSelectedMicroarea} onValueChange={setMaSelectedMicroarea}>
                        <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                        <SelectContent>
                          {microareas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {maSelectedProduct && maSelectedMicroarea ? (
                    <>
                      <div className="flex gap-1">
                        {cycleLabels.map((_, ci) => (
                          <button key={ci} onClick={() => setMaEditingCycle(ci)}
                            className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${maEditingCycle === ci ? "bg-primary text-primary-foreground font-medium" : "bg-secondary text-muted-foreground"}`}>
                            Ciclo {ci + 1}
                          </button>
                        ))}
                      </div>

                      {(() => {
                        const companyT = getCompanyTarget(maSelectedProduct, maSelectedMicroarea, maEditingCycle);
                        const sold = cycleMaTotals.sold;
                        const remaining = Math.max(0, companyT - sold);
                        const pct = companyT > 0 ? Math.min(100, Math.round((sold / companyT) * 100)) : 0;
                        return (
                          <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 space-y-2">
                            <Label className="text-xs flex items-center gap-1 font-medium">
                              <Building className="h-3 w-3" /> Obiettivo azienda – Ciclo {maEditingCycle + 1}
                            </Label>
                            <Input type="number" min={0} value={companyT}
                              onChange={(e) => upsertCompanyTarget(maSelectedProduct, maSelectedMicroarea, maEditingCycle, Number(e.target.value) || 0)}
                              className="rounded-lg h-10 text-base font-semibold text-center"
                              placeholder="Pz richiesti dall'azienda" />
                            {companyT > 0 && (
                              <>
                                <Progress value={pct} className="h-2 rounded-full" />
                                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                                  <div className="text-center"><p className="text-muted-foreground">Obiettivo</p><p className="font-semibold">{companyT}</p></div>
                                  <div className="text-center"><p className="text-muted-foreground">Venduti</p><p className="font-semibold text-success">{sold}</p></div>
                                  <div className="text-center"><p className="text-muted-foreground">Mancano</p><p className="font-semibold text-primary">{remaining}</p></div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}

                      {/* Solo venduti per mese */}
                      <div className="bg-secondary/50 rounded-xl p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Pezzi venduti nel mese</p>
                        <div className="grid grid-cols-3 gap-2">
                          {cycleLabels[maEditingCycle].map((monthName, mi) => {
                            const cell = getMaCell(maSelectedProduct, maSelectedMicroarea, maEditingCycle, mi);
                            return (
                              <div key={monthName} className="text-center">
                                <p className="text-[11px] text-muted-foreground mb-1 font-medium">{monthName}</p>
                                <Input type="number" min={0} value={cell.sold}
                                  onChange={(e) => upsertMaCell(maSelectedProduct, maSelectedMicroarea, maEditingCycle, mi, "sold", Number(e.target.value) || 0)}
                                  className="rounded-lg text-center h-9 text-sm" />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center mt-2">
                          Totale ciclo: <b>{cycleMaTotals.sold}</b> pz
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Seleziona prodotto e microarea
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* ===== TABELLA COMPLETA ===== */}
              <TabsContent value="tabella" className="space-y-3 mt-0">
                <div className="glass rounded-2xl shadow-soft p-4 space-y-3">
                  <div>
                    <Label className="text-xs mb-1 block">Prodotti (puoi selezionarne più di uno per sommarli)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between rounded-xl h-9 text-sm font-normal">
                          <span className="truncate text-left">
                            {maSelectedProductIds.length === 0
                              ? "Seleziona prodotti"
                              : maSelectedProductIds.length === 1
                                ? products.find(p => p.id === maSelectedProductIds[0])?.name
                                : `${maSelectedProductIds.length} prodotti selezionati`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-2 rounded-xl" align="start">
                        <div className="flex items-center justify-between px-1 py-1 mb-1">
                          <button
                            type="button"
                            onClick={() => setMaSelectedProductIds(products.map(p => p.id))}
                            className="text-[11px] text-primary hover:underline"
                          >Seleziona tutti</button>
                          <button
                            type="button"
                            onClick={() => setMaSelectedProductIds([])}
                            className="text-[11px] text-muted-foreground hover:underline"
                          >Deseleziona</button>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {products.map(p => {
                            const checked = maSelectedProductIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary cursor-pointer text-sm">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    setMaSelectedProductIds(prev =>
                                      v ? [...prev, p.id] : prev.filter(id => id !== p.id)
                                    );
                                  }}
                                />
                                <span className="flex-1">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {maSelectedProductIds.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Seleziona uno o più prodotti per vedere la tabella</p>
                  ) : (
                    <div className="overflow-x-auto -mx-4 px-4">
                      {maSelectedProductIds.length > 1 && (
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Visualizzazione aggregata di <b>{maSelectedProductIds.length}</b> prodotti. Le modifiche vengono applicate al primo prodotto selezionato (in ordine alfabetico).
                        </p>
                      )}
                      <table className="w-full text-xs border-separate border-spacing-y-1">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left font-medium px-2 py-1 sticky left-0 bg-background">Microarea</th>
                            {cycleLabels.map((_, ci) => (
                              <th key={ci} colSpan={2} className="text-center font-medium px-2 py-1 border-l border-border">
                                Ciclo {ci + 1}
                              </th>
                            ))}
                          </tr>
                          <tr className="text-[10px] text-muted-foreground">
                            <th className="sticky left-0 bg-background"></th>
                            {cycleLabels.map((_, ci) => (
                              <>
                                <th key={`o-${ci}`} className="font-normal px-1 border-l border-border">Obiettivo</th>
                                <th key={`v-${ci}`} className="font-normal px-1">Venduti</th>
                                <th key={`m-${ci}`} className="font-normal px-1">Mancano</th>
                              </>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {microareas.map(ma => {
                            let totObj = 0, totVen = 0;
                            const singleId = maSelectedProductIds.length === 1 ? maSelectedProductIds[0] : null;
                            return (
                              <tr key={ma}>
                                <td className="font-medium px-2 py-1 sticky left-0 bg-background whitespace-nowrap">{ma}</td>
                                {cycleLabels.map((_, ci) => {
                                  const obj = maSelectedProductIds.reduce(
                                    (s, pid) => s + getCompanyTarget(pid, ma, ci), 0
                                  );
                                  const ven = maSelectedProductIds.reduce(
                                    (s, pid) => s + [0, 1, 2].reduce((ss, mi) => ss + getMaCell(pid, ma, ci, mi).sold, 0),
                                    0
                                  );
                                  totObj += obj; totVen += ven;
                                  const pct = obj > 0 ? Math.round((ven / obj) * 100) : 0;
                                  const missing = Math.max(0, obj - ven);
                                  return (
                                    <>
                                      <td key={`o-${ci}`} className="px-1 border-l border-border">
                                        <Input
                                          type="number" min={0} value={obj}
                                          onChange={(e) => {
                                            const newTotal = Number(e.target.value) || 0;
                                            const delta = newTotal - obj;
                                            const targetPid = singleId ?? maSelectedProductIds[0];
                                            const current = getCompanyTarget(targetPid, ma, ci);
                                            upsertCompanyTarget(targetPid, ma, ci, Math.max(0, current + delta));
                                          }}
                                          className={`rounded-md h-8 text-xs text-center px-1 w-16 ${!singleId ? "border-primary/40" : ""}`}
                                        />
                                      </td>
                                      <td key={`v-${ci}`} className="px-1">
                                        <div className={`text-center text-xs font-semibold rounded-md py-1.5 ${obj > 0 && pct >= 100 ? "bg-success/10 text-success" : obj > 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                                          {ven}{obj > 0 && <span className="text-[9px] font-normal opacity-70"> / {pct}%</span>}
                                        </div>
                                      </td>
                                      <td key={`m-${ci}`} className="px-1">
                                        <div className={`text-center text-xs font-semibold rounded-md py-1.5 ${obj === 0 ? "bg-secondary text-muted-foreground" : missing === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                                          {obj === 0 ? "—" : missing}
                                        </div>
                                      </td>
                                    </>
                                  );
                                })}
                              </tr>
                            );
                          })}
                          {/* Riga totale */}
                          {(() => {
                            const totals = cycleLabels.map((_, ci) => {
                              let o = 0, v = 0;
                              microareas.forEach(ma => {
                                maSelectedProductIds.forEach(pid => {
                                  o += getCompanyTarget(pid, ma, ci);
                                  v += [0, 1, 2].reduce((s, mi) => s + getMaCell(pid, ma, ci, mi).sold, 0);
                                });
                              });
                              return { o, v, m: Math.max(0, o - v) };
                            });
                            return (
                              <tr className="font-semibold">
                                <td className="px-2 py-1 sticky left-0 bg-background text-primary">TOTALE</td>
                                {totals.map((t, ci) => (
                                  <>
                                    <td key={`to-${ci}`} className="px-1 border-l border-border text-center text-xs py-2">{t.o}</td>
                                    <td key={`tv-${ci}`} className="px-1 text-center text-xs py-2 text-success">{t.v}</td>
                                    <td key={`tm-${ci}`} className="px-1 text-center text-xs py-2 text-warning">{t.o === 0 ? "—" : t.m}</td>
                                  </>
                                ))}
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                      <p className="text-[10px] text-muted-foreground text-center mt-3">
                        I venduti vengono dalla somma dei mesi inseriti in "Inserimento rapido". In modalità aggregata, le modifiche all'obiettivo vengono applicate al primo prodotto selezionato.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* ============== TAB ARCHIVIO ============== */}
        <TabsContent value="archivio" className="mt-0">
          <Archivio />
        </TabsContent>
      </Tabs>
    </div>
  );
}
