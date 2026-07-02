import { useState, useMemo, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, User, Building2, Phone, MapPin, ChevronLeft, ChevronRight,
  FileSpreadsheet, Check, CalendarDays, CalendarRange, Calendar as CalendarIcon,
  X, Search, Upload, Trash2, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { stripDoctorTitle } from "@/lib/doctorName";
import {
  format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, addWeeks, subWeeks, getDay, parseISO, startOfDay
} from "date-fns";
import { it } from "date-fns/locale";

const dayNameMap: Record<number, string> = {
  0: "Domenica", 1: "Lunedì", 2: "Martedì", 3: "Mercoledì",
  4: "Giovedì", 5: "Venerdì", 6: "Sabato",
};
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
  const [doctors, setDoctors] = useState<{ name: string; phone: string; address: string; paese: string; microarea: string; office_hours: Record<string, string> | null; birth_year?: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includePast, setIncludePast] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorSuggestions, setShowDoctorSuggestions] = useState(false);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [selectedPaese, setSelectedPaese] = useState("");
  const [selectedMicroarea, setSelectedMicroarea] = useState("");
  const [microareaTowns, setMicroareaTowns] = useState<Record<string, string[]>>({});
  const [dailyPriority, setDailyPriority] = useState("");
  const [priorityLoaded, setPriorityLoaded] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);

  const MICROAREAS = ["LE07", "LE08", "LE09", "LE10", "LE11", "LE12", "LE13"];

  const fetchMicroareaTowns = async () => {
    if (!user) return;
    const { data } = await supabase.from("microarea_towns").select("microarea, town").eq("user_id", user.id);
    if (!data) return;
    const grouped: Record<string, string[]> = {};
    data.forEach(r => {
      if (!grouped[r.microarea]) grouped[r.microarea] = [];
      grouped[r.microarea].push(r.town);
    });
    setMicroareaTowns(grouped);
  };

  const uniquePaesi = useMemo(() => {
    if (selectedMicroarea && microareaTowns[selectedMicroarea]) {
      return [...microareaTowns[selectedMicroarea]].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
    }
    const set = new Set<string>();
    doctors.forEach(d => {
      if (d.paese?.trim()) set.add(d.paese.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
  }, [doctors, selectedMicroarea, microareaTowns]);

  const filteredDoctors = useMemo(() => {
    let list = doctors;
    if (selectedMicroarea) {
      list = list.filter(d => d.microarea?.trim().toLowerCase() === selectedMicroarea.trim().toLowerCase());
    }
    if (selectedPaese) {
      list = list.filter(d => d.paese?.trim().toLowerCase() === selectedPaese.trim().toLowerCase());
    }
    const norm = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (doctorSearch.trim()) {
      const q = norm(doctorSearch.trim());
      list = list.filter(d =>
        norm(stripDoctorTitle(d.name)).split(/[\s,.'-]+/).some(w => w.startsWith(q))
      );
    }
    const seen = new Map<string, typeof list[number]>();
    for (const d of list) {
      const k = norm(stripDoctorTitle(d.name)).trim();
      if (k && !seen.has(k)) seen.set(k, d);
    }
    return Array.from(seen.values()).sort((a, b) =>
      stripDoctorTitle(a.name).localeCompare(stripDoctorTitle(b.name), "it", { sensitivity: "base" })
    );
  }, [doctors, doctorSearch, selectedPaese, selectedMicroarea]);

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
    const { data } = await supabase.from("doctors").select("name, phone, address, paese, microarea, office_hours, birth_year").order("name");
    setDoctors((data || []).map(d => ({ name: d.name, phone: d.phone || "", address: d.address || "", paese: d.paese || "", microarea: d.microarea || "", office_hours: d.office_hours as Record<string, string> | null, birth_year: d.birth_year })));
  };

  useEffect(() => { fetchAppointments(); fetchDoctors(); fetchMicroareaTowns(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setPriorityLoaded(false);
    supabase
      .from("daily_priorities")
      .select("content")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle()
      .then(({ data }) => {
        setDailyPriority(data?.content || "");
        setPriorityLoaded(true);
      });
  }, [user, selectedDate]);

  const savePriority = async () => {
    if (!user || !canEdit || prioritySaving) return;
    setPrioritySaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    try {
      await supabase
        .from("daily_priorities")
        .upsert({ user_id: user.id, date: dateStr, content: dailyPriority }, { onConflict: "user_id,date" });
      toast.success("Priorità salvate");
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setPrioritySaving(false);
    }
  };

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

  const searching = search.trim().length > 0;
  const todayStart = useMemo(() => startOfDay(today), []);
  const searchMatches = useMemo(() => {
    if (!searching) return [];
    const norm = (s: string) => s.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").toLowerCase();
    const q = norm(search.trim());
    return appointments.filter(a =>
      norm(a.name).includes(q) ||
      norm(a.paese).includes(q) ||
      norm(a.microarea).includes(q) ||
      norm(a.address).includes(q)
    );
  }, [appointments, search, searching]);
  const futureResults = useMemo(
    () => searchMatches
      .filter(a => a.date >= todayStart)
      .sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time)),
    [searchMatches, todayStart]
  );
  const pastResults = useMemo(
    () => searchMatches
      .filter(a => a.date < todayStart)
      .sort((a, b) => b.date.getTime() - a.date.getTime() || b.time.localeCompare(a.time)),
    [searchMatches, todayStart]
  );

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const doctorName = fd.get("name") as string;
    if (!doctorName) { toast.error("Seleziona un medico"); return; }
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

  const renderAppointment = (a: Appointment, i: number) => (
    <motion.div key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}
      onClick={() => setDetailApp(a)}
      className={`glass rounded-2xl p-4 shadow-soft flex items-center gap-3 cursor-pointer transition-opacity ${a.status === "completato" ? "opacity-60" : ""}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${a.type === "medico" ? "bg-primary/10" : "bg-success/10"}`}>
        {a.type === "medico" ? <User className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-success" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${a.status === "completato" ? "line-through" : ""}`}>
          {a.name}
          {(() => { const doc = doctors.find(d => d.name === a.name); return doc?.birth_year ? <span className="text-[10px] text-muted-foreground ml-1">({doc.birth_year})</span> : null; })()}
        </p>
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
        {searching && <span className="text-[10px] font-medium text-primary capitalize">{format(a.date, "EEE d MMM", { locale: it })}</span>}
        <div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{a.time}</div>
        <button onClick={(e) => { e.stopPropagation(); changeStatus(a); }}
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[a.status]}`}>
          {statusLabels[a.status]}
        </button>
      </div>
    </motion.div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={addOpen} onOpenChange={(v) => { if (v && !canEdit) { toast.error("Abbonamento scaduto. Rinnova per aggiungere dati."); return; } if (!v) { setDoctorSearch(""); setSelectedDoctorName(""); setShowDoctorSuggestions(false); setSelectedPaese(""); setSelectedMicroarea(""); } setAddOpen(v); }}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuovo Appuntamento</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Microarea</Label>
                <Select value={selectedMicroarea || "__all__"} onValueChange={(v) => { setSelectedMicroarea(v === "__all__" ? "" : v); setSelectedPaese(""); setDoctorSearch(""); setSelectedDoctorName(""); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Tutte le microaree" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tutte le microaree</SelectItem>
                    {MICROAREAS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Paese</Label>
                <Select value={selectedPaese || "__all__"} onValueChange={(v) => { setSelectedPaese(v === "__all__" ? "" : v); setDoctorSearch(""); setSelectedDoctorName(""); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Tutti i paesi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tutti i paesi</SelectItem>
                    {uniquePaesi.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 relative">
                <Label>Medico</Label>
                <input type="hidden" name="name" value={selectedDoctorName} />
                <Input
                  value={doctorSearch}
                  onChange={(e) => { setDoctorSearch(e.target.value); setSelectedDoctorName(""); setShowDoctorSuggestions(true); }}
                  onFocus={() => setShowDoctorSuggestions(true)}
                  onBlur={() => { setTimeout(() => setShowDoctorSuggestions(false), 200); }}
                  placeholder="Cerca medico..."
                  className="rounded-xl"
                  autoComplete="off"
                />
                {showDoctorSuggestions && filteredDoctors.length > 0 && !selectedDoctorName && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredDoctors.map(d => (
                      <button
                        key={d.name}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors first:rounded-t-xl last:rounded-b-xl"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setDoctorSearch(d.name); setSelectedDoctorName(d.name); setShowDoctorSuggestions(false); }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
                {showDoctorSuggestions && doctorSearch && filteredDoctors.length === 0 && !selectedDoctorName && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg px-3 py-2 text-sm text-muted-foreground">
                    Nessun medico trovato
                  </div>
                )}
                {(() => {
                  if (!selectedDoctorName) return null;
                  const doc = doctors.find(d => d.name === selectedDoctorName);
                  if (!doc?.office_hours) return null;
                  const dayName = dayNameMap[selectedDate.getDay()];
                  const hours = doc.office_hours[dayName];
                  return (
                    <div className={`mt-1.5 text-xs px-3 py-2 rounded-xl ${hours ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                      <Clock className="inline h-3 w-3 mr-1 -mt-0.5" />
                      {hours ? `Ambulatorio ${dayName}: ${hours}` : `Nessun orario ambulatoriale per ${dayName}`}
                    </div>
                  );
                })()}
                {(() => {
                  if (!selectedDoctorName) return null;
                  const doc = doctors.find(d => d.name === selectedDoctorName);
                  if (!doc?.office_hours) return null;
                  const dayName = dayNameMap[selectedDate.getDay()];
                  const hours = doc.office_hours[dayName];
                  if (!hours) return null;
                  const m = String(hours).match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
                  if (!m) return null;
                  const start = m[1].replace(".", ":").padStart(5, "0");
                  const end = m[2].replace(".", ":").padStart(5, "0");
                  const slotApps = appointments
                    .filter(a => isSameDay(a.date, selectedDate) && a.time >= start && a.time <= end)
                    .sort((a, b) => a.time.localeCompare(b.time));
                  return (
                    <div className="mt-1.5 rounded-xl bg-muted/50 border border-border p-2 text-xs">
                      <div className="font-medium mb-1 text-muted-foreground">
                        Appuntamenti in questa fascia ({start}–{end})
                      </div>
                      {slotApps.length === 0 ? (
                        <div className="text-success">Nessun appuntamento — slot liberi</div>
                      ) : (
                        <ul className="space-y-1">
                          {slotApps.map(a => (
                            <li key={a.id} className="flex items-center gap-2">
                              <span className="font-mono tabular-nums w-10">{a.time}</span>
                              <span className="flex-1 truncate">{a.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusColors[a.status]}`}>
                                {statusLabels[a.status]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-1.5"><Label>Orario</Label><Input name="time" type="time" required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Telefono</Label><Input name="phone" type="tel" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Indirizzo</Label><Input name="address" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Paese</Label><Input name="paese" className="rounded-xl" placeholder="Milano" defaultValue={selectedPaese} /></div>
              <div className="space-y-1.5">
                <Label>Microarea</Label>
                <Select name="microarea" defaultValue="">
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleziona microarea" /></SelectTrigger>
                  <SelectContent>{["LE07","LE08","LE09","LE10","LE11","LE12","LE13"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome, paese, microarea…"
          className="rounded-xl pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Pulisci ricerca"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* View mode toggle */}
      {!searching && (
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
      )}

      {/* Date navigation */}
      {!searching && (
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigateDate(-1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => setSelectedDate(today)} className="text-sm font-semibold capitalize">{headerTitle}</button>
        <button onClick={() => navigateDate(1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><ChevronRight className="h-4 w-4" /></button>
      </div>
      )}

      {/* WEEK VIEW */}
      {!searching && viewMode === "week" && (
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
      {!searching && viewMode === "month" && (
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
        {!searching && viewMode !== "month" && (
          <div className="glass rounded-2xl p-3 shadow-soft mb-1">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Flag className="h-3.5 w-3.5 text-warning" />
                </div>
                <p className="text-xs font-semibold">
                  Priorità della giornata
                  <span className="text-muted-foreground font-normal ml-1 capitalize">· {format(selectedDate, "EEE d MMM", { locale: it })}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={savePriority}
                disabled={!priorityLoaded || !canEdit || prioritySaving}
              >
                {prioritySaving ? (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full mr-1" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Salva
              </Button>
            </div>
            <Textarea
              value={dailyPriority}
              onChange={(e) => setDailyPriority(e.target.value)}
              onBlur={savePriority}
              disabled={!priorityLoaded || !canEdit}
              placeholder="Scrivi le priorità per oggi…"
              className="rounded-xl min-h-[70px] text-sm bg-transparent"
            />
          </div>
        )}
        {searching ? (
          <>
            <label className="flex items-center gap-2 px-1 mb-1 text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox checked={includePast} onCheckedChange={(v) => setIncludePast(v === true)} />
              Anche passate
            </label>
            <div>
              <div className="flex items-center justify-between px-1 mb-1.5 mt-1">
                <span className="text-xs font-semibold">Future</span>
                <span className="text-[10px] text-muted-foreground">{futureResults.length}</span>
              </div>
              {futureResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Nessun appuntamento futuro</div>
              ) : (
                <div className="space-y-2.5">{futureResults.map(renderAppointment)}</div>
              )}
            </div>
            {includePast && (
              <div className="mt-4">
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Passate</span>
                  <span className="text-[10px] text-muted-foreground">{pastResults.length}</span>
                </div>
                {pastResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Nessun appuntamento passato</div>
                ) : (
                  <div className="space-y-2.5">{pastResults.map(renderAppointment)}</div>
                )}
              </div>
            )}
          </>
        ) : (
          todayAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nessun appuntamento</div>
          ) : (
            todayAppointments.map(renderAppointment)
          )
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
