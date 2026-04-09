import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useState } from "react";

export default function SubscriptionBanner() {
  const { status, gracePeriodEndsAt, trialEndsAt, checkout } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: "mensile" | "annuale") => {
    setLoading(plan);
    try {
      await checkout(plan);
    } finally {
      setLoading(null);
    }
  };

  if (status === "grace_period" && gracePeriodEndsAt) {
    const hoursLeft = Math.max(0, Math.ceil((gracePeriodEndsAt.getTime() - Date.now()) / 3600000));
    return (
      <div className="mx-5 mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Benvenuto! Hai {hoursLeft}h per scegliere il tuo piano</p>
            <p className="text-sm text-amber-700 mt-1">Scegli un piano per continuare a usare MedPlanner. Include 7 giorni di prova gratuita!</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleCheckout("mensile")}
                disabled={!!loading}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading === "mensile" ? "..." : "Mensile €3,99/mese"}
              </button>
              <button
                onClick={() => handleCheckout("annuale")}
                disabled={!!loading}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50"
              >
                {loading === "annuale" ? "..." : "Annuale €39,90/anno"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "trialing" && trialEndsAt) {
    const daysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000));
    return (
      <div className="mx-5 mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Prova gratuita — {daysLeft} giorni rimanenti</p>
            <p className="text-sm text-blue-700 mt-1">Il tuo abbonamento si attiverà automaticamente al termine della prova.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "past_due") {
    return (
      <div className="mx-5 mt-4 rounded-2xl bg-red-50 border border-red-200 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Pagamento non riuscito</p>
            <p className="text-sm text-red-700 mt-1">Aggiorna il metodo di pagamento per continuare a usare MedPlanner.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "canceled" || status === "expired") {
    return (
      <div className="mx-5 mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Abbonamento scaduto</p>
            <p className="text-sm text-gray-700 mt-1">Riattiva il tuo abbonamento per continuare.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleCheckout("mensile")}
                disabled={!!loading}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading === "mensile" ? "..." : "Mensile €3,99"}
              </button>
              <button
                onClick={() => handleCheckout("annuale")}
                disabled={!!loading}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50"
              >
                {loading === "annuale" ? "..." : "Annuale €39,90"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
