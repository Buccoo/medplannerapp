import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, Target, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";


const anim = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08 } });

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctorCount, setDoctorCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [chartData, setChartData] = useState<{ name: string; target: number; sold: number }[]>([]);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    
    // Fetch counts
    supabase.from("doctors").select("id", { count: "exact", head: true }).then(({ count }) => setDoctorCount(count || 0));
    
    const todayStr = new Date().toISOString().split("T")[0];
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("date", todayStr).then(({ count }) => setTodayCount(count || 0));
    
    // Fetch products for chart
    supabase.from("products").select("name, sold, cycles").then(({ data }) => {
      if (data) {
        const ci = Math.floor(new Date().getMonth() / 3);
        setChartData(data.map(p => {
          const cycles = p.cycles as unknown as { month1: number; month2: number; month3: number }[];
          const c = cycles?.[ci] || { month1: 0, month2: 0, month3: 0 };
          return { name: p.name.split(" ")[0], target: c.month1 + c.month2 + c.month3, sold: p.sold };
        }));
      }
    });

    // Fetch user name
    supabase.from("user_settings").select("display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name || user.user_metadata?.full_name || "");
    });
  }, [user]);

  const stats = [
    { label: "Medici", value: doctorCount, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Oggi", value: todayCount, icon: Calendar, color: "bg-success/10 text-success" },
    { label: "Prodotti", value: chartData.length, icon: Target, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Buongiorno{displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋</p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <button onClick={() => navigate("/app/impostazioni")} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...anim(i)} className="glass rounded-2xl p-4 shadow-soft text-center">
            <div className={`h-9 w-9 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}><s.icon className="h-4 w-4" /></div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {chartData.length > 0 && (
        <motion.div {...anim(3)} className="glass rounded-2xl p-5 shadow-soft">
          <h2 className="font-semibold mb-4">Obiettivi Prodotti</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="target" radius={[6, 6, 0, 0]} fill="hsl(var(--muted))">{chartData.map((_, i) => <Cell key={i} />)}</Bar>
              <Bar dataKey="sold" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))">{chartData.map((_, i) => <Cell key={i} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-muted inline-block" />Target</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary inline-block" />Venduti</span>
          </div>
        </motion.div>
      )}

      {chartData.length === 0 && (
        <motion.div {...anim(3)} className="glass rounded-2xl p-8 shadow-soft text-center">
          <p className="text-muted-foreground text-sm">Aggiungi medici e prodotti per vedere le statistiche qui.</p>
        </motion.div>
      )}
    </div>
  );
}
