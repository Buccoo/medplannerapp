import Stripe from "stripe";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Auth error");

    const user = userData.user;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    // Check grace period first
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // If no record, create grace period
    if (!sub) {
      const graceEnd = new Date();
      graceEnd.setHours(graceEnd.getHours() + 24);

      await supabase.from("subscriptions").insert({
        user_id: user.id,
        status: "grace_period",
        grace_period_ends_at: graceEnd.toISOString(),
      });

      return new Response(JSON.stringify({
        subscribed: false,
        status: "grace_period",
        grace_period_ends_at: graceEnd.toISOString(),
        trial_ends_at: null,
        plan_type: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If there's a stripe customer, check live status from Stripe
    if (sub.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: sub.stripe_customer_id,
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const stripeSub = subscriptions.data[0];
        const status = stripeSub.status === "trialing" ? "trialing" : stripeSub.status;
        const trialEnd = stripeSub.trial_end
          ? new Date(stripeSub.trial_end * 1000).toISOString()
          : null;
        const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

        // Sync to DB
        await supabase.from("subscriptions").update({
          status,
          trial_ends_at: trialEnd,
          current_period_end: periodEnd,
        }).eq("user_id", user.id);

        return new Response(JSON.stringify({
          subscribed: status === "active" || status === "trialing",
          status,
          trial_ends_at: trialEnd,
          plan_type: sub.plan_type,
          current_period_end: periodEnd,
          grace_period_ends_at: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Return current DB state (grace period or expired)
    return new Response(JSON.stringify({
      subscribed: false,
      status: sub.status,
      grace_period_ends_at: sub.grace_period_ends_at,
      trial_ends_at: sub.trial_ends_at,
      plan_type: sub.plan_type,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-subscription error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
