import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { Building2, CalendarRange, Copy, DatabaseBackup, KeyRound, PackageCheck, Trash2, Upload, Undo2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { classifyDoctorRow, type DoctorImportRow } from "@/lib/importReconciliation";
import { createMcpToken } from "@/lib/mcpToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Facility = { id: string; name: string; facility_type: string; microarea: string; paese: string; address: string; active: boolean };
type TrashAppointment = { id: string; date: string; time: string; name: string; delete_reason: string | null };
type AuditEntry = { id: number; entity_type: string; action: string; source: string; created_at: string };
type ImportPreview = DoctorImportRow & { rowNumber: number; classification: string; normalizedName: string; matchedDoctorId?: string };
type BagRow = { product_id: string; product_name: string; samples: number };
type CoveragePreview = { rowNumber: number; cycle_start: string; cycle_end: string; microarea: string; product: string; planned_days: string; target_value: string; actual_value: string; classification: "certo" | "incompleto_ambiguo" };
type Plan = { id: string; week_start: string; status: string; rationale: Record<string, number>; change_set_id: string | null };
type PlannedAppointment = { id: string; date: string; time: string; name: string; microarea: string; address: string; planning_status: string; is_locked: boolean; change_set_id: string | null };
type Conflict = { id: string; severity: string; message: string; context: Record<string, string> };
type ReviewRow = { id: string; row_number: number; classification: string; normalized_data: { name?: string; microarea?: string; paese?: string } };
type ChangeSet = { id: string; kind: string; status: string; source: string; summary: Record<string, unknown>; created_at: string };
type McpAccessToken = { id: string; name: string; token_prefix: string; scopes: string[]; expires_at: string | null; revoked_at: string | null; last_used_at: string | null; created_at: string };

// Generated Supabase types are refreshed after remote migration; this page intentionally
// uses a narrow escape hatch so the additive migration can ship in the same commit.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const planningDb = supabase as any;

const column = (row: Record<string, unknown>, names: string[]) => {
  const key = Object.keys(row).find((candidate) => names.includes(candidate.trim().toLocaleLowerCase("it")));
  return key ? String(row[key] ?? "") : "";
};

const parseCsv = (text: string) => {
  const records: string[][] = [];
  let record: string[] = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if ((char === "," || char === ";") && !quoted) { record.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field); if (record.some(Boolean)) records.push(record); record = []; field = "";
    } else field += char;
  }
  record.push(field); if (record.some(Boolean)) records.push(record);
  const headers = records.shift() || [];
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
};

const readRows = async (file: File): Promise<Record<string, unknown>[]> => {
  if (file.name.toLocaleLowerCase("it").endsWith(".csv")) return parseCsv(await file.text());
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String);
  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, number) => {
    if (number === 1) return;
    const values = (row.values as unknown[]).slice(1);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  });
  return rows;
};

