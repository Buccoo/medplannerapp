import { useState, useMemo, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, User, Building2, Phone, MapPin, ChevronLeft, ChevronRight,
  FileSpreadsheet, Check, CalendarDays, CalendarRange, Calendar as CalendarIcon,
  X, Upload, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, addWeeks, subWeeks, getDay, parseISO
} from "date-fns";
import { it } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

type AppointmentStatus = "programmato" | "confermato" | "completato";
type BookingSource = "Ambulatorio" | "WA" | "MioDottore";

type Appointment = {
  id: string;
  date: Date;
  time: string;
  name: string;
  type: "medico" | "farmacia";
  status: AppointmentStatus;
  phone: string;
  address: string;
  paese: string;
  microarea: string;
  booking_source: BookingSource;
  last_visit_date?: string | null;
  last_visit_notes?: string | null;
  current_visit_notes: string;
  secretary_notes: string;
  next_appointment_draft: string;
  products: { name: string; qty: number }[];
  order_file?: string | null;
};

const today = new Date();
type ViewMode = "day" | "week" | "month";

const statusColors: Record<AppointmentStatus, string> = {
  programmato: "bg-warning/10 text-warning",
  confermato: "bg-primary/10 text-primary",
  completato: "bg-success/10 text-success",
};
const statusLabels: Record<AppointmentStatus, string> = {
  programmato: "Programmato",
  confermato: "Confermato",
  completato: "Completato",
};

