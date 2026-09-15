import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "read_agenda",
  title: "Leggi agenda",
  description: "Elenca gli appuntamenti dell'utente in un intervallo di date (formato AAAA-MM-GG).",
  inputSchema: {
    from: z.string().describe("Data iniziale inclusa, formato AAAA-MM-GG.").optional(),
    to: z.string().describe("Data finale inclusa, formato AAAA-MM-GG.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("appointments")
      .select("id,date,time,name,type,status,planning_status,address,paese,microarea,notes")
      .is("deleted_at", null)
      .order("date")
      .order("time")
      .limit(300);
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: { appointments: data ?? [] },
        };
  },
});
