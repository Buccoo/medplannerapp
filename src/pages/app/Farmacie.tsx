import { useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { motion } from "framer-motion";
import { Search, Plus, MapPin, Phone, FileSpreadsheet, Upload, StickyNote, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Pharmacy = {
  id: number;
  name: string;
  address: string;
  phone: string;
  paese: string;
  microarea: string;
  notes: string;
  orderFile?: string;
};

const initial: Pharmacy[] = [
  { id: 1, name: "Farmacia Centrale", address: "Via Roma 12, Milano", phone: "+39 02 1111111", paese: "Milano", microarea: "Milano Centro", notes: "" },
  { id: 2, name: "Farmacia San Marco", address: "Piazza Duomo 3, Milano", phone: "+39 02 2222222", paese: "Milano", microarea: "Milano Nord", notes: "" },
  { id: 3, name: "Farmacia della Stazione", address: "Via Vittorio 45, Monza", phone: "+39 039 3333333", paese: "Monza", microarea: "Brianza", notes: "" },
];

export default function Farmacie() {
  const { canEdit } = useSubscription();
  const [search, setSearch] = useState("");
  const [pharmacies, setPharmacies] = useState(initial);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Pharmacy | null>(null);

  const filtered = pharmacies.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPharmacies(prev => [...prev, {
      id: Date.now(),
      name: fd.get("name") as string,
      address: fd.get("address") as string,
      phone: fd.get("phone") as string,
      paese: fd.get("paese") as string,
      microarea: fd.get("microarea") as string,
      notes: "",
    }]);
    setOpen(false);
    toast.success("Farmacia aggiunta");
  };

  const updatePharmacy = (updated: Pharmacy) => {
    setPharmacies(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
  };

  const handleFileUpload = (pharmacy: Pharmacy, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updatePharmacy({ ...pharmacy, orderFile: file.name });
      toast.success(`File "${file.name}" caricato`);
    }
  };

  const openMaps = (address: string) => {
    window.open(`https://maps.apple.com/?q=${encodeURIComponent(address)}`, "_blank");
  };

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Farmacie</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10" onClick={(e) => { if (!canEdit) { e.preventDefault(); toast.error("Abbonamento scaduto. Rinnova per aggiungere dati."); } }}><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Nuova Farmacia</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input name="name" required className="rounded-xl" placeholder="Farmacia..." /></div>
              <div className="space-y-2"><Label>Indirizzo</Label><Input name="address" className="rounded-xl" placeholder="Via..." /></div>
              <div className="space-y-2"><Label>Telefono</Label><Input name="phone" className="rounded-xl" placeholder="+39..." /></div>
              <div className="space-y-2"><Label>Paese</Label><Input name="paese" className="rounded-xl" placeholder="Milano" /></div>
              <div className="space-y-2"><Label>Microarea</Label><Input name="microarea" className="rounded-xl" placeholder="Milano Nord" /></div>
              <Button type="submit" className="w-full rounded-xl">Aggiungi</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca farmacia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      <div className="space-y-3">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(p)}
            className="glass rounded-2xl p-4 shadow-soft cursor-pointer hover:shadow-glow transition-shadow"
          >
            <p className="font-medium mb-1">{p.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{p.phone}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{p.paese}</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{p.microarea}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
          {selected && (
            <div className="space-y-5">
              <SheetHeader>
                <SheetTitle className="text-left">{selected.name}</SheetTitle>
              </SheetHeader>

              {/* Paese & Microarea */}
              <div className="flex items-center gap-2">
                <span className="text-xs bg-secondary px-2.5 py-1 rounded-full">{selected.paese}</span>
                <span className="text-xs bg-secondary px-2.5 py-1 rounded-full">{selected.microarea}</span>
              </div>

              {/* Phone */}
              <button onClick={() => window.open(`tel:${selected.phone}`)} className="flex items-center gap-3 w-full text-left">
                <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm text-primary">{selected.phone}</span>
              </button>

              {/* Address */}
              <button onClick={() => openMaps(selected.address)} className="flex items-center gap-3 w-full text-left">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-primary underline">{selected.address}</span>
              </button>

              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <StickyNote className="h-3 w-3" /> Note
                </Label>
                <Textarea
                  value={selected.notes}
                  onChange={(e) => updatePharmacy({ ...selected, notes: e.target.value })}
                  className="rounded-xl min-h-[80px]"
                  placeholder="Scrivi note sulla farmacia..."
                />
              </div>

              {/* Excel upload */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Copia Excel ultimo ordine</Label>
                <label className="flex items-center gap-2 glass rounded-xl p-3 cursor-pointer shadow-soft">
                  <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    {selected.orderFile ? <FileSpreadsheet className="h-4 w-4 text-success" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{selected.orderFile || "Carica file Excel"}</p>
                    <p className="text-[10px] text-muted-foreground">.xlsx, .xls</p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFileUpload(selected, e)}
                  />
                </label>
              </div>

              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-xl gap-2">
                    <Trash2 className="h-4 w-4" /> Elimina Farmacia
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
                      setPharmacies(prev => prev.filter(p => p.id !== selected.id));
                      setSelected(null);
                      toast.success("Farmacia eliminata");
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