export default function Agenda() {
  const { canEdit } = useSubscription();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [detailApp, setDetailApp] = useState<Appointment | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [doctors, setDoctors] = useState<{ name: string; phone: string; address: string; paese: string; microarea: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("appointments").select("*").order("date").order("time");
    if (error) { console.error(error); return; }
    setAppointments((data || []).map(a => ({
      ...a,
      date: parseISO(a.date),
      type: a.type as "medico" | "farmacia",
      status: a.status as AppointmentStatus,
      phone: a.phone || "",
      address: a.address || "",
      paese: a.paese || "",
      microarea: a.microarea || "",
      booking_source: (a.booking_source || "Ambulatorio") as BookingSource,
      current_visit_notes: a.current_visit_notes || "",
      secretary_notes: a.secretary_notes || "",
      next_appointment_draft: a.next_appointment_draft || "",
      products: (a.products as unknown as { name: string; qty: number }[]) || [],
    })));
    setLoading(false);
  };

  const fetchDoctors = async () => {
    if (!user) return;
    const { data } = await supabase.from("doctors").select("name, phone, address, paese, microarea").order("name");
    setDoctors((data || []).map(d => ({ name: d.name, phone: d.phone || "", address: d.address || "", paese: d.paese || "", microarea: d.microarea || "" })));
  };

  useEffect(() => { fetchAppointments(); fetchDoctors(); }, [user]);

  const navigateDate = (dir: 1 | -1) => {
    if (viewMode === "day") setSelectedDate(prev => addDays(prev, dir));
    else if (viewMode === "week") setSelectedDate(prev => dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1));
    else setSelectedDate(prev => dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = (getDay(monthStart) + 6) % 7;

  const getAppointmentsForDate = (date: Date) =>
    appointments.filter(a => isSameDay(a.date, date)).sort((a, b) => a.time.localeCompare(b.time));

  const todayAppointments = getAppointmentsForDate(selectedDate);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const doctorName = fd.get("name") as string;
    const doctor = doctors.find(d => d.name === doctorName);
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: fd.get("time") as string,
      name: doctorName,
      type: "medico",
      phone: fd.get("phone") as string || doctor?.phone || "",
      address: fd.get("address") as string || doctor?.address || "",
      paese: fd.get("paese") as string || doctor?.paese || "",
      microarea: fd.get("microarea") as string || doctor?.microarea || "",
      booking_source: fd.get("source") as string || "Ambulatorio",
    });
    if (error) { toast.error("Errore nel salvataggio"); return; }
    setAddOpen(false);
    toast.success("Appuntamento aggiunto");
    fetchAppointments();
  };

  const updateAppointment = async (updated: Appointment) => {
    const { error } = await supabase.from("appointments").update({
      time: updated.time,
      name: updated.name,
      status: updated.status,
      phone: updated.phone,
      address: updated.address,
      paese: updated.paese,
      microarea: updated.microarea,
      booking_source: updated.booking_source,
      current_visit_notes: updated.current_visit_notes,
      secretary_notes: updated.secretary_notes,
      next_appointment_draft: updated.next_appointment_draft,
      products: JSON.parse(JSON.stringify(updated.products)),
      order_file: updated.order_file,
    }).eq("id", updated.id);
    if (error) { toast.error("Errore"); return; }
    setDetailApp(updated);
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const deleteAppointment = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    setDetailApp(null);
    toast.success("Appuntamento eliminato");
  };

  const changeStatus = (app: Appointment) => {
    const order: AppointmentStatus[] = ["programmato", "confermato", "completato"];
    const next = order[(order.indexOf(app.status) + 1) % order.length];
    updateAppointment({ ...app, status: next });
    toast.success(`Stato: ${statusLabels[next]}`);
  };

  const openMaps = (address: string) => window.open(`https://maps.apple.com/?q=${encodeURIComponent(address)}`, "_blank");
  const callPhone = (phone: string) => window.open(`tel:${phone}`);

  const toggleProduct = (app: Appointment, productName: string) => {
    const exists = app.products.find(p => p.name === productName);
    const newProducts = exists ? app.products.filter(p => p.name !== productName) : [...app.products, { name: productName, qty: 1 }];
    updateAppointment({ ...app, products: newProducts });
  };

  const updateProductQty = (app: Appointment, productName: string, qty: number) => {
    updateAppointment({ ...app, products: app.products.map(p => p.name === productName ? { ...p, qty } : p) });
  };

  const headerTitle = useMemo(() => {
    if (viewMode === "day") return format(selectedDate, "d MMMM yyyy", { locale: it });
    if (viewMode === "week") return `${format(weekDays[0], "d MMM", { locale: it })} - ${format(weekDays[6], "d MMM yyyy", { locale: it })}`;
    return format(selectedDate, "MMMM yyyy", { locale: it });
  }, [selectedDate, viewMode, weekDays]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={addOpen} onOpenChange={(v) => { if (v && !canEdit) { toast.error("Abbonamento scaduto. Rinnova per aggiungere dati."); return; } setAddOpen(v); }}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuovo Appuntamento</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Medico</Label>
                <Select name="name" required>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleziona medico..." /></SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Orario</Label><Input name="time" type="time" required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Telefono</Label><Input name="phone" type="tel" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Indirizzo</Label><Input name="address" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Paese</Label><Input name="paese" className="rounded-xl" placeholder="Milano" /></div>
              <div className="space-y-1.5"><Label>Microarea</Label><Input name="microarea" className="rounded-xl" placeholder="Milano Nord" /></div>
              <div className="space-y-1.5">
                <Label>Provenienza</Label>
                <Select name="source" defaultValue="Ambulatorio">
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ambulatorio">Ambulatorio</SelectItem>
                    <SelectItem value="WA">WhatsApp</SelectItem>
                    <SelectItem value="MioDottore">MioDottore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-xl">Aggiungi</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 mb-3 bg-secondary rounded-xl p-1">
        {([
          { key: "day" as ViewMode, icon: CalendarDays, label: "Giorno" },
          { key: "week" as ViewMode, icon: CalendarRange, label: "Settimana" },
          { key: "month" as ViewMode, icon: CalendarIcon, label: "Mese" },
        ]).map(v => (
          <button key={v.key} onClick={() => setViewMode(v.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === v.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}>
            <v.icon className="h-3.5 w-3.5" />{v.label}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigateDate(-1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => setSelectedDate(today)} className="text-sm font-semibold capitalize">{headerTitle}</button>
        <button onClick={() => navigateDate(1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><ChevronRight className="h-4 w-4" /></button>
      </div>

      {/* WEEK VIEW */}
      {viewMode === "week" && (
        <div className="flex gap-1.5 mb-4">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const dayApps = getAppointmentsForDate(day);
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                className={`flex-1 rounded-2xl py-2.5 text-center transition-all ${isSelected ? "bg-primary shadow-glow" : "glass shadow-soft"}`}>
                <p className={`text-[10px] ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>{format(day, "EEE", { locale: it })}</p>
                <p className={`text-base font-bold ${isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</p>
                {dayApps.length > 0 && <div className={`mx-auto mt-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
              </button>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === "month" && (
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
            {monthDays.map(day => {
              const isSelected = isSameDay(day, selectedDate);
              const isT = isSameDay(day, today);
              const dayApps = getAppointmentsForDate(day);
              return (
                <button key={day.toISOString()} onClick={() => { setSelectedDate(day); setViewMode("day"); }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${isSelected ? "bg-primary text-primary-foreground" : isT ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-secondary"}`}>
                  {format(day, "d")}
                  {dayApps.length > 0 && <div className={`h-1 w-1 rounded-full mt-0.5 ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointments list */}
      <div className="space-y-2.5">
        {todayAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nessun appuntamento</div>
        ) : (
          todayAppointments.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => setDetailApp(a)}
              className={`glass rounded-2xl p-4 shadow-soft flex items-center gap-3 cursor-pointer transition-opacity ${a.status === "completato" ? "opacity-60" : ""}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${a.type === "medico" ? "bg-primary/10" : "bg-success/10"}`}>
                {a.type === "medico" ? <User className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-success" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${a.status === "completato" ? "line-through" : ""}`}>{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[a.status]}`}>{statusLabels[a.status]}</Badge>
                  <span className="text-[10px] text-muted-foreground">{a.paese}</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{a.booking_source}</span>
                </div>
                {a.address && (
                  <button onClick={(e) => { e.stopPropagation(); openMaps(a.address); }}
                    className="text-[10px] text-primary flex items-center gap-0.5 truncate max-w-[180px] mt-0.5">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />{a.address}
                  </button>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{a.time}</div>
                <button onClick={(e) => { e.stopPropagation(); changeStatus(a); }}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[a.status]}`}>
                  {statusLabels[a.status]}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailApp} onOpenChange={(open) => { if (!open) { setDetailApp(null); setEditingTime(false); } }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
          {detailApp && (
            <div className="space-y-4">
              <SheetHeader><SheetTitle className="text-left">{detailApp.name}</SheetTitle></SheetHeader>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`border-0 ${statusColors[detailApp.status]}`}>{statusLabels[detailApp.status]}</Badge>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{detailApp.paese}</span>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{detailApp.microarea}</span>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{detailApp.booking_source}</span>
              </div>

              {/* Time edit */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Clock className="h-4 w-4 text-primary" /></div>
                {editingTime ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={detailApp.time} onChange={e => updateAppointment({ ...detailApp, time: e.target.value })} className="rounded-lg h-8 w-28 text-sm" />
                    <button onClick={() => setEditingTime(false)}><Check className="h-4 w-4 text-primary" /></button>
                  </div>
                ) : (
                  <button onClick={() => setEditingTime(true)} className="text-sm font-medium">{detailApp.time} <span className="text-muted-foreground text-xs">(modifica)</span></button>
                )}
              </div>

              {detailApp.phone && (
                <button onClick={() => callPhone(detailApp.phone)} className="flex items-center gap-3 w-full text-left">
                  <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><Phone className="h-4 w-4 text-success" /></div>
                  <span className="text-sm text-primary">{detailApp.phone}</span>
                </button>
              )}

              {detailApp.address && (
                <button onClick={() => openMaps(detailApp.address)} className="flex items-center gap-3 w-full text-left">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="h-4 w-4 text-primary" /></div>
                  <span className="text-sm text-primary underline">{detailApp.address}</span>
                </button>
              )}

              {detailApp.last_visit_date && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ultima visita: {detailApp.last_visit_date}</p>
                  <p className="text-sm">{detailApp.last_visit_notes || "—"}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Note visita corrente</Label>
                <Textarea value={detailApp.current_visit_notes} onChange={e => updateAppointment({ ...detailApp, current_visit_notes: e.target.value })} className="rounded-xl min-h-[60px]" placeholder="Scrivi note..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Note segreteria</Label>
                <Textarea value={detailApp.secretary_notes} onChange={e => updateAppointment({ ...detailApp, secretary_notes: e.target.value })} className="rounded-xl min-h-[60px]" placeholder="Note segreteria..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Bozza prossimo appuntamento</Label>
                <Input value={detailApp.next_appointment_draft} onChange={e => updateAppointment({ ...detailApp, next_appointment_draft: e.target.value })} className="rounded-xl" placeholder="es. Tra 2 settimane" />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => changeStatus(detailApp)} variant="outline" className="flex-1 rounded-xl">Cambia Stato</Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-xl gap-2"><Trash2 className="h-4 w-4" /> Elimina</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare questo appuntamento?</AlertDialogTitle>
                    <AlertDialogDescription>Questa azione è irreversibile.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl" onClick={() => deleteAppointment(detailApp.id)}>Elimina</AlertDialogAction>
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
