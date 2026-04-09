import { motion } from "framer-motion";
import { Users, Calendar, Target, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const stats = [
  { label: "Medici", value: 48, icon: Users, color: "bg-primary/10 text-primary" },
  { label: "Oggi", value: 5, icon: Calendar, color: "bg-success/10 text-success" },
  { label: "Obiettivi", value: "72%", icon: Target, color: "bg-warning/10 text-warning" },
];

const chartData = [
  { name: "CardioX", target: 120, sold: 95 },
  { name: "NeuroFlex", target: 80, sold: 62 },
  { name: "GastroPro", target: 200, sold: 180 },
  { name: "ImmunoVit", target: 150, sold: 88 },
];

const anim = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08 } });

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Buongiorno 👋</p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <button onClick={() => navigate("/app/impostazioni")} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...anim(i)} className="glass rounded-2xl p-4 shadow-soft text-center">
            <div className={`h-9 w-9 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div {...anim(3)} className="glass rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold mb-4">Obiettivi Prodotti</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Bar dataKey="target" radius={[6, 6, 0, 0]} fill="hsl(var(--muted))">
              {chartData.map((_, i) => <Cell key={i} />)}
            </Bar>
            <Bar dataKey="sold" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))">
              {chartData.map((_, i) => <Cell key={i} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-muted inline-block" />Target</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary inline-block" />Venduti</span>
        </div>
      </motion.div>
    </div>
  );
}
