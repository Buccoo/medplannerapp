import { corsHeaders } from '@supabase/supabase-js/cors';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { fileBase64, fileName, microareas, products } = await req.json();

    if (!fileBase64 || !Array.isArray(microareas) || !Array.isArray(products)) {
      return new Response(JSON.stringify({ error: 'Parametri mancanti' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64 to bytes
    const binary = atob(fileBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Parse workbook
    const wb = XLSX.read(bytes, { type: 'array' });
    const sheetsText: string[] = [];
    for (const sn of wb.SheetNames) {
      const ws = wb.Sheets[sn];
      // Convert to CSV-like for AI; cap rows to keep prompt reasonable
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: '|', blankrows: false });
      const lines = csv.split('\n').slice(0, 400); // safety cap
      sheetsText.push(`--- Sheet: ${sn} ---\n${lines.join('\n')}`);
    }
    const fullText = sheetsText.join('\n\n').slice(0, 60000);

    const productNames = products.map((p: any) => p.name);

    const systemPrompt = `Sei un assistente che estrae dati di vendita farmaceutici da file Excel aziendali.
Devi restituire SOLO i dati relativi alle microaree dell'utente: ${microareas.join(', ')}.
Ignora tutte le altre microaree/zone presenti nel file.
I prodotti dell'utente sono: ${productNames.join(', ')}. Mappa i nomi anche se non esattamente identici (case-insensitive, ignora spazi extra).
Per ogni combinazione prodotto+microarea+ciclo estrai:
- company_target: l'obiettivo aziendale (target/budget/obiettivo) per quel ciclo
- monthly_sold: array [m1, m2, m3] dei pezzi venduti nei 3 mesi del ciclo (se disponibile)
I cicli sono: 1=Gen-Mar, 2=Apr-Giu, 3=Lug-Set, 4=Ott-Dic. Usa cycle_index 0..3.
Se un valore non è disponibile metti null. Non inventare dati.`;

    const tools = [{
      type: 'function',
      function: {
        name: 'extract_company_data',
        description: 'Estrae i dati aziendali filtrati per microaree utente',
        parameters: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_name: { type: 'string', description: 'Nome prodotto come appare nei prodotti utente' },
                  microarea: { type: 'string', description: `Una di: ${microareas.join(', ')}` },
                  cycle_index: { type: 'number', description: '0=Gen-Mar, 1=Apr-Giu, 2=Lug-Set, 3=Ott-Dic' },
                  company_target: { type: ['number', 'null'] },
                  monthly_sold: {
                    type: ['array', 'null'],
                    items: { type: ['number', 'null'] },
                    description: 'Array di 3 valori per i 3 mesi del ciclo'
                  },
                },
                required: ['product_name', 'microarea', 'cycle_index'],
                additionalProperties: false,
              }
            }
          },
          required: ['rows'],
          additionalProperties: false,
        }
      }
    }];

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `File: ${fileName}\n\nContenuto:\n${fullText}` },
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'extract_company_data' } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite richieste AI superato. Riprova tra poco.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'Crediti AI esauriti. Aggiungi crediti al workspace Lovable.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await aiResp.text();
      console.error('AI error', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'Errore AI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: 'AI non ha restituito dati strutturati', raw: aiData }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);
    const rows = (args.rows || []).filter((r: any) => microareas.includes(r.microarea));

    // Map product_name to product_id
    const enriched = rows.map((r: any) => {
      const p = products.find((p: any) =>
        p.name.trim().toLowerCase() === String(r.product_name).trim().toLowerCase()
      );
      return { ...r, product_id: p?.id || null };
    }).filter((r: any) => r.product_id);

    return new Response(JSON.stringify({ rows: enriched, totalFound: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('import-company-excel error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});