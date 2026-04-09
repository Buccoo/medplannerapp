import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Appointment = { id: number; time: string; name: string; type: "medico" | "farmacia"; done: boolean };

const initialAppointments: Appointment[] = [
  { id: 1, time: "09:00", name: "Dr. Bianchi", type: "medico", done: false },
  { id: 2, time: "10:30", name: "Farmacia Centrale", type: "farmacia", done: true },
  { id: 3, time: "14:00", name: "Dr.ssa Verdi", type: "medico", done: false },
  { id: 4, time: "16:00", name: "Dr. Russo", type: "medico", done: false },
];

const days = ["Lun", "Mar", "Mer", "Gio", "Ven"];
const dates = [7, 8, 9, 10, 11];

export default function Agenda() {
  const [selectedDay, setSelectedDay] = useState(2);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [open, setOpen] = useState(false);

  const toggleDone = (id: number) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a));
    toast.success("Stato aggiornato");
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setAppointments(prev => [...prev, {
      id: Date.now(),
      time: fd.get("time") as string,
      name: fd.get("name") as string,
      type: fd.get("type") as "medico" | "farmacia",
      done: false,
    }]);
    setOpen(false);
    toast.success("Appuntamento aggiunto");
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Nuovo Appuntamento</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input name="name" placeholder="Nome medico o farmacia" required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="type" defaultValue="medico">
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medico">Medico</SelectItem>
                    <SelectItem value="farmacia">Farmacia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Orario</Label>
                <Input name="time" type="time" required className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl">Aggiungi</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week strip */}
      <div className="flex gap-2 mb-6">
        {days.map((d, i) => (
          <button
            key={d}
            onClick={() => setSelectedDay(i)}
            className={`flex-1 rounded-2xl py-3 text-center transition-all ${
              i === selectedDay ? "bg-primary shadow-glow" : "glass shadow-soft"
            }`}
          >
            <p className={`text-xs ${i === selectedDay ? "text-primary-foreground" : "text-muted-foreground"}`}>{d}</p>
            <p className={`text-lg font-bold ${i === selectedDay ? "text-primary-foreground" : "text-foreground"}`}>{dates[i]}</p>
          </button>
        ))}
      </div>

      {/* Appointments */}
      <div className="space-y-3">
        {appointments.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => toggleDone(a.id)}
            className={`glass rounded-2xl p-4 shadow-soft flex items-center gap-4 cursor-pointer transition-opacity ${a.done ? "opacity-50" : ""}`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              a.type === "medico" ? "bg-primary/10" : "bg-success/10"
            }`}>
              {a.type === "medico" ? <User className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-success" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${a.done ? "line-through" : ""}`}>{a.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{a.type}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {a.time}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
