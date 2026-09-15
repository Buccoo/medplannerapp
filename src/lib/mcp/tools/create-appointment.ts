import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_appointment",
  title: "Crea appuntamento",
  description:
    "Crea un nuovo appuntamento in agenda per l'utente collegato, con stato di pianificazione 'proposto'.",
  inputSchema: {
    date: z.string().describe("Data dell'appuntamento, formato AAAA-MM-GG."),
    time: z.string().describe("Orario dell'appuntamento, formato HH:MM."),
    name: z.string().trim().describe("Nome del medico o della farmacia."),
    type: z.enum(["medico", "farmacia"]).describe("Tipo di visita."),
    address: z.string().describe("Indirizzo o struttura.").optional(),
    paese: z.string().describe("Paese o comune.").optional(),
    microarea: z.string().describe("Codice microarea, ad esempio LE07.").optional(),
    notes: z.string().describe("Note sulla visita.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("appointments")
      .insert({
        user_id: ctx.getUserId(),
        date: input.date,
        time: input.time,
        name: input.name,
        type: input.type,
        address: input.address ?? null,
        paese: input.paese ?? null,
        microarea: input.microarea ? input.microarea.trim().toUpperCase() : null,
        current_visit_notes: input.notes ?? null,
        status: "programmato",
        planning_status: "proposto",
        source: "ai",
      })
      .select()
      .maybeSingle();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [
            { type: "text", text: `Appuntamento creato il ${input.date} alle ${input.time} con ${input.name}.` },
          ],
          structuredContent: { appointment: data },
        };
  },
});
