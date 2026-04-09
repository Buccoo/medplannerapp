import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import {
  format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, getDay
} from "date-fns";
import { it } from "date-fns/locale";

const PRODUCTS_LIST = ["CardioX 100mg", "NeuroFlex 50mg", "GastroPro 200mg", "ImmunoVit Plus", "DermaShield Crema"];

const DOCTORS_LIST = [
  { name: "Dr. Marco Bianchi", phone: "+39 02 1234567", address: "Via Roma 12, Milano", paese: "Milano", microarea: "Milano Nord" },
  { name: "Dr.ssa Laura Verdi", phone: "+39 02 7654321", address: "Corso Italia 5, Milano", paese: "Milano", microarea: "Milano Centro" },
  { name: "Dr. Giuseppe Russo", phone: "+39 02 9876543", address: "Via Dante 8, Milano", paese: "Milano", microarea: "Milano Sud" },
  { name: "Dr.ssa Anna Esposito", phone: "+39 039 1234567", address: "Via Monza 20, Monza", paese: "Monza", microarea: "Monza" },
  { name: "Dr. Paolo Ferrari", phone: "+39 035 7654321", address: "Via Bergamo 10, Bergamo", paese: "Bergamo", microarea: "Bergamo" },
];

type AppointmentStatus = "programmato" | "confermato" | "completato";
type BookingSource = "Ambulatorio" | "WA" | "MioDottore";

type Appointment = {
  id: number;
  date: Date;
  time: string;
  name: string;
  type: "medico" | "farmacia";
  status: AppointmentStatus;
  phone: string;
  address: string;
  paese: string;
  microarea: string;
  bookingSource: BookingSource;
  lastVisitDate?: string;
  lastVisitNotes?: string;
  currentVisitNotes: string;
  secretaryNotes: string;
  nextAppointmentDraft: string;
  products: { name: string; qty: number }[];
  orderFile?: string;
};

const today = new Date();

