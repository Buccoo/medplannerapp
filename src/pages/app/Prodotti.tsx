import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type Product = { id: number; name: string; target: number; sold: number };

const initial: Product[] = [
  { id: 1, name: "CardioX 100mg", target: 120, sold: 95 },
  { id: 2, name: "NeuroFlex 50mg", target: 80, sold: 62 },
  { id: 3, name: "GastroPro 200mg", target: 200, sold: 180 },
  { id: 4, name: "ImmunoVit Plus", target: 150, sold: 88 },
  { id: 5, name: "DermaShield Crema", target: 60, sold: 60 },
];

export default function Prodotti() {
  const [products, setProducts] = useState(initial);
  const [open, setOpen] = useState(false);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setProducts(prev => [...prev, {
      id: Date.now(),
      name: fd.get("name") as string,
      target: Number(fd.get("target")),
      sold: Number(fd.get("sold") || 0),
    }]);
    setOpen(false);
    toast.success("Prodotto aggiunto");
  };

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prodotti</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-glow h-10 w-10"><Plus className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Nuovo Prodotto</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Nome Prodotto</Label><Input name="name" required className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Target (pezzi)</Label><Input name="target" type="number" required className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Venduti</Label><Input name="sold" type="number" defaultValue={0} className="rounded-xl" /></div>
              <Button type="submit" className="w-full rounded-xl">Aggiungi</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {products.map((p, i) => {
          const pct = Math.min(100, Math.round((p.sold / p.target) * 100));
          const isComplete = pct >= 100;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 shadow-soft"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{p.name}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isComplete ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                }`}>
                  {pct}%
                </span>
              </div>
              <Progress value={pct} className="h-2 rounded-full mb-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{p.sold} venduti</span>
                <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />Target: {p.target}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
