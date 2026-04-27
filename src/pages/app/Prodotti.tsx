import { useState, useEffect, useMemo } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Plus, TrendingUp, ChevronDown, ChevronUp, Building, Trash2, Target, MapPin, RotateCcw, Upload, Sparkles, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  const [maSelectedMicroarea, setMaSelectedMicroarea] = useState<string>("");
  const [maEditingCycle, setMaEditingCycle] = useState<number>(getCurrentCycleIndex());

  // ===== AI Excel import state =====
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importFileName, setImportFileName] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!canEdit) { toast.error("Abbonamento scaduto."); return; }
    if (microareas.length === 0) { toast.error("Aggiungi prima delle microaree in Impostazioni"); return; }
    if (products.length === 0) { toast.error("Aggiungi prima dei prodotti"); return; }

    setImporting(true);
    setImportFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const fileBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("import-company-excel", {
        body: {
          fileBase64,
          fileName: file.name,
          microareas,
          products: products.map(p => ({ id: p.id, name: p.name })),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const rows = (data as any).rows || [];
      if (rows.length === 0) {
        toast.warning("Nessun dato trovato per le tue microaree");
        setImportPreview(null);
      } else {
        setImportPreview(rows);
        setSelectedRows(new Set(rows.map((_: any, i: number) => i)));
        toast.success(`${rows.length} righe estratte`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Errore importazione");
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = async () => {
    if (!importPreview || !user) return;
    const rowsToImport = importPreview.filter((_, i) => selectedRows.has(i));
    if (rowsToImport.length === 0) { toast.error("Nessuna riga selezionata"); return; }

    let okCount = 0;
    for (const r of rowsToImport) {
      try {
        if (r.company_target != null) {
          await supabase.from("microarea_company_targets").upsert({
            user_id: user.id,
            product_id: r.product_id,
            microarea: r.microarea,
            cycle_index: r.cycle_index,
            company_target: r.company_target,
          }, { onConflict: "user_id,product_id,microarea,cycle_index" });
        }
        if (Array.isArray(r.monthly_sold)) {
          for (let mi = 0; mi < 3; mi++) {
            const v = r.monthly_sold[mi];
            if (v == null) continue;
            const existing = maTargets.find(t => t.product_id === r.product_id && t.microarea === r.microarea && t.cycle_index === r.cycle_index && t.month_index === mi);
            await supabase.from("microarea_targets").upsert({
              user_id: user.id,
              product_id: r.product_id,
              microarea: r.microarea,
              cycle_index: r.cycle_index,
              month_index: mi,
              target: existing?.target ?? 0,
              sold: v,
            }, { onConflict: "user_id,product_id,microarea,cycle_index,month_index" });
          }
        }
        okCount++;
      } catch (e) { console.error(e); }
    }
    toast.success(`Importate ${okCount} righe`);
    setImportPreview(null);
    setSelectedRows(new Set());
    fetchMicroareaTargets();
    fetchMicroareaCompanyTargets();
  };

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
        <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
          <TabsTrigger value="prodotti" className="rounded-lg">Prodotti</TabsTrigger>
          <TabsTrigger value="microaree" className="rounded-lg">Obiettivi Microaree</TabsTrigger>
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
          {/* AI Excel Import */}
          {products.length > 0 && microareas.length > 0 && (
            <div className="glass rounded-2xl shadow-soft p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm">Importa da Excel aziendale (AI)</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Carica il file Excel dell'azienda. L'AI estrarrà solo i dati delle tue microaree ({microareas.join(", ")}).
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  disabled={importing}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                  disabled={importing}
                  asChild
                >
                  <span>
                    {importing ? (
                      <><div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /> Analisi in corso...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Carica file Excel</>
                    )}
                  </span>
                </Button>
              </label>

              {importPreview && importPreview.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Anteprima ({importPreview.length} righe da {importFileName})</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedRows(new Set(importPreview.map((_, i) => i)))}
                        className="text-[10px] text-primary hover:underline"
                      >Tutte</button>
                      <span className="text-[10px] text-muted-foreground">|</span>
                      <button
                        onClick={() => setSelectedRows(new Set())}
                        className="text-[10px] text-muted-foreground hover:underline"
                      >Nessuna</button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                    {importPreview.map((r, i) => {
                      const prod = products.find(p => p.id === r.product_id);
                      const isSel = selectedRows.has(i);
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            const ns = new Set(selectedRows);
                            if (isSel) ns.delete(i); else ns.add(i);
                            setSelectedRows(ns);
                          }}
                          className={`text-[11px] p-2 rounded-lg cursor-pointer flex items-start gap-2 ${isSel ? "bg-primary/10 border border-primary/30" : "bg-secondary/40 border border-transparent"}`}
                        >
                          <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isSel ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                            {isSel && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{prod?.name || r.product_name}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-primary font-medium">{r.microarea}</span>
                              <span className="text-muted-foreground">·</span>
                              <span>Ciclo {r.cycle_index + 1}</span>
                            </div>
                            <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                              {r.company_target != null && <span>🎯 Obiettivo: <b>{r.company_target}</b></span>}
                              {Array.isArray(r.monthly_sold) && r.monthly_sold.some((v: any) => v != null) && (
                                <span>📦 Venduti: {r.monthly_sold.map((v: any) => v ?? "-").join(" / ")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { setImportPreview(null); setSelectedRows(new Set()); }}
                      variant="outline"
                      className="flex-1 rounded-xl gap-1"
                    ><X className="h-4 w-4" /> Annulla</Button>
                    <Button
                      onClick={confirmImport}
                      className="flex-1 rounded-xl gap-1"
                      disabled={selectedRows.size === 0}
                    ><Check className="h-4 w-4" /> Importa {selectedRows.size}</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Aggiungi prima un prodotto</div>
          ) : microareas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aggiungi prima delle microaree in Impostazioni
            </div>
          ) : (
            <>
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

                {maSelectedProduct && maSelectedMicroarea && (
                  <>
                    <div className="flex gap-1">
                      {cycleLabels.map((_, ci) => (
                        <button key={ci} onClick={() => setMaEditingCycle(ci)}
                          className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${maEditingCycle === ci ? "bg-primary text-primary-foreground font-medium" : "bg-secondary text-muted-foreground"}`}>
                          Ciclo {ci + 1}
                        </button>
                      ))}
                    </div>

                    {/* Riepilogo ciclo */}
                    {(() => {
                      const pct = cycleMaTotals.target > 0 ? Math.min(100, Math.round((cycleMaTotals.sold / cycleMaTotals.target) * 100)) : 0;
                      const remaining = Math.max(0, cycleMaTotals.target - cycleMaTotals.sold);
                      return (
                        <div className="bg-accent/40 rounded-xl p-3 border border-accent">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Riepilogo Ciclo {maEditingCycle + 1}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2 rounded-full mb-2" />
                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div className="text-center">
                              <p className="text-muted-foreground">Target</p>
                              <p className="font-semibold">{cycleMaTotals.target}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Venduti</p>
                              <p className="font-semibold text-success">{cycleMaTotals.sold}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Mancano</p>
                              <p className="font-semibold text-primary">{remaining}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Obiettivo aziendale per microarea+ciclo */}
                    {(() => {
                      const companyT = getCompanyTarget(maSelectedProduct, maSelectedMicroarea, maEditingCycle);
                      const sold = cycleMaTotals.sold;
                      const remainingCo = Math.max(0, companyT - sold);
                      const pctCo = companyT > 0 ? Math.min(100, Math.round((sold / companyT) * 100)) : 0;
                      return (
                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs flex items-center gap-1 font-medium">
                              <Building className="h-3 w-3" /> Obiettivo aziendale Ciclo {maEditingCycle + 1}
                            </Label>
                            {companyT > 0 && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pctCo >= 100 ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{pctCo}%</span>
                            )}
                          </div>
                          <Input
                            type="number"
                            min={0}
                            value={companyT}
                            onChange={(e) => upsertCompanyTarget(maSelectedProduct, maSelectedMicroarea, maEditingCycle, Number(e.target.value) || 0)}
                            className="rounded-lg h-9 text-sm font-semibold mb-2"
                            placeholder="Pz richiesti dall'azienda"
                          />
                          {companyT > 0 && (
                            <>
                              <Progress value={pctCo} className="h-2 rounded-full mb-2" />
                              <div className="grid grid-cols-3 gap-2 text-[11px]">
                                <div className="text-center">
                                  <p className="text-muted-foreground">Obiettivo</p>
                                  <p className="font-semibold">{companyT}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-muted-foreground">Venduti</p>
                                  <p className="font-semibold text-success">{sold}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-muted-foreground">Mancano</p>
                                  <p className="font-semibold text-primary">{remainingCo}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {/* Tabella mensile */}
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="grid grid-cols-[1fr,1fr,1fr] gap-2 mb-2 text-[10px] text-muted-foreground font-medium px-1">
                        <span>Mese</span>
                        <span className="text-center">Target</span>
                        <span className="text-center">Venduti</span>
                      </div>
                      <div className="space-y-2">
                        {cycleLabels[maEditingCycle].map((monthName, mi) => {
                          const cell = getMaCell(maSelectedProduct, maSelectedMicroarea, maEditingCycle, mi);
                          const pct = cell.target > 0 ? Math.min(100, Math.round((cell.sold / cell.target) * 100)) : 0;
                          return (
                            <div key={monthName} className="bg-background/50 rounded-lg p-2">
                              <div className="grid grid-cols-[1fr,1fr,1fr] gap-2 items-center">
                                <span className="text-xs font-medium">{monthName}</span>
                                <Input type="number" min={0} value={cell.target}
                                  onChange={(e) => upsertMaCell(maSelectedProduct, maSelectedMicroarea, maEditingCycle, mi, "target", Number(e.target.value) || 0)}
                                  className="rounded-lg text-center h-8 text-sm" />
                                <Input type="number" min={0} value={cell.sold}
                                  onChange={(e) => upsertMaCell(maSelectedProduct, maSelectedMicroarea, maEditingCycle, mi, "sold", Number(e.target.value) || 0)}
                                  className="rounded-lg text-center h-8 text-sm" />
                              </div>
                              {cell.target > 0 && (
                                <div className="mt-1.5">
                                  <Progress value={pct} className="h-1 rounded-full" />
                                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">{pct}%</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {(!maSelectedProduct || !maSelectedMicroarea) && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Seleziona prodotto e microarea per gestire gli obiettivi
                  </p>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
