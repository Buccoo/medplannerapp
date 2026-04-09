import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Pharmacy = { id: number; name: string; address: string; phone: string };

const initial: Pharmacy[] = [
  { id: 1, name: "Farmacia Centrale", address: "Via Roma 12, Milano", phone: "+39 02 1111111" },
  { id: 2, name: "Farmacia San Marco", address: "Piazza Duomo 3, Milano", phone: "+39 02 2222222" },
  { id: 3, name: "Farmacia della Stazione", address: "Via Vittorio 45, Monza", phone: "+39 039 3333333" },
];

export default function Farmacie() {
  const [search, setSearch] = useState("");
  const [pharmacies, setPharmacies] = useState(initial);
  const [open, setOpen] = useState(false);

  const filtered = pharmacies.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPharmacies(prev => [...prev, { id: Date.now(), name: fd.get("name") as string, address: fd.get("address") as string, phone: fd.get("phone") as string }]);
    setOpen(false);
    toast.success("Farmacia aggiunta");
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Farmacie</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Nuova Farmacia</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input name="name" required className="rounded-xl" placeholder="Farmacia..." /></div>
              <div className="space-y-2"><Label>Indirizzo</Label><Input name="address" className="rounded-xl" placeholder="Via..." /></div>
              <div className="space-y-2"><Label>Telefono</Label><Input name="phone" className="rounded-xl" placeholder="+39..." /></div>
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
            className="glass rounded-2xl p-4 shadow-soft"
          >
            <p className="font-medium mb-1">{p.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{p.phone}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
