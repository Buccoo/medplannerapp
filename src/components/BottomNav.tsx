import { Calendar, Users, Building2, Package, Home, Shield } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";

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
  const { isAdmin } = useAdmin();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border">
      <div
        className="relative"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch justify-around h-[68px] max-w-lg mx-auto">
          {leftTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors min-w-0",
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
          <div className="w-16 shrink-0" aria-hidden />

          {rightTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors min-w-0",
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

        {/* Center Home button - elevated. Wrapper is non-interactive so it never steals taps from Agenda/Farmacie. */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 pointer-events-none">
          <NavLink
            to={homeTab.to}
            end
            className="flex flex-col items-center pointer-events-auto"
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

        {/* Admin button - top right */}
        {isAdmin && (
          <NavLink
            to="/app/admin"
            className={({ isActive }) =>
              cn(
                "absolute right-3 -top-4 flex items-center justify-center h-8 w-8 rounded-full shadow-md transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-primary/20"
              )
            }
          >
            <Shield className="h-4 w-4" />
          </NavLink>
        )}
      </div>
    </nav>
  );
}
