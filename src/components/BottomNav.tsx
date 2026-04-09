import { LayoutDashboard, Calendar, Users, Building2, Package } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app", icon: LayoutDashboard, label: "Home", end: true },
  { to: "/app/agenda", icon: Calendar, label: "Agenda" },
  { to: "/app/medici", icon: Users, label: "Medici" },
  { to: "/app/farmacie", icon: Building2, label: "Farmacie" },
  { to: "/app/prodotti", icon: Package, label: "Prodotti" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 glass-strong border-t safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors px-3 py-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <t.icon className={cn("h-5 w-5", isActive && "scale-110")} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
