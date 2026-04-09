import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get("mode") === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      toast.success("Registrazione completata! Benvenuto in MedPlanner.");
    } else {
      toast.success("Accesso effettuato con successo!");
    }
    navigate("/app");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-strong rounded-3xl shadow-soft p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-gradient">Med</span>Planner
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRegister ? "Crea il tuo account" : "Accedi al tuo account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Mario Rossi" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="mario@esempio.it" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl" required />
          </div>
          <Button type="submit" className="w-full rounded-xl shadow-glow" size="lg">
            {isRegister ? "Registrati" : "Accedi"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isRegister ? "Hai già un account?" : "Non hai un account?"}{" "}
          <button onClick={() => setIsRegister(!isRegister)} className="text-primary font-medium hover:underline">
            {isRegister ? "Accedi" : "Registrati"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
