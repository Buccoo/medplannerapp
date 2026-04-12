import { useState, useEffect, useRef } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Search, Plus, Phone, MapPin, Clock, Calendar, Trash2, Pencil, Check, X, Sparkles, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const weekDays = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"];
const specialties = ["MMG", "PED", "ORL", "GIN", "INT", "GASTRO"];
const emptyHours = () => Object.fromEntries(weekDays.map(d => [d, ""]));

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  paese: string;
  microarea: string;
  phone: string;
  address: string;
  visits: number;
  office_hours: Record<string, string>;
  k_client: boolean;
  target_class: string;
  last_visit_date?: string | null;
  last_visit_notes?: string | null;
  current_visit_notes?: string | null;
};

export default function Medici() {
  const { canEdit } = useSubscription();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Doctor>>({});
  const [loading, setLoading] = useState(true);

  // AI parsing state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [formDefaults, setFormDefaults] = useState<{name?: string; specialty?: string; paese?: string; microarea?: string; address?: string; phone?: string; office_hours?: Record<string, string>}>({});

  const fetchDoctors = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("doctors").select("*").order("name");
    if (error) { console.error(error); return; }
    setDoctors((data || []).map(d => ({
      ...d,
      paese: d.paese || "",
      microarea: d.microarea || "",
      address: d.address || "",
      phone: d.phone || "",
      target_class: d.target_class || "",
      office_hours: (d.office_hours as Record<string, string>) || emptyHours(),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [user]);

  const filtered = doctors.filter(d =>
    (filterSpec === "all" || d.specialty === filterSpec) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const parseWithAI = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-doctor", {
        body: { text: aiText },
      });
      if (error) throw error;
      setFormDefaults({
        name: data.name || "",
        specialty: data.specialty || "MMG",
        paese: data.paese || "",
        microarea: data.microarea || "",
        address: data.address || "",
        phone: data.phone || "",
        office_hours: data.office_hours || emptyHours(),
      });
      setAiOpen(false);
      setAiText("");
      toast.success("Dati compilati dall'AI!");
    } catch (e: any) {
      toast.error(e?.message || "Errore nell'analisi AI");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("doctors").insert({
      user_id: user.id,
      name: fd.get("name") as string,
      specialty: fd.get("specialty") as string,
      paese: fd.get("paese") as string,
      microarea: fd.get("microarea") as string,
      address: fd.get("address") as string,
      phone: fd.get("phone") as string,
      office_hours: formDefaults.office_hours || emptyHours(),
    });
    if (error) { toast.error("Errore nel salvataggio"); return; }
    setOpen(false);
    setFormDefaults({});
    toast.success("Medico aggiunto");
    fetchDoctors();
  };

  const updateDoctor = async (updated: Doctor) => {
    const { error } = await supabase.from("doctors").update({
      name: updated.name,
      specialty: updated.specialty,
      paese: updated.paese,
      microarea: updated.microarea,
      address: updated.address,
      phone: updated.phone,
      visits: updated.visits,
      k_client: updated.k_client,
      target_class: updated.target_class,
      office_hours: updated.office_hours,
      last_visit_date: updated.last_visit_date,
      last_visit_notes: updated.last_visit_notes,
      current_visit_notes: updated.current_visit_notes,
    }).eq("id", updated.id);
    if (error) { toast.error("Errore nel salvataggio"); return; }
    setSelected(updated);
    setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const startEdit = () => {
    if (!selected) return;
    setEditData({ name: selected.name, specialty: selected.specialty, paese: selected.paese, microarea: selected.microarea, address: selected.address, phone: selected.phone });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    const updated = { ...selected, ...editData };
    updateDoctor(updated);
    setEditing(false);
    toast.success("Medico aggiornato");
  };

  const cancelEdit = () => setEditing(false);

  const openMaps = (address: string) => {
    window.open(`https://maps.apple.com/?q=${encodeURIComponent(address)}`, "_blank");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Medici</h1>
        <Dialog open={open} onOpenChange={(v) => { if (v && !canEdit) { toast.error("Abbonamento scaduto. Rinnova per aggiungere dati."); return; } if (!v) setFormDefaults({}); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Nuovo Medico</DialogTitle>
                <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs h-8 px-3" onClick={() => setAiOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5" /> AI
                </Button>
              </div>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4" key={JSON.stringify(formDefaults)}>
              <div className="space-y-2"><Label>Nome</Label><Input name="name" required className="rounded-xl" placeholder="Dr. Mario Rossi" defaultValue={formDefaults.name || ""} /></div>
              <div className="space-y-2">
                <Label>Specializzazione</Label>
                <Select name="specialty" defaultValue={formDefaults.specialty || "MMG"}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Paese</Label><Input name="paese" className="rounded-xl" placeholder="Milano" defaultValue={formDefaults.paese || ""} /></div>
              <div className="space-y-2"><Label>Microarea</Label><Input name="microarea" className="rounded-xl" placeholder="Milano Nord" defaultValue={formDefaults.microarea || ""} /></div>
              <div className="space-y-2"><Label>Indirizzo</Label><Input name="address" className="rounded-xl" placeholder="Via Roma 12, Milano" defaultValue={formDefaults.address || ""} /></div>
              <div className="space-y-2"><Label>Telefono</Label><Input name="phone" className="rounded-xl" placeholder="+39 ..." defaultValue={formDefaults.phone || ""} /></div>
              {formDefaults.office_hours && Object.values(formDefaults.office_hours).some(v => v) && (
                <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Orari (compilati da AI)</Label>
                  {weekDays.map(day => formDefaults.office_hours?.[day] ? (
                    <div key={day} className="flex items-center gap-2 text-xs">
                      <span className="font-medium w-20">{day}</span>
                      <span>{formDefaults.office_hours[day]}</span>
                    </div>
                  ) : null)}
                </div>
              )}
              <Button type="submit" className="w-full rounded-xl">Aggiungi</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* AI Dialog */}
        <Dialog open={aiOpen} onOpenChange={setAiOpen}>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Compila con AI</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Incolla le informazioni del medico (da sito ASL, rubrica, ecc.) e l'AI compilerà automaticamente i campi.</p>
            <Textarea
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              className="rounded-xl min-h-[180px] text-sm"
              placeholder={"Cognome: ROSSI\nNome: MARIO\nTipo Medico: GENERICO\nIndirizzo: VIA ROMA 12, MILANO\nTelefono: 3201234567\nOrario:\nLunedi: 09:00 - 12:00\n..."}
            />
            <Button onClick={parseWithAI} disabled={aiLoading || !aiText.trim()} className="w-full rounded-xl gap-2">
              {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisi in corso...</> : <><Sparkles className="h-4 w-4" /> Compila campi</>}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca medico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        <button onClick={() => setFilterSpec("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterSpec === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>Tutti</button>
        {specialties.map(s => (
          <button key={s} onClick={() => setFilterSpec(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterSpec === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Nessun medico</div>}
        {filtered.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(d)}
            className="glass rounded-2xl p-4 shadow-soft flex items-center gap-4 cursor-pointer hover:shadow-glow transition-shadow">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {d.name.split(" ").slice(-1)[0]?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.specialty}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{d.paese}</span>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{d.microarea}</span>
                {d.k_client && <span className="text-[10px] text-warning bg-warning/10 px-2 py-0.5 rounded-full font-medium">K</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setEditing(false); } }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
          {selected && (
            <div className="space-y-5">
              <SheetHeader className="flex flex-row items-center justify-between">
                <SheetTitle className="text-left">{selected.name}</SheetTitle>
                {!editing ? (
                  <Button size="icon" variant="ghost" onClick={startEdit} className="rounded-full h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={cancelEdit} className="rounded-full h-8 w-8"><X className="h-4 w-4" /></Button>
                    <Button size="icon" onClick={saveEdit} className="rounded-full h-8 w-8"><Check className="h-4 w-4" /></Button>
                  </div>
                )}
              </SheetHeader>

              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={editData.name || ""} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} className="rounded-xl" /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">Specializzazione</Label>
                    <Select value={editData.specialty || ""} onValueChange={v => setEditData(p => ({ ...p, specialty: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Paese</Label><Input value={editData.paese || ""} onChange={e => setEditData(p => ({ ...p, paese: e.target.value }))} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs">Microarea</Label><Input value={editData.microarea || ""} onChange={e => setEditData(p => ({ ...p, microarea: e.target.value }))} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs">Indirizzo</Label><Input value={editData.address || ""} onChange={e => setEditData(p => ({ ...p, address: e.target.value }))} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs">Telefono</Label><Input value={editData.phone || ""} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" /></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{selected.specialty}</span>
                    <span className="text-xs bg-secondary px-2.5 py-1 rounded-full">{selected.paese}</span>
                    <span className="text-xs bg-secondary px-2.5 py-1 rounded-full">{selected.microarea}</span>
                    {selected.k_client && <span className="text-xs bg-warning/10 text-warning px-2.5 py-1 rounded-full font-medium">K-Client</span>}
                  </div>
                  <button onClick={() => window.open(`tel:${selected.phone}`)} className="flex items-center gap-3 w-full text-left">
                    <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><Phone className="h-4 w-4 text-success" /></div>
                    <span className="text-sm text-primary">{selected.phone}</span>
                  </button>
                  {selected.address && (
                    <button onClick={() => openMaps(selected.address)} className="flex items-center gap-3 w-full text-left">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="h-4 w-4 text-primary" /></div>
                      <span className="text-sm text-primary underline">{selected.address}</span>
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center"><Calendar className="h-4 w-4 text-muted-foreground" /></div>
                    <span className="text-sm"><span className="text-muted-foreground">Visite effettuate:</span> {selected.visits}</span>
                  </div>
                </>
              )}

              {/* K-Client toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm">K-Client</span>
                <button onClick={() => updateDoctor({ ...selected, k_client: !selected.k_client })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${selected.k_client ? "bg-primary" : "bg-secondary"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${selected.k_client ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Target class */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Target</span>
                <Select value={selected.target_class || ""} onValueChange={(v) => updateDoctor({ ...selected, target_class: v })}>
                  <SelectTrigger className="w-24 rounded-xl h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selected.last_visit_date && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ultima visita: {selected.last_visit_date}</p>
                  <p className="text-sm">{selected.last_visit_notes || "—"}</p>
                </div>
              )}

              {/* Office Hours */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Orari ambulatoriali settimanali
                </Label>
                <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
                  {weekDays.map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-20 shrink-0">{day}</span>
                      <Input value={selected.office_hours[day] || ""} onChange={(e) => updateDoctor({ ...selected, office_hours: { ...selected.office_hours, [day]: e.target.value } })}
                        className="rounded-lg h-8 text-xs" placeholder="es. 09:00-13:00" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Note visita corrente</Label>
                <Textarea value={selected.current_visit_notes || ""} onChange={(e) => updateDoctor({ ...selected, current_visit_notes: e.target.value })}
                  className="rounded-xl min-h-[80px]" placeholder="Scrivi note..." />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-xl gap-2"><Trash2 className="h-4 w-4" /> Elimina Medico</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare {selected.name}?</AlertDialogTitle>
                    <AlertDialogDescription>Questa azione è irreversibile.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl" onClick={async () => {
                      await supabase.from("doctors").delete().eq("id", selected.id);
                      setDoctors(prev => prev.filter(d => d.id !== selected.id));
                      setSelected(null);
                      toast.success("Medico eliminato");
                    }}>Elimina</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
