import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_doctors",
  title: "Cerca medici",
  description: "Cerca i medici dello schedario per nome, specialità o microarea.",
  inputSchema: {
    search: z.string().describe("Testo da cercare nel nome del medico.").optional(),
    microarea: z.string().describe("Codice microarea, ad esempio LE07.").optional(),
    limit: z.number().int().describe("Numero massimo di risultati, massimo 100.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, microarea, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("doctors")
      .select("id,name,specialty,paese,microarea,address,phone,office_hours,last_visit_date,birth_year")
      .order("name")
      .limit(Math.min(Math.max(limit ?? 50, 1), 100));
    if (microarea) query = query.eq("microarea", microarea.trim().toUpperCase());
    if (search) {
      const escaped = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
      query = query.ilike("name", `%${escaped}%`);
    }
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: { doctors: data ?? [] },
        };
  },
});
