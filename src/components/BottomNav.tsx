import { Calendar, Users, Building2, Package, Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const leftTabs = [
  { to: "/app/agenda", icon: Calendar, label: "Agenda" },
  { to: "/app/medici", icon: Users, label: "Medici" },
];

const rightTabs = [
  { to: "/app/farmacie", icon: Building2, label: "Farmacie" },
  { to: "/app/prodotti", icon: Package, label: "Prodotti" },
];

const homeTab = { to: "/app", icon: Home, label: "Home" };

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-area-pb">
      <div className="relative glass-strong border-t">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {leftTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors px-3 py-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Spacer for center button */}
          <div className="w-16" />

          {rightTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors px-3 py-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Center Home button - elevated */}
        <NavLink
          to={homeTab.to}
          end
          className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center"
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-primary/80 text-primary-foreground"
              )}>
                <Home className="h-6 w-6" strokeWidth={2} />
              </div>
              <span className={cn(
                "text-[11px] font-medium mt-0.5",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {homeTab.label}
              </span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
