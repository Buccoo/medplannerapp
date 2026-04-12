import { useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { motion } from "framer-motion";
import { Search, Plus, Phone, MapPin, Clock, Calendar, Trash2, Pencil, Check, X } from "lucide-react";
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

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  paese: string;
  microarea: string;
  phone: string;
  address: string;
  visits: number;
  officeHours: Record<string, string>;
  kClient: boolean;
  targetClass: "A" | "B" | "C" | "";
  lastVisitDate?: string;
  lastVisitNotes?: string;
  currentVisitNotes?: string;
};

const specialties = ["MMG", "PED", "ORL", "GIN", "INT", "GASTRO"];

const emptyHours = () => Object.fromEntries(weekDays.map(d => [d, ""]));

const initialDoctors: Doctor[] = [
  { id: 1, name: "Dr. Marco Bianchi", specialty: "INT", paese: "Milano", microarea: "Milano Nord", address: "Via Roma 12, Milano", phone: "+39 02 1234567", visits: 12, kClient: true, targetClass: "A", officeHours: { ...emptyHours(), "Lunedì": "09:00-13:00", "Mercoledì": "14:00-18:00" }, lastVisitDate: "2025-06-01", lastVisitNotes: "Discusso CardioX" },
  { id: 2, name: "Dr.ssa Laura Verdi", specialty: "PED", paese: "Milano", microarea: "Milano Centro", address: "Corso Italia 5, Milano", phone: "+39 02 7654321", visits: 8, kClient: false, targetClass: "B", officeHours: emptyHours() },
  { id: 3, name: "Dr. Giuseppe Russo", specialty: "MMG", paese: "Milano", microarea: "Milano Sud", address: "Via Dante 8, Milano", phone: "+39 02 9876543", visits: 15, kClient: true, targetClass: "A", officeHours: emptyHours() },
  { id: 4, name: "Dr.ssa Anna Esposito", specialty: "ORL", paese: "Monza", microarea: "Monza", address: "Via Monza 20, Monza", phone: "+39 039 1234567", visits: 6, kClient: false, targetClass: "C", officeHours: emptyHours() },
  { id: 5, name: "Dr. Paolo Ferrari", specialty: "GASTRO", paese: "Bergamo", microarea: "Bergamo", address: "Via Bergamo 10, Bergamo", phone: "+39 035 7654321", visits: 10, kClient: false, targetClass: "", officeHours: emptyHours() },
];

export default function Medici() {
  const { canEdit } = useSubscription();
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");
  const [doctors, setDoctors] = useState(initialDoctors);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Doctor>>({});

  const filtered = doctors.filter(d =>
    (filterSpec === "all" || d.specialty === filterSpec) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setDoctors(prev => [...prev, {
      id: Date.now(),
      name: fd.get("name") as string,
      specialty: fd.get("specialty") as string,
      paese: fd.get("paese") as string,
      microarea: fd.get("microarea") as string,
      address: fd.get("address") as string,
      phone: fd.get("phone") as string,
      visits: 0,
      kClient: false,
      targetClass: "",
      officeHours: emptyHours(),
    }]);
    setOpen(false);
    toast.success("Medico aggiunto");
  };

  const updateDoctor = (updated: Doctor) => {
    setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
    setSelected(updated);
  };

  const openMaps = (address: string) => {
    window.open(`https://maps.apple.com/?q=${encodeURIComponent(address)}`, "_blank");
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

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Medici</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuovo Medico</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input name="name" required className="rounded-xl" placeholder="Dr. Mario Rossi" /></div>
              <div className="space-y-2">
                <Label>Specializzazione</Label>
                <Select name="specialty" defaultValue="Medico di Base">
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Paese</Label><Input name="paese" className="rounded-xl" placeholder="Milano" /></div>
              <div className="space-y-2"><Label>Microarea</Label><Input name="microarea" className="rounded-xl" placeholder="Milano Nord" /></div>
              <div className="space-y-2"><Label>Indirizzo</Label><Input name="address" className="rounded-xl" placeholder="Via Roma 12, Milano" /></div>
              <div className="space-y-2"><Label>Telefono</Label><Input name="phone" className="rounded-xl" placeholder="+39 ..." /></div>
              <Button type="submit" className="w-full rounded-xl">Aggiungi</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
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

      {/* List */}
      <div className="space-y-3">
        {filtered.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(d)}
            className="glass rounded-2xl p-4 shadow-soft flex items-center gap-4 cursor-pointer hover:shadow-glow transition-shadow"
          >
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {d.name.split(" ").slice(-1)[0][0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.specialty}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{d.paese}</span>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{d.microarea}</span>
                {d.kClient && <span className="text-[10px] text-warning bg-warning/10 px-2 py-0.5 rounded-full font-medium">K</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
         <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
          {selected && (
            <div className="space-y-5">
              <SheetHeader className="flex flex-row items-center justify-between">
                <SheetTitle className="text-left">{selected.name}</SheetTitle>
                {!editing ? (
                  <Button size="icon" variant="ghost" onClick={startEdit} className="rounded-full h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={cancelEdit} className="rounded-full h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="icon" onClick={saveEdit} className="rounded-full h-8 w-8">
                      <Check className="h-4 w-4" />
                    </Button>
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
                {selected.kClient && (
                  <span className="text-xs bg-warning/10 text-warning px-2.5 py-1 rounded-full font-medium">K-Client</span>
                )}
              </div>

              {/* Phone */}
              <button onClick={() => window.open(`tel:${selected.phone}`)} className="flex items-center gap-3 w-full text-left">
                <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm text-primary">{selected.phone}</span>
              </button>

              {/* Address */}
              {selected.address && (
                <button onClick={() => openMaps(selected.address)} className="flex items-center gap-3 w-full text-left">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-primary underline">{selected.address}</span>
                </button>
              )}

              {/* Visits count */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm"><span className="text-muted-foreground">Visite effettuate:</span> {selected.visits}</span>
              </div>
                </>
              )}

              {/* K-Client toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm">K-Client</span>
                <button
                  onClick={() => updateDoctor({ ...selected, kClient: !selected.kClient })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${selected.kClient ? "bg-primary" : "bg-secondary"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${selected.kClient ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Target class */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Target</span>
                <Select value={selected.targetClass || ""} onValueChange={(v) => updateDoctor({ ...selected, targetClass: v as "A" | "B" | "C" | "" })}>
                  <SelectTrigger className="w-24 rounded-xl h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selected.lastVisitDate && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ultima visita: {selected.lastVisitDate}</p>
                  <p className="text-sm">{selected.lastVisitNotes || "—"}</p>
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
                      <Input
                        value={selected.officeHours[day] || ""}
                        onChange={(e) => updateDoctor({
                          ...selected,
                          officeHours: { ...selected.officeHours, [day]: e.target.value }
                        })}
                        className="rounded-lg h-8 text-xs"
                        placeholder="es. 09:00-13:00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Note visita corrente</Label>
                <Textarea
                  value={selected.currentVisitNotes || ""}
                  onChange={(e) => updateDoctor({ ...selected, currentVisitNotes: e.target.value })}
                  className="rounded-xl min-h-[80px]"
                  placeholder="Scrivi note..."
                />
              </div>

              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-xl gap-2">
                    <Trash2 className="h-4 w-4" /> Elimina Medico
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare {selected.name}?</AlertDialogTitle>
                    <AlertDialogDescription>Questa azione è irreversibile.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl" onClick={() => {
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