const initialAppointments: Appointment[] = [
  {
    id: 1, date: today, time: "09:00", name: "Dr. Bianchi", type: "medico",
    status: "confermato", phone: "+393331234567", address: "Via Roma 12, Milano",
    paese: "Milano", microarea: "Milano Nord",
    bookingSource: "Ambulatorio", lastVisitDate: "2025-06-01", lastVisitNotes: "Discusso CardioX",
    currentVisitNotes: "", secretaryNotes: "", nextAppointmentDraft: "",
    products: [{ name: "CardioX 100mg", qty: 10 }]
  },
  {
    id: 2, date: today, time: "10:30", name: "Farmacia Centrale", type: "farmacia",
    status: "completato", phone: "+393339876543", address: "Corso Italia 5, Milano",
    paese: "Milano", microarea: "Milano Centro",
    bookingSource: "WA", lastVisitDate: "2025-05-28", lastVisitNotes: "Ordine mensile confermato",
    currentVisitNotes: "", secretaryNotes: "", nextAppointmentDraft: "",
    products: [{ name: "GastroPro 200mg", qty: 20 }]
  },
  {
    id: 3, date: today, time: "14:00", name: "Dr.ssa Verdi", type: "medico",
    status: "programmato", phone: "+393335556677", address: "Via Dante 8, Roma",
    paese: "Roma", microarea: "Roma Centro",
    bookingSource: "MioDottore", currentVisitNotes: "", secretaryNotes: "",
    nextAppointmentDraft: "", products: []
  },
  {
    id: 4, date: addDays(today, 1), time: "16:00", name: "Dr. Russo", type: "medico",
    status: "programmato", phone: "+393332223344", address: "Piazza Duomo 3, Napoli",
    paese: "Napoli", microarea: "Napoli Centro",
    bookingSource: "Ambulatorio", currentVisitNotes: "", secretaryNotes: "",
    nextAppointmentDraft: "", products: []
  },
];

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
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [appointments, setAppointments] = useState(initialAppointments);
  const [addOpen, setAddOpen] = useState(false);
  const [detailApp, setDetailApp] = useState<Appointment | null>(null);
  const [editingTime, setEditingTime] = useState(false);

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
    appointments.filter(a => a.type === "medico" && isSameDay(a.date, date)).sort((a, b) => a.time.localeCompare(b.time));

  const todayAppointments = getAppointmentsForDate(selectedDate);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newApp: Appointment = {
      id: Date.now(),
      date: selectedDate,
      time: fd.get("time") as string,
      name: fd.get("name") as string,
      type: "medico" as const,
      status: "programmato",
      phone: fd.get("phone") as string || "",
      address: fd.get("address") as string || "",
      paese: fd.get("paese") as string || "",
      microarea: fd.get("microarea") as string || "",
      bookingSource: fd.get("source") as BookingSource || "Ambulatorio",
      currentVisitNotes: "",
      secretaryNotes: "",
      nextAppointmentDraft: "",
      products: [],
    };
    setAppointments(prev => [...prev, newApp]);
    setAddOpen(false);
    toast.success("Appuntamento aggiunto");
  };

  const updateAppointment = (updated: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setDetailApp(updated);
  };

  const changeStatus = (app: Appointment) => {
    const order: AppointmentStatus[] = ["programmato", "confermato", "completato"];
    const next = order[(order.indexOf(app.status) + 1) % order.length];
    updateAppointment({ ...app, status: next });
    toast.success(`Stato: ${statusLabels[next]}`);
  };

  const openMaps = (address: string) => {
    window.open(`https://maps.apple.com/?q=${encodeURIComponent(address)}`, "_blank");
  };

  const callPhone = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleFileUpload = (app: Appointment, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateAppointment({ ...app, orderFile: file.name });
      toast.success(`File "${file.name}" caricato`);
    }
  };

  const toggleProduct = (app: Appointment, productName: string) => {
    const exists = app.products.find(p => p.name === productName);
    const newProducts = exists
      ? app.products.filter(p => p.name !== productName)
      : [...app.products, { name: productName, qty: 1 }];
    updateAppointment({ ...app, products: newProducts });
  };

  const updateProductQty = (app: Appointment, productName: string, qty: number) => {
    updateAppointment({
      ...app,
      products: app.products.map(p => p.name === productName ? { ...p, qty } : p)
    });
  };

  const headerTitle = useMemo(() => {
    if (viewMode === "day") return format(selectedDate, "d MMMM yyyy", { locale: it });
    if (viewMode === "week") return `${format(weekDays[0], "d MMM", { locale: it })} - ${format(weekDays[6], "d MMM yyyy", { locale: it })}`;
    return format(selectedDate, "MMMM yyyy", { locale: it });
  }, [selectedDate, viewMode, weekDays]);

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
                    {DOCTORS_LIST.map(d => (
                      <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
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
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === v.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <v.icon className="h-3.5 w-3.5" />
            {v.label}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigateDate(-1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setSelectedDate(today)} className="text-sm font-semibold capitalize">
          {headerTitle}
        </button>
        <button onClick={() => navigateDate(1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* WEEK VIEW */}
      {viewMode === "week" && (
        <div className="flex gap-1.5 mb-4">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const dayApps = getAppointmentsForDate(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex-1 rounded-2xl py-2.5 text-center transition-all ${
                  isSelected ? "bg-primary shadow-glow" : "glass shadow-soft"
                }`}
              >
                <p className={`text-[10px] ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {format(day, "EEE", { locale: it })}
                </p>
                <p className={`text-base font-bold ${isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </p>
                {dayApps.length > 0 && (
                  <div className={`mx-auto mt-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                )}
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
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDate(day); setViewMode("day"); }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                    isSelected ? "bg-primary text-primary-foreground" : isT ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {format(day, "d")}
                  {dayApps.length > 0 && (
                    <div className={`h-1 w-1 rounded-full mt-0.5 ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                  )}
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
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setDetailApp(a)}
              className={`glass rounded-2xl p-4 shadow-soft flex items-center gap-3 cursor-pointer transition-opacity ${
                a.status === "completato" ? "opacity-60" : ""
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                a.type === "medico" ? "bg-primary/10" : "bg-success/10"
              }`}>
                {a.type === "medico" ? <User className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-success" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${a.status === "completato" ? "line-through" : ""}`}>{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[a.status]}`}>
                    {statusLabels[a.status]}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{a.paese}</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{a.bookingSource}</span>
                </div>
                {a.address && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openMaps(a.address); }}
                    className="text-[10px] text-primary flex items-center gap-0.5 truncate max-w-[180px] mt-0.5"
                  >
                    <MapPin className="h-2.5 w-2.5 shrink-0" />{a.address}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {a.time}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailApp} onOpenChange={(open) => { if (!open) { setDetailApp(null); setEditingTime(false); } }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
          {detailApp && (
            <div className="space-y-5">
              <SheetHeader>
                <SheetTitle className="text-left">{detailApp.name}</SheetTitle>
              </SheetHeader>

              {/* Status & quick actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => changeStatus(detailApp)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[detailApp.status]}`}
                >
                  {statusLabels[detailApp.status]} ▸
                </button>
                <Badge variant="outline" className="text-xs">{detailApp.type === "medico" ? "Medico" : "Farmacia"}</Badge>
                <Badge variant="outline" className="text-xs">{detailApp.bookingSource}</Badge>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{detailApp.paese}</span>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{detailApp.microarea}</span>
              </div>

              {/* Time (editable) - only for medico */}
              {detailApp.type === "medico" && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {editingTime ? (
                    <Input
                      type="time"
                      defaultValue={detailApp.time}
                      className="rounded-xl w-32 h-8"
                      autoFocus
                      onBlur={(e) => {
                        if (e.target.value) updateAppointment({ ...detailApp, time: e.target.value });
                        setEditingTime(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                    />
                  ) : (
                    <button onClick={() => setEditingTime(true)} className="text-sm font-medium hover:text-primary transition-colors">
                      {detailApp.time} <span className="text-xs text-muted-foreground ml-1">(modifica)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Delete */}
              <button
                onClick={() => {
                  setAppointments(prev => prev.filter(a => a.id !== detailApp.id));
                  setDetailApp(null);
                  toast.success("Appuntamento eliminato");
                }}
                className="flex items-center gap-3 w-full text-left"
              >
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-sm text-destructive">Elimina appuntamento</span>
              </button>

              {detailApp.phone && (
                <button onClick={() => callPhone(detailApp.phone)} className="flex items-center gap-3 w-full text-left">
                  <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm text-primary">{detailApp.phone}</span>
                </button>
              )}

              {/* Address */}
              {detailApp.address && (
                <button onClick={() => openMaps(detailApp.address)} className="flex items-center gap-3 w-full text-left">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-primary underline">{detailApp.address}</span>
                </button>
              )}

              {/* Last visit - only for medico */}
              {detailApp.type === "medico" && detailApp.lastVisitDate && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ultima visita: {detailApp.lastVisitDate}</p>
                  <p className="text-sm">{detailApp.lastVisitNotes || "—"}</p>
                </div>
              )}

              {/* Products - only for medico */}
              {detailApp.type === "medico" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Prodotti discussi</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRODUCTS_LIST.map(pName => {
                      const selected = detailApp.products.find(p => p.name === pName);
                      return (
                        <button
                          key={pName}
                          onClick={() => toggleProduct(detailApp, pName)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                            selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 inline mr-1" />}
                          {pName}
                        </button>
                      );
                    })}
                  </div>
                  {detailApp.products.length > 0 && (
                    <div className="space-y-1.5">
                      {detailApp.products.map(p => (
                        <div key={p.name} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-1.5">
                          <span className="text-xs">{p.name}</span>
                          <Input
                            type="number"
                            min={1}
                            value={p.qty}
                            onChange={(e) => updateProductQty(detailApp, p.name, Number(e.target.value) || 1)}
                            className="w-16 h-7 text-xs text-center rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes - only for medico */}
              {detailApp.type === "medico" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Note visita corrente</Label>
                    <Textarea
                      value={detailApp.currentVisitNotes}
                      onChange={(e) => updateAppointment({ ...detailApp, currentVisitNotes: e.target.value })}
                      className="rounded-xl mt-1 min-h-[60px]"
                      placeholder="Scrivi note..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Note per la segreteria</Label>
                    <Textarea
                      value={detailApp.secretaryNotes}
                      onChange={(e) => updateAppointment({ ...detailApp, secretaryNotes: e.target.value })}
                      className="rounded-xl mt-1 min-h-[60px]"
                      placeholder="Note segreteria..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bozza prossimo appuntamento</Label>
                    <Textarea
                      value={detailApp.nextAppointmentDraft}
                      onChange={(e) => updateAppointment({ ...detailApp, nextAppointmentDraft: e.target.value })}
                      className="rounded-xl mt-1 min-h-[60px]"
                      placeholder="Prossimo appuntamento..."
                    />
                  </div>
                </div>
              )}

              {/* Farmacia: only notes */}
              {detailApp.type === "farmacia" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Note</Label>
                  <Textarea
                    value={detailApp.currentVisitNotes}
                    onChange={(e) => updateAppointment({ ...detailApp, currentVisitNotes: e.target.value })}
                    className="rounded-xl mt-1 min-h-[60px]"
                    placeholder="Scrivi note..."
                  />
                </div>
              )}

              {/* Excel upload - ONLY for farmacia */}
              {detailApp.type === "farmacia" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Copia Excel ultimo ordine</Label>
                  <label className="flex items-center gap-2 glass rounded-xl p-3 cursor-pointer shadow-soft">
                    <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                      {detailApp.orderFile ? <FileSpreadsheet className="h-4 w-4 text-success" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{detailApp.orderFile || "Carica file Excel"}</p>
                      <p className="text-[10px] text-muted-foreground">.xlsx, .xls</p>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => handleFileUpload(detailApp, e)}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
