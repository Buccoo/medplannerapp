import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, TrendingUp, Calendar, Building2, Stethoscope, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type UserRow = {
  user_id: string;
  email: string;
  created_at: string;
  display_name: string | null;
  zona: string | null;
  sub_status: string | null;
  plan_type: string | null;
  current_period_end: string | null;
  doctors_count: number;
  pharmacies_count: number;
  appointments_count: number;
};

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/app");
      return;
    }
    if (isAdmin) fetchUsers();
  }, [isAdmin, adminLoading]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc("admin_get_all_users");
    if (error) {
      toast.error("Errore nel caricamento utenti");
      console.error(error);
      return;
    }
    setUsers((data as UserRow[]) || []);
    setLoading(false);
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalUsers = users.length;
  const activeSubscriptions = users.filter(u => u.sub_status === "active").length;
  const totalDoctors = users.reduce((s, u) => s + (u.doctors_count || 0), 0);
  const totalAppointments = users.reduce((s, u) => s + (u.appointments_count || 0), 0);

  const filtered = users.filter(u =>
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "trialing": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "canceled":
      case "expired": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "grace_period": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const statusLabel = (status: string | null) => {
    switch (status) {
      case "active": return "Attivo";
      case "trialing": return "Trial";
      case "canceled": return "Cancellato";
      case "expired": return "Scaduto";
      case "grace_period": return "Grace Period";
      case "past_due": return "Scaduto";
      default: return "Nessuno";
    }
  };

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Utenti</span>
          </div>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="glass rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Abbonati</span>
          </div>
          <p className="text-2xl font-bold">{activeSubscriptions}</p>
        </div>
        <div className="glass rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Medici Totali</span>
          </div>
          <p className="text-2xl font-bold">{totalDoctors}</p>
        </div>
        <div className="glass rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Appuntamenti</span>
          </div>
          <p className="text-2xl font-bold">{totalAppointments}</p>
        </div>
      </div>

      {/* Revenue section */}
      <div className="glass rounded-2xl p-4 shadow-soft mb-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Entrate</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Abbonamenti attivi</p>
            <p className="text-lg font-bold">{activeSubscriptions}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">MRR stimato</p>
            <p className="text-lg font-bold text-green-500">
              €{(activeSubscriptions * 9.99).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Users list */}
      <h2 className="font-semibold text-lg mb-3">Utenti Registrati</h2>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca utente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u.user_id} className="glass rounded-2xl p-4 shadow-soft space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{u.display_name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor(u.sub_status)}`}>
                {statusLabel(u.sub_status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {u.zona && <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">{u.zona}</span>}
              {u.plan_type && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{u.plan_type}</span>}
              <span className="text-[10px] text-muted-foreground">
                Registrato: {new Date(u.created_at).toLocaleDateString("it-IT")}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" />{u.doctors_count}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{u.pharmacies_count}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{u.appointments_count}</span>
            </div>
            {u.current_period_end && (
              <p className="text-[10px] text-muted-foreground">
                Scadenza: {new Date(u.current_period_end).toLocaleDateString("it-IT")}
              </p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Nessun utente trovato</div>
        )}
      </div>
    </div>
  );
}
