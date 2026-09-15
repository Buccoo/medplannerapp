import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Richiesta non valida: manca l'identificativo di autorizzazione.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Il server di autorizzazione non ha restituito un indirizzo di ritorno.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="glass-strong rounded-3xl shadow-soft p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">
          <span className="text-gradient">Med</span>Planner
        </h1>
        {error ? (
          <p className="text-sm text-destructive mt-4">{error}</p>
        ) : !details ? (
          <p className="text-sm text-muted-foreground mt-4">Caricamento…</p>
        ) : (
          <>
            <p className="text-base font-medium mt-4">
              Collega {details.client?.name ?? "l'applicazione"} al tuo account
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Potrà leggere la tua agenda, i tuoi medici e le tue farmacie e creare appuntamenti al posto tuo.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 rounded-xl" disabled={busy} onClick={() => decide(false)}>
                Rifiuta
              </Button>
              <Button className="flex-1 rounded-xl shadow-glow" disabled={busy} onClick={() => decide(true)}>
                Autorizza
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
