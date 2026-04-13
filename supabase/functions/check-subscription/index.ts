import Stripe from "stripe";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUB] ${step}${d}`);
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    // Check if user has a subscription record
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // If no record, create grace period (24h free access)
    if (!sub) {
      const graceEnd = new Date();
      graceEnd.setHours(graceEnd.getHours() + 24);

      await supabase.from("subscriptions").insert({
        user_id: user.id,
        status: "grace_period",
        grace_period_ends_at: graceEnd.toISOString(),
      });

      logStep("Grace period created", { graceEnd: graceEnd.toISOString() });

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

    // Try to find Stripe customer by customer_id in DB or by email
    let customerId = sub.stripe_customer_id;

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save for future lookups
        await supabase.from("subscriptions").update({
          stripe_customer_id: customerId,
        }).eq("user_id", user.id);
        logStep("Found customer by email", { customerId });
      }
    }

    // If DB says active/trialing and has a future period end, trust it even without Stripe customer
    if (!customerId && sub.status === "active" && sub.current_period_end && new Date(sub.current_period_end) > new Date()) {
      logStep("Active subscription from DB (no Stripe customer)", { status: sub.status, planType: sub.plan_type });
      return new Response(JSON.stringify({
        subscribed: true,
        status: sub.status,
        trial_ends_at: sub.trial_ends_at,
        plan_type: sub.plan_type,
        current_period_end: sub.current_period_end,
        grace_period_ends_at: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (customerId) {
      // Check active/trialing subscriptions from Stripe directly
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const stripeSub = subscriptions.data[0];
        const status = stripeSub.status === "trialing" ? "trialing" : stripeSub.status;
        const trialEnd = stripeSub.trial_end
          ? new Date(stripeSub.trial_end * 1000).toISOString()
          : null;
        const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

        // Determine plan type from price
        const priceId = stripeSub.items.data[0]?.price?.id;
        let planType = sub.plan_type;
        if (priceId === "price_1TKN0dLh7Ovc8cezbBgKd2CV") planType = "mensile";
        else if (priceId === "price_1TKN0eLh7Ovc8cezyshTMSbs") planType = "annuale";

        // Sync to DB
        await supabase.from("subscriptions").update({
          status,
          trial_ends_at: trialEnd,
          current_period_end: periodEnd,
          plan_type: planType,
          stripe_subscription_id: stripeSub.id,
        }).eq("user_id", user.id);

        logStep("Subscription found", { status, planType });

        return new Response(JSON.stringify({
          subscribed: status === "active" || status === "trialing",
          status,
          trial_ends_at: trialEnd,
          plan_type: planType,
          current_period_end: periodEnd,
          grace_period_ends_at: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // No active subscription found — check grace period
    const graceEnd = sub.grace_period_ends_at ? new Date(sub.grace_period_ends_at) : null;
    const isGraceExpired = graceEnd && new Date() > graceEnd;

    if (isGraceExpired && sub.status === "grace_period") {
      await supabase.from("subscriptions").update({ status: "expired" }).eq("user_id", user.id);
    }

    logStep("No active subscription", { status: isGraceExpired ? "expired" : sub.status });

    return new Response(JSON.stringify({
      subscribed: false,
      status: isGraceExpired ? "expired" : sub.status,
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
