import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Testo vuoto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Sei un parser di dati medici italiani. Estrai le informazioni del medico dal testo fornito usando la funzione fornita.
Regole:
- Il nome deve essere in formato "Dr. Nome Cognome" (prima lettera maiuscola, resto minuscolo)
- Per specialty: MMG = medico generico/di base, PED = pediatra, ORL, GIN, INT, GASTRO. Default: MMG
- L'indirizzo deve includere via e città
- Per gli orari, usa il formato "HH:MM - HH:MM" per ogni giorno della settimana
- Se un giorno non ha orario, lascia stringa vuota
- Il paese è la città/comune dell'ambulatorio`,
          },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_doctor",
              description: "Estrai le informazioni strutturate del medico dal testo",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nome completo del medico" },
                  specialty: { type: "string", enum: ["MMG", "PED", "ORL", "GIN", "INT", "GASTRO"] },
                  paese: { type: "string", description: "Città/Comune" },
                  microarea: { type: "string", description: "Area geografica" },
                  address: { type: "string", description: "Indirizzo completo" },
                  phone: { type: "string", description: "Numero di telefono" },
                  office_hours: {
                    type: "object",
                    properties: {
                      "Lunedì": { type: "string" },
                      "Martedì": { type: "string" },
                      "Mercoledì": { type: "string" },
                      "Giovedì": { type: "string" },
                      "Venerdì": { type: "string" },
                    },
                  },
                },
                required: ["name", "specialty"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_doctor" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Errore OpenAI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const doctor = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(doctor), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-doctor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
