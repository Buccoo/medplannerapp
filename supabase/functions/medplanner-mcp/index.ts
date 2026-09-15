import { createClient } from "@supabase/supabase-js";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, mcp-protocol-version, mcp-session-id",
  "access-control-allow-methods": "POST, OPTIONS",
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
});
const rpcError = (id: unknown, code: number, message: string, status = 200) =>
  response({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, status);
const toolResult = (data: unknown) => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  structuredContent: data,
});
const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const mondayFor = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.valueOf())) throw new Error("INVALID_DATE");
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
};
const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, boolean | string>;
  requiredScope?: "propose";
};

const tools: ToolDefinition[] = [
  {
    name: "read_agenda",
    description: "Legge gli appuntamenti non eliminati in un intervallo di date.",
    inputSchema: { type: "object", properties: { from: { type: "string", format: "date" }, to: { type: "string", format: "date" } }, additionalProperties: false },
    annotations: { title: "Leggi agenda", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "read_doctors",
    description: "Cerca i medici dello schedario per nome o microarea.",
    inputSchema: { type: "object", properties: { search: { type: "string" }, microarea: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 100, default: 50 } }, additionalProperties: false },
    annotations: { title: "Cerca medici", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "read_weekly_plan",
    description: "Legge piano, giornate, appuntamenti e conflitti della settimana indicata (lunedì).",
    inputSchema: { type: "object", required: ["week_start"], properties: { week_start: { type: "string", format: "date" } }, additionalProperties: false },
    annotations: { title: "Leggi piano settimanale", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "calculate_daily_bag",
    description: "Calcola i campioni prodotto per le visite approvate di una data.",
    inputSchema: { type: "object", required: ["date"], properties: { date: { type: "string", format: "date" } }, additionalProperties: false },
    annotations: { title: "Calcola busta giornaliera", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "propose_appointment",
    description: "Crea una visita in stato proposto. Non approva, non protegge e non sposta appuntamenti esistenti.",
    inputSchema: { type: "object", required: ["doctor_id", "date", "time"], properties: { doctor_id: { type: "string", format: "uuid" }, date: { type: "string", format: "date" }, time: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" } }, additionalProperties: false },
    annotations: { title: "Proponi appuntamento", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    requiredScope: "propose",
  },
  {
    name: "generate_weekly_proposal",
    description: "Genera un piano settimanale di sole proposte senza modificare gli appuntamenti protetti.",
    inputSchema: { type: "object", required: ["week_start"], properties: { week_start: { type: "string", format: "date" } }, additionalProperties: false },
    annotations: { title: "Genera proposta settimanale", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    requiredScope: "propose",
  },
];

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return response({ error: "METHOD_NOT_ALLOWED" }, 405);
  let message: Record<string, unknown>;
  try { message = await request.json(); } catch { return rpcError(null, -32700, "Parse error", 400); }
  const id = message.id;
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(mp_[A-Za-z0-9_-]+)$/i);
  if (!match) return rpcError(id, -32001, "Bearer token MCP mancante o non valido", 401);

  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = await sha256(match[1]);
  const tokenResult = await client.from("mcp_access_tokens")
    .select("id,user_id,scopes,expires_at,revoked_at")
    .eq("token_hash", tokenHash).maybeSingle();
  const token = tokenResult.data;
  if (tokenResult.error || !token || token.revoked_at || (token.expires_at && new Date(token.expires_at) <= new Date())) {
    return rpcError(id, -32001, "Token MCP scaduto, revocato o sconosciuto", 401);
  }
  await client.from("mcp_access_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", token.id);

  const method = String(message.method || "");
  const params = (message.params || {}) as Record<string, unknown>;
  if (method === "initialize") {
    const requested = String((params as { protocolVersion?: string }).protocolVersion || "2025-06-18");
    return response({ jsonrpc: "2.0", id, result: { protocolVersion: requested, capabilities: { tools: { listChanged: false } }, serverInfo: { name: "MedPlanner", version: "1.0.0" } } });
  }
  if (method === "notifications/initialized") return new Response(null, { status: 204, headers: cors });
  if (method === "ping") return response({ jsonrpc: "2.0", id, result: {} });
  if (method === "tools/list") {
    const allowed = tools.filter((tool) => !tool.requiredScope || token.scopes.includes(tool.requiredScope));
    return response({ jsonrpc: "2.0", id, result: { tools: allowed.map(({ requiredScope: _scope, ...tool }) => tool) } });
  }
  if (method !== "tools/call") return rpcError(id, -32601, "Method not found");

  const toolName = String(params.name || "");
  const args = (params.arguments || {}) as Record<string, unknown>;
  const definition = tools.find((tool) => tool.name === toolName);
  if (!definition) return rpcError(id, -32602, "Strumento sconosciuto");
  if (definition.requiredScope && !token.scopes.includes(definition.requiredScope)) return rpcError(id, -32003, "Permesso insufficiente", 403);

  try {
    let data: unknown;
    if (toolName === "read_agenda") {
      let query = client.from("appointments").select("id,date,time,name,type,status,planning_status,is_locked,doctor_id,address,paese,microarea,source").eq("user_id", token.user_id).is("deleted_at", null).order("date").order("time").limit(500);
      if (args.from) query = query.gte("date", String(args.from));
      if (args.to) query = query.lte("date", String(args.to));
      const result = await query; if (result.error) throw result.error;
      data = { appointments: result.data };
    } else if (toolName === "read_doctors") {
      let query = client.from("doctors").select("id,name,specialty,paese,microarea,address,last_visit_date").eq("user_id", token.user_id).order("name").limit(Math.min(Number(args.limit) || 50, 100));
      if (args.microarea) query = query.eq("microarea", String(args.microarea).trim().toUpperCase());
      if (args.search) query = query.ilike("name", `%${String(args.search).replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
      const result = await query; if (result.error) throw result.error;
      data = { doctors: result.data };
    } else if (toolName === "read_weekly_plan") {
      const weekStart = String(args.week_start || "");
      const end = addDays(weekStart, 4);
      const [plan, days, appointments] = await Promise.all([
        client.from("weekly_plans").select("*").eq("user_id", token.user_id).eq("week_start", weekStart).maybeSingle(),
        client.from("weekly_plan_days").select("*").eq("user_id", token.user_id).gte("plan_date", weekStart).lte("plan_date", end).order("plan_date"),
        client.from("appointments").select("id,date,time,name,planning_status,is_locked,microarea,address,doctor_id").eq("user_id", token.user_id).gte("date", weekStart).lte("date", end).is("deleted_at", null).order("date").order("time"),
      ]);
      if (plan.error || days.error || appointments.error) throw plan.error || days.error || appointments.error;
      let conflicts: unknown[] = [];
      if (plan.data?.id) {
        const result = await client.from("plan_conflicts").select("severity,message,context,resolved_at").eq("user_id", token.user_id).eq("weekly_plan_id", plan.data.id);
        if (result.error) throw result.error; conflicts = result.data || [];
      }
      data = { plan: plan.data, days: days.data, appointments: appointments.data, conflicts };
    } else if (toolName === "calculate_daily_bag") {
      const result = await client.rpc("mcp_daily_sample_bag", { p_user_id: token.user_id, p_date: String(args.date || "") });
      if (result.error) throw result.error; data = { products: result.data };
    } else if (toolName === "generate_weekly_proposal") {
      const weekStart = String(args.week_start || "");
      if (mondayFor(weekStart) !== weekStart) throw new Error("WEEK_START_MUST_BE_MONDAY");
      const result = await client.rpc("mcp_generate_weekly_plan", { p_user_id: token.user_id, p_week_start: weekStart, p_idempotency_key: `mcp:${token.id}:${weekStart}` });
      if (result.error) throw result.error; data = result.data;
    } else if (toolName === "propose_appointment") {
      const doctorId = String(args.doctor_id || "");
      const date = String(args.date || "");
      const time = String(args.time || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("INVALID_DATE_OR_TIME");
      const doctorResult = await client.from("doctors").select("id,name,address,paese,microarea").eq("user_id", token.user_id).eq("id", doctorId).maybeSingle();
      if (doctorResult.error || !doctorResult.data) throw new Error("DOCTOR_NOT_FOUND");
      const monday = mondayFor(date);
      const [duplicate, occupied] = await Promise.all([
        client.from("appointments").select("id").eq("user_id", token.user_id).eq("doctor_id", doctorId).gte("date", monday).lte("date", addDays(monday, 6)).is("deleted_at", null).limit(1),
        client.from("appointments").select("id").eq("user_id", token.user_id).eq("date", date).eq("time", time).is("deleted_at", null).limit(1),
      ]);
      if (duplicate.data?.length) throw new Error("DOCTOR_ALREADY_IN_WEEK");
      if (occupied.data?.length) throw new Error("SLOT_ALREADY_OCCUPIED");
      if (time >= "12:30" && time < "14:30") throw new Error("STRUCTURE_SLOT_REQUIRES_APP_SELECTION");
      const doctor = doctorResult.data;
      const result = await client.from("appointments").insert({ user_id: token.user_id, doctor_id: doctor.id, date, time, name: doctor.name, address: doctor.address, paese: doctor.paese, microarea: doctor.microarea, type: "medico", status: "programmato", planning_status: "proposto", is_locked: false, source: "ai" }).select("id,date,time,name,planning_status,is_locked").single();
      if (result.error) throw result.error; data = { appointment: result.data };
    }
    return response({ jsonrpc: "2.0", id, result: toolResult(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    return response({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: message }], isError: true } });
  }
});
