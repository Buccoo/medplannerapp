import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "read_daily_priorities",
  title: "Leggi priorità della giornata",
  description: "Legge le priorità annotate per una data specifica (formato AAAA-MM-GG).",
  inputSchema: { date: z.string().describe("Data della giornata, formato AAAA-MM-GG.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("daily_priorities")
      .select("date,content")
      .eq("date", date)
      .maybeSingle();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: data?.content ?? "Nessuna priorità per questa data." }],
          structuredContent: { date, content: data?.content ?? null },
        };
  },
});
