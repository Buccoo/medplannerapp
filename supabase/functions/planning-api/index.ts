import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const authorization = request.headers.get("authorization");
  if (!authorization) return json({ error: "AUTH_REQUIRED" }, 401);
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) return json({ error: "AUTH_INVALID" }, 401);
  const userId = authData.user.id;

  try {
    const body = await request.json();
    const operation = String(body.operation || "");
    if (operation === "snapshot.read") {
      const [doctors, facilities, products, targets, plans, appointments] = await Promise.all([
        client.from("doctors").select("*"), client.from("healthcare_facilities").select("*"),
        client.from("products").select("*"), client.from("coverage_inputs").select("*"),
        client.from("weekly_plans").select("*"), client.from("appointments").select("*").is("deleted_at", null),
      ]);
      return json({ doctors: doctors.data, facilities: facilities.data, products: products.data, targets: targets.data, plans: plans.data, appointments: appointments.data });
    }
    if (operation === "agenda.read") {
      let query = client.from("appointments").select("*").is("deleted_at", null).order("date").order("time");
      if (body.from) query = query.gte("date", body.from);
      if (body.to) query = query.lte("date", body.to);
      const result = await query;
      if (result.error) throw result.error;
      return json({ appointments: result.data });
    }
    if (operation === "bag.calculate") {
      const result = await client.rpc("daily_sample_bag", { p_date: body.date });
      if (result.error) throw result.error;
      return json({ products: result.data });
    }
    if (operation === "changeset.read") {
      const result = await client.from("change_sets").select("*").eq("id", body.id).maybeSingle();
      if (result.error) throw result.error;
      return json({ changeSet: result.data });
    }
    if (operation === "appointment.propose") {
      const proposal = body.appointment || {};
      if (!proposal.date || !proposal.time || !proposal.name) return json({ error: "INVALID_APPOINTMENT" }, 400);
      const monday = new Date(`${proposal.date}T00:00:00Z`);
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      const sunday = new Date(monday); sunday.setUTCDate(sunday.getUTCDate() + 6);
      if (proposal.doctor_id) {
        const duplicate = await client.from("appointments").select("id").eq("doctor_id", proposal.doctor_id)
          .gte("date", monday.toISOString().slice(0, 10)).lte("date", sunday.toISOString().slice(0, 10)).is("deleted_at", null).limit(1);
        if (duplicate.data?.length) return json({ error: "DOCTOR_ALREADY_IN_WEEK" }, 409);
      }
      const result = await client.from("appointments").insert({ user_id: userId, ...proposal,
        planning_status: "proposto", status: "programmato", source: "ai", is_locked: false,
      }).select("*").single();
      if (result.error) throw result.error;
      return json({ appointment: result.data }, 201);
    }
    if (operation === "import.dry_run") {
      const result = await client.from("import_staging").select("*").eq("import_id", body.import_id).order("row_number");
      if (result.error) throw result.error;
      return json({ rows: result.data, applied: false });
    }
    if (operation === "import.apply_certain") {
      if (!body.import_id || !body.idempotency_key) return json({ error: "IMPORT_AND_IDEMPOTENCY_REQUIRED" }, 400);
      const result = await client.rpc("apply_certain_doctor_import", { p_import_id: body.import_id, p_idempotency_key: body.idempotency_key });
      if (result.error) throw result.error;
      return json({ result: result.data });
    }
    if (operation === "weekly_plan.generate") {
      if (!body.week_start || !body.idempotency_key) return json({ error: "WEEK_AND_IDEMPOTENCY_REQUIRED" }, 400);
      const result = await client.rpc("generate_weekly_plan", { p_week_start: body.week_start, p_idempotency_key: body.idempotency_key });
      if (result.error) throw result.error;
      return json({ result: result.data });
    }
    return json({ error: "UNKNOWN_OPERATION" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "INTERNAL_ERROR" }, 500);
  }
});
