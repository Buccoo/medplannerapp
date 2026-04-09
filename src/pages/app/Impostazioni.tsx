import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Impostazioni() {
  const navigate = useNavigate();
  const { accentHsl, setAccentHsl, colors } = useAccentColor();

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-5 shadow-soft mb-6">
        <h2 className="font-semibold mb-4">Profilo</h2>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Nome</Label><Input defaultValue="Marco Informatore" className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input defaultValue="marco@esempio.it" className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>Zona</Label><Input defaultValue="Lombardia" className="rounded-xl" /></div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold mb-4">Colore Accento</h2>
        <div className="grid grid-cols-4 gap-3">
          {colors.map(c => (
            <button
              key={c.hsl}
              onClick={() => setAccentHsl(c.hsl)}
              className={cn(
                "h-12 rounded-xl transition-all flex items-center justify-center",
                accentHsl === c.hsl ? "ring-2 ring-offset-2 ring-foreground scale-105" : "hover:scale-105"
              )}
              style={{ backgroundColor: `hsl(${c.hsl})` }}
              title={c.name}
            >
              {accentHsl === c.hsl && <Check className="h-5 w-5" style={{ color: "white" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
