import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Doctor = { id: number; name: string; specialty: string; area: string; phone: string; visits: number };

const specialties = ["Medico di Base", "Pediatra", "Cardiologo", "Neurologo", "Gastroenterologo", "Dermatologo"];

const initialDoctors: Doctor[] = [
  { id: 1, name: "Dr. Marco Bianchi", specialty: "Cardiologo", area: "Milano Nord", phone: "+39 02 1234567", visits: 12 },
  { id: 2, name: "Dr.ssa Laura Verdi", specialty: "Pediatra", area: "Milano Centro", phone: "+39 02 7654321", visits: 8 },
  { id: 3, name: "Dr. Giuseppe Russo", specialty: "Medico di Base", area: "Milano Sud", phone: "+39 02 9876543", visits: 15 },
  { id: 4, name: "Dr.ssa Anna Esposito", specialty: "Neurologo", area: "Monza", phone: "+39 039 1234567", visits: 6 },
  { id: 5, name: "Dr. Paolo Ferrari", specialty: "Gastroenterologo", area: "Bergamo", phone: "+39 035 7654321", visits: 10 },
];

export default function Medici() {
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");
  const [doctors, setDoctors] = useState(initialDoctors);
  const [open, setOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

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
      area: fd.get("area") as string,
      phone: fd.get("phone") as string,
      visits: 0,
    }]);
    setOpen(false);
    toast.success("Medico aggiunto");
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Medici</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
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
              <div className="space-y-2"><Label>Microarea</Label><Input name="area" className="rounded-xl" placeholder="Milano Nord" /></div>
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

      {/* Doctor detail sheet */}
      {selectedDoctor && (
        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>{selectedDoctor.name}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Specializzazione:</span> {selectedDoctor.specialty}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{selectedDoctor.area}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selectedDoctor.phone}</p>
              <p><span className="text-muted-foreground">Visite effettuate:</span> {selectedDoctor.visits}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedDoctor(d)}
            className="glass rounded-2xl p-4 shadow-soft flex items-center gap-4 cursor-pointer hover:shadow-glow transition-shadow"
          >
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {d.name.split(" ").slice(-1)[0][0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.specialty}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />{d.area}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