export default function Pianificazione() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [trash, setTrash] = useState<TrashAppointment[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const [coveragePreview, setCoveragePreview] = useState<CoveragePreview[]>([]);
  const [importType, setImportType] = useState<"schedario" | "ab_plan" | "ro" | "ims">("schedario");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [stagedImportId, setStagedImportId] = useState<string | null>(null);
  const [stagedCoverageId, setStagedCoverageId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bagDate, setBagDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bag, setBag] = useState<BagRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plannedAppointments, setPlannedAppointments] = useState<PlannedAppointment[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [changeSets, setChangeSets] = useState<ChangeSet[]>([]);
  const [mcpTokens, setMcpTokens] = useState<McpAccessToken[]>([]);
  const [newMcpToken, setNewMcpToken] = useState<string | null>(null);
  const weekStart = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), []);

  const refresh = async () => {
    if (!user) return;
    const [facilityResult, trashResult, auditResult, plansResult, appointmentsResult, conflictsResult, reviewResult, changesResult, mcpTokensResult] = await Promise.all([
      planningDb.from("healthcare_facilities").select("id,name,facility_type,microarea,paese,address,active").order("name"),
      planningDb.from("appointments").select("id,date,time,name,delete_reason").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      planningDb.from("audit_log").select("id,entity_type,action,source,created_at").order("created_at", { ascending: false }).limit(30),
      planningDb.from("weekly_plans").select("id,week_start,status,rationale,change_set_id").order("week_start", { ascending: false }).limit(8),
      planningDb.from("appointments").select("id,date,time,name,microarea,address,planning_status,is_locked,change_set_id").gte("date", weekStart).lte("date", format(addDays(new Date(`${weekStart}T00:00:00`), 4), "yyyy-MM-dd")).is("deleted_at", null).order("date").order("time"),
      planningDb.from("plan_conflicts").select("id,severity,message,context").is("resolved_at", null).order("created_at", { ascending: false }),
      planningDb.from("import_staging").select("id,row_number,classification,normalized_data").in("classification", ["possibile_duplicato", "incompleto_ambiguo"]).is("applied_at", null).order("created_at", { ascending: false }).limit(50),
      planningDb.from("change_sets").select("id,kind,status,source,summary,created_at").order("created_at", { ascending: false }).limit(30),
      planningDb.from("mcp_access_tokens").select("id,name,token_prefix,scopes,expires_at,revoked_at,last_used_at,created_at").order("created_at", { ascending: false }),
    ]);
    setFacilities(facilityResult.data || []);
    setTrash(trashResult.data || []);
    setAudit(auditResult.data || []);
    setPlans(plansResult.data || []);
    setPlannedAppointments(appointmentsResult.data || []);
    setConflicts(conflictsResult.data || []);
    setReviewRows(reviewResult.data || []);
    setChangeSets(changesResult.data || []);
    setMcpTokens(mcpTokensResult.data || []);
  };

  useEffect(() => { refresh(); }, [user]);

  const addFacility = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const { error } = await planningDb.from("healthcare_facilities").insert({
      user_id: user.id,
      name: data.get("name"),
      facility_type: data.get("facility_type"),
      microarea: String(data.get("microarea") || "").trim().toUpperCase(),
      paese: data.get("paese"),
      address: data.get("address"),
    });
    if (error) return toast.error(error.message);
    event.currentTarget.reset();
    toast.success("Struttura salvata");
    refresh();
  };

  const parseFile = async (file: File) => {
    setSourceFile(file);
    const rows = await readRows(file);
    if (importType !== "schedario") {
      setPreview([]);
      setCoveragePreview(rows.map((raw, index) => {
        const item = {
          rowNumber: index + 2,
          cycle_start: column(raw, ["cycle_start", "inizio ciclo", "dal"]),
          cycle_end: column(raw, ["cycle_end", "fine ciclo", "al"]),
          microarea: column(raw, ["microarea", "micro area", "zona"]).toUpperCase(),
          product: column(raw, ["prodotto", "product"]),
          planned_days: column(raw, ["giornate", "planned_days", "giornate previste"]),
          target_value: column(raw, ["target", "target_value", "obiettivo"]),
          actual_value: column(raw, ["ims", "actual_value", "realizzato", "volume"]),
        };
        const required = item.cycle_start && item.cycle_end && item.microarea && (importType === "ab_plan" ? item.planned_days : item.product);
        return { ...item, classification: required ? "certo" as const : "incompleto_ambiguo" as const };
      }));
      return;
    }
    setCoveragePreview([]);
    const { data: doctors } = await planningDb.from("doctors").select("id,name,microarea,external_id");
    const result = rows.map((raw, index) => {
      const row: DoctorImportRow = {
        name: column(raw, ["nome", "medico", "name"]),
        specialty: column(raw, ["specialità", "specialita", "specialty"]),
        paese: column(raw, ["paese", "comune", "town"]),
        microarea: column(raw, ["microarea", "micro area", "zona"]),
        address: column(raw, ["indirizzo", "address"]),
        facility: column(raw, ["struttura", "structure", "facility"]),
        externalId: column(raw, ["external_id", "id esterno", "id"]),
      };
      const classified = classifyDoctorRow(row, (doctors || []).map((d: { id: string; name: string; microarea?: string; external_id?: string }) => ({ ...d, externalId: d.external_id })));
      return { ...classified.normalized, rowNumber: index + 2, classification: classified.classification, matchedDoctorId: classified.match?.id };
    });
    setPreview(result);
  };

  const stageImport = async () => {
    if (!user || !sourceFile || (!preview.length && !coveragePreview.length)) return;
    setBusy(true);
    try {
      const bytes = new Uint8Array(await sourceFile.arrayBuffer());
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
      const path = `${user.id}/${crypto.randomUUID()}-${sourceFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage.from("planning-imports").upload(path, sourceFile, { upsert: false });
      if (upload.error) throw upload.error;
      const rowsCount = importType === "schedario" ? preview.length : coveragePreview.length;
      const created = await planningDb.from("imports").insert({ user_id: user.id, import_type: importType, file_name: sourceFile.name, storage_path: path, file_hash: hash, status: "analizzato", total_records: rowsCount }).select("id").single();
      if (created.error) throw created.error;
      const staged = importType === "schedario"
        ? preview.map((row) => ({ user_id: user.id, import_id: created.data.id, row_number: row.rowNumber, raw_data: row, normalized_data: row, classification: row.classification, matched_doctor_id: row.matchedDoctorId || null }))
        : coveragePreview.map((row) => ({ user_id: user.id, import_id: created.data.id, row_number: row.rowNumber, raw_data: row, normalized_data: row, classification: row.classification }));
      const stageResult = await planningDb.from(importType === "schedario" ? "import_staging" : "coverage_import_staging").insert(staged);
      if (stageResult.error) throw stageResult.error;
      toast.success("Import salvato in staging: nessun dato dello schedario è stato modificato");
      if (importType === "schedario") setStagedImportId(created.data.id); else setStagedCoverageId(created.data.id);
      setPreview([]);
      setCoveragePreview([]);
      setSourceFile(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'importazione");
    } finally { setBusy(false); }
  };

  const applyCoverage = async () => {
    if (!stagedCoverageId) return;
    setBusy(true);
    const { data, error } = await planningDb.rpc("apply_coverage_import", { p_import_id: stagedCoverageId, p_idempotency_key: `${importType}:${stagedCoverageId}` });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${data.applied || 0} righe commerciali applicate`);
    setStagedCoverageId(null); refresh();
  };

  const generatePlan = async () => {
    setBusy(true);
    const { data, error } = await planningDb.rpc("generate_weekly_plan", { p_week_start: weekStart, p_idempotency_key: `plan:${weekStart}:${crypto.randomUUID()}` });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Piano creato: ${data.proposals || 0} proposte, ${data.conflicts || 0} conflitti`); refresh();
  };

  const approvePlan = async (id: string) => {
    const { data, error } = await supabase.rpc("approve_weekly_plan", { p_plan_id: id });
    if (error) return toast.error(error.message);
    toast.success(`${data} proposte approvate e protette`); refresh();
  };

  const restoreChangeSet = async (id: string) => {
    const { error } = await planningDb.rpc("restore_change_set", { p_change_set_id: id });
    if (error) return toast.error(error.message);
    toast.success("Changeset ripristinato in sicurezza"); refresh();
  };

  const resolveReview = async (id: string, resolution: "nuovo_certo" | "ignora") => {
    const { error } = await planningDb.rpc("resolve_import_row", { p_row_id: id, p_resolution: resolution });
    if (error) return toast.error(error.message);
    toast.success(resolution === "ignora" ? "Riga ignorata" : "Riga classificata come nuovo medico certo"); refresh();
  };

  const applyCertain = async () => {
    if (!stagedImportId) return;
    setBusy(true);
    const { data, error } = await planningDb.rpc("apply_certain_doctor_import", {
      p_import_id: stagedImportId,
      p_idempotency_key: `schedario:${stagedImportId}`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Changeset applicato: ${data.inserted || 0} nuovi, ${data.updated || 0} aggiornati`);
    setStagedImportId(null);
    refresh();
  };

  const restore = async (id: string) => {
    const { error } = await supabase.rpc("restore_appointment", { p_appointment_id: id });
    if (error) return toast.error(error.message);
    toast.success("Appuntamento ripristinato e nuovamente protetto");
    refresh();
  };

  const snapshot = async () => {
    const { error } = await supabase.rpc("create_data_snapshot", { p_type: "manual", p_change_set_id: null });
    if (error) return toast.error(error.message);
    toast.success("Snapshot privato creato");
    refresh();
  };

  const loadBag = async () => {
    const { data, error } = await supabase.rpc("daily_sample_bag", { p_date: bagDate });
    if (error) return toast.error(error.message);
    setBag(data || []);
  };

  const issueMcpToken = async () => {
    const credential = await createMcpToken();
    const { error } = await planningDb.rpc("create_mcp_access_token", {
      p_name: "Codex desktop",
      p_token_hash: credential.hash,
      p_token_prefix: credential.prefix,
      p_expires_at: null,
    });
    if (error) return toast.error(error.message);
    setNewMcpToken(credential.token);
    toast.success("Token MCP creato: copialo ora, sarà mostrato una sola volta");
    refresh();
  };

  const revokeMcpToken = async (id: string) => {
    const { error } = await planningDb.rpc("revoke_mcp_access_token", { p_token_id: id });
    if (error) return toast.error(error.message);
    toast.success("Accesso MCP revocato");
    refresh();
  };

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiato`);
  };

  const mcpUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medplanner-mcp`;

  return (
    <div className="px-4 pt-5 pb-24 max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wide text-primary font-semibold">Settimana del {weekStart}</p>
        <h1 className="text-2xl font-bold">Pianificazione</h1>
        <p className="text-sm text-muted-foreground mt-1">Proposte, strutture, dati commerciali e protezione dello storico.</p>
      </div>

      <Tabs defaultValue={params.get("tab") || "settimana"}>
        <TabsList className="w-full h-auto grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4">
          <TabsTrigger value="settimana">Settimana</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="strutture">Strutture</TabsTrigger>
          <TabsTrigger value="sicurezza">Sicurezza</TabsTrigger>
        </TabsList>

        <TabsContent value="settimana" className="space-y-4">
          <section className="glass rounded-2xl p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2"><CalendarRange className="h-5 w-5 text-primary" /><h2 className="font-semibold">Piano settimanale</h2></div>
            <p className="text-sm text-muted-foreground">Gli appuntamenti esistenti sono ancore fisse. Le nuove visite generate dal pianificatore restano proposte finché non le approvi.</p>
            <div className="flex gap-2 mt-3"><Button onClick={generatePlan} disabled={busy}>{busy ? "Elaborazione…" : "Genera proposta"}</Button>{plans.find((plan) => plan.week_start === weekStart && plan.status === "proposto") && <Button variant="outline" onClick={() => approvePlan(plans.find((plan) => plan.week_start === weekStart && plan.status === "proposto")!.id)}>Approva piano</Button>}</div>
            <div className="mt-3 rounded-xl bg-warning/10 text-warning p-3 text-xs">La generazione automatica richiede dati AB Plan, R-O/IMS e associazioni medico-prodotto caricati dall’utente. I conflitti vengono segnalati, mai risolti spostando appuntamenti protetti.</div>
          </section>
          {conflicts.length > 0 && <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold mb-2">Conflitti da risolvere</h2>{conflicts.map((conflict) => <div key={conflict.id} className={`text-xs rounded-xl p-3 mb-2 ${conflict.severity === "blocking" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{conflict.message}{conflict.context?.microarea ? ` · ${conflict.context.microarea}` : ""}{conflict.context?.date ? ` · ${conflict.context.date}` : ""}</div>)}</section>}
          <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold mb-3">Vista settimanale</h2><div className="grid sm:grid-cols-5 gap-2">{Array.from({ length: 5 }, (_, offset) => format(addDays(new Date(`${weekStart}T00:00:00`), offset), "yyyy-MM-dd")).map((date) => <div key={date} className="rounded-xl bg-secondary p-3"><strong className="text-xs">{date}</strong><div className="space-y-2 mt-2">{plannedAppointments.filter((item) => item.date === date).map((item) => <div key={item.id} className="text-xs border-l-2 border-primary pl-2"><span className="font-mono">{item.time}</span> {item.name}<div className="text-muted-foreground">{item.microarea} · {item.planning_status}{item.is_locked ? " · protetto" : ""}</div></div>)}</div></div>)}</div></section>
          <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold mb-2">Per microarea e struttura</h2>{Object.entries(plannedAppointments.reduce<Record<string, PlannedAppointment[]>>((groups, item) => { const key = item.microarea || "Senza microarea"; (groups[key] ||= []).push(item); return groups; }, {})).map(([area, rows]) => <div key={area} className="flex justify-between text-sm border-b py-2"><span>{area}</span><span>{rows.length} visite</span></div>)}</section>
          <section className="glass rounded-2xl p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-3"><PackageCheck className="h-5 w-5 text-primary" /><h2 className="font-semibold">Busta giornaliera</h2></div>
            <div className="flex gap-2"><Input type="date" value={bagDate} onChange={(e) => setBagDate(e.target.value)} /><Button onClick={loadBag}>Calcola</Button></div>
            <div className="mt-3 space-y-2">{bag.map((row) => <div key={row.product_id} className="flex justify-between rounded-xl bg-secondary p-3 text-sm"><span>{row.product_name}</span><strong>{row.samples} campioni</strong></div>)}{!bag.length && <p className="text-xs text-muted-foreground">1 campione per ogni paziente-obiettivo delle visite approvate.</p>}</div>
          </section>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <section className="glass rounded-2xl p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-3"><Upload className="h-5 w-5 text-primary" /><h2 className="font-semibold">Aggiorna schedario</h2></div>
            <Label>Tipo import</Label><Select value={importType} onValueChange={(value) => { setImportType(value as typeof importType); setPreview([]); setCoveragePreview([]); setSourceFile(null); }}><SelectTrigger className="my-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="schedario">Schedario medici</SelectItem><SelectItem value="ab_plan">AB Plan</SelectItem><SelectItem value="ro">R-O</SelectItem><SelectItem value="ims">IMS</SelectItem></SelectContent></Select>
            <Label htmlFor="planning-file">File CSV o XLSX</Label>
            <Input id="planning-file" type="file" accept=".csv,.xlsx,.xls" className="mt-2" onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0]).catch(() => toast.error("File non leggibile"))} />
            <p className="text-xs text-muted-foreground mt-2">Il file originale viene conservato in storage privato. L’anteprima non cancella né sovrascrive dati.</p>
          </section>
          {preview.length > 0 && <section className="glass rounded-2xl p-4 shadow-soft"><div className="flex justify-between items-center mb-3"><h2 className="font-semibold">Anteprima ({preview.length})</h2><Button onClick={stageImport} disabled={busy}>{busy ? "Salvataggio…" : "Salva in staging"}</Button></div><div className="max-h-80 overflow-auto space-y-2">{preview.map((row) => <div key={row.rowNumber} className="rounded-xl border p-3 text-sm flex justify-between gap-3"><div><strong>{row.name || "Nome mancante"}</strong><p className="text-xs text-muted-foreground">{row.specialty || "—"} · {row.microarea || "microarea mancante"} · {row.paese || "—"}</p></div><Badge variant="outline">{row.classification.replaceAll("_", " ")}</Badge></div>)}</div></section>}
          {coveragePreview.length > 0 && <section className="glass rounded-2xl p-4 shadow-soft"><div className="flex justify-between items-center mb-3"><h2 className="font-semibold">Anteprima {importType.toUpperCase()} ({coveragePreview.length})</h2><Button onClick={stageImport} disabled={busy}>Salva in staging</Button></div><div className="space-y-2 max-h-80 overflow-auto">{coveragePreview.map((row) => <div key={row.rowNumber} className="rounded-xl border p-3 text-xs flex justify-between"><span>{row.microarea} · {row.product || "copertura territoriale"} · {row.cycle_start} → {row.cycle_end}</span><Badge variant="outline">{row.classification}</Badge></div>)}</div></section>}
          {stagedImportId && <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold">Changeset pronto</h2><p className="text-xs text-muted-foreground my-2">Saranno applicati solo nuovi medici e corrispondenze certe. Duplicati e righe ambigue resteranno in revisione; i campi manuali protetti non saranno sovrascritti.</p><Button onClick={applyCertain} disabled={busy}>Applica modifiche certe</Button></section>}
          {stagedCoverageId && <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold">Dati commerciali pronti</h2><p className="text-xs text-muted-foreground my-2">Verranno applicate soltanto righe complete con prodotto già presente quando richiesto.</p><Button onClick={applyCoverage} disabled={busy}>Applica dati certi</Button></section>}
          {reviewRows.length > 0 && <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold mb-2">Duplicati e ambiguità ({reviewRows.length})</h2>{reviewRows.map((row) => <div key={row.id} className="rounded-xl bg-secondary p-3 mb-2 text-xs"><strong>{row.normalized_data.name || `Riga ${row.row_number}`}</strong><span className="block text-muted-foreground">{row.classification.replaceAll("_", " ")} · {row.normalized_data.microarea || "microarea assente"}</span><div className="flex gap-2 mt-2"><Button size="sm" variant="outline" onClick={() => resolveReview(row.id, "nuovo_certo")} disabled={!row.normalized_data.name || !row.normalized_data.microarea}>Conferma nuovo</Button><Button size="sm" variant="ghost" onClick={() => resolveReview(row.id, "ignora")}>Ignora</Button></div></div>)}</section>}
        </TabsContent>

        <TabsContent value="strutture" className="space-y-4">
          <form onSubmit={addFacility} className="glass rounded-2xl p-4 shadow-soft grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Nuova struttura</h2></div>
            <div><Label>Nome</Label><Input name="name" required /></div>
            <div><Label>Tipo</Label><Select name="facility_type" required><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger><SelectContent>{["ospedale","asl","clinica_privata","poliambulatorio","studio"].map((type) => <SelectItem value={type} key={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Microarea</Label><Input name="microarea" required /></div><div><Label>Paese</Label><Input name="paese" /></div>
            <div className="sm:col-span-2"><Label>Indirizzo</Label><Input name="address" /></div>
            <Button type="submit" className="sm:col-span-2">Salva struttura</Button>
          </form>
          <div className="space-y-2">{facilities.map((facility) => <div key={facility.id} className="glass rounded-2xl p-4 shadow-soft"><div className="flex justify-between"><strong>{facility.name}</strong><Badge>{facility.facility_type.replaceAll("_", " ")}</Badge></div><p className="text-xs text-muted-foreground mt-1">{facility.microarea} · {facility.paese} · {facility.address}</p></div>)}</div>
        </TabsContent>

        <TabsContent value="sicurezza" className="space-y-4">
          <section className="glass rounded-2xl p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2"><KeyRound className="h-5 w-5 text-primary mt-0.5" /><div><h2 className="font-semibold">Collega Codex / ChatGPT tramite MCP</h2><p className="text-xs text-muted-foreground mt-1">Accesso personale revocabile: lettura dati e creazione di sole proposte. Nessuna cancellazione o approvazione automatica.</p></div></div>
              <Button size="sm" onClick={issueMcpToken}>Nuovo token</Button>
            </div>
            <div className="mt-3 rounded-xl bg-secondary p-3 text-xs">
              <div className="flex items-center justify-between gap-2"><code className="break-all">{mcpUrl}</code><Button size="icon" variant="ghost" onClick={() => copyText(mcpUrl, "URL")} aria-label="Copia URL MCP"><Copy className="h-4 w-4" /></Button></div>
            </div>
            {newMcpToken && <div className="mt-3 rounded-xl border border-warning bg-warning/10 p-3"><strong className="text-xs text-warning">Copialo adesso: non sarà più visualizzato.</strong><div className="mt-2 flex items-center gap-2"><code className="text-xs break-all flex-1">{newMcpToken}</code><Button size="icon" variant="outline" onClick={() => copyText(newMcpToken, "Token")} aria-label="Copia token"><Copy className="h-4 w-4" /></Button></div><Button className="mt-2" size="sm" variant="ghost" onClick={() => setNewMcpToken(null)}>Ho salvato il token</Button></div>}
            <p className="text-xs text-muted-foreground mt-3">In Codex: Impostazioni → MCP Servers → Add. Inserisci l’URL qui sopra e il token come Bearer token.</p>
            <div className="mt-3 space-y-2">{mcpTokens.map((token) => <div key={token.id} className="flex items-center justify-between gap-2 border-t pt-2 text-xs"><div><strong>{token.name}</strong> · <code>{token.token_prefix}…</code><div className="text-muted-foreground">{token.revoked_at ? "Revocato" : token.last_used_at ? `Usato ${new Date(token.last_used_at).toLocaleString("it-IT")}` : "Mai usato"}</div></div>{!token.revoked_at && <Button size="icon" variant="ghost" onClick={() => revokeMcpToken(token.id)} aria-label="Revoca token"><Trash2 className="h-4 w-4" /></Button>}</div>)}</div>
          </section>
          <section className="glass rounded-2xl p-4 shadow-soft"><div className="flex justify-between items-center"><div className="flex items-center gap-2"><DatabaseBackup className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">Backup</h2><p className="text-xs text-muted-foreground">Snapshot privato di medici, appuntamenti, prodotti, target e impostazioni.</p></div></div><Button size="sm" onClick={snapshot}>Crea</Button></div></section>
          <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold mb-3">Cestino appuntamenti</h2><div className="space-y-2">{trash.map((appointment) => <div key={appointment.id} className="flex items-center justify-between gap-2 rounded-xl bg-secondary p-3 text-sm"><div><strong>{appointment.name}</strong><p className="text-xs text-muted-foreground">{appointment.date} · {appointment.time} · {appointment.delete_reason || "Nessun motivo"}</p></div><Button size="icon" variant="outline" onClick={() => restore(appointment.id)} aria-label="Ripristina"><Undo2 className="h-4 w-4" /></Button></div>)}{!trash.length && <p className="text-xs text-muted-foreground">Il cestino è vuoto.</p>}</div></section>
          <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold mb-3">Audit recente</h2><div className="space-y-2 max-h-72 overflow-auto">{audit.map((entry) => <div key={entry.id} className="flex justify-between text-xs border-b pb-2"><span>{entry.entity_type} · {entry.action} · {entry.source}</span><time className="text-muted-foreground">{new Date(entry.created_at).toLocaleString("it-IT")}</time></div>)}</div></section>
          <section className="glass rounded-2xl p-4 shadow-soft"><h2 className="font-semibold mb-3">Changeset</h2>{changeSets.map((change) => <div key={change.id} className="flex justify-between items-center gap-2 border-b py-2 text-xs"><div><strong>{change.kind}</strong> · {change.status} · {change.source}<div className="text-muted-foreground">{new Date(change.created_at).toLocaleString("it-IT")}</div></div>{change.status === "applicato" && <Button size="sm" variant="outline" onClick={() => restoreChangeSet(change.id)}>Ripristina</Button>}</div>)}</section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
