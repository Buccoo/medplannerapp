import React, { createContext, useContext, useState, useEffect } from "react";

const ACCENT_COLORS = [
  { name: "Blu", hsl: "215 100% 50%" },
  { name: "Indaco", hsl: "240 80% 55%" },
  { name: "Verde", hsl: "160 84% 39%" },
  { name: "Arancione", hsl: "28 100% 50%" },
  { name: "Rosso", hsl: "0 84% 55%" },
  { name: "Rosa", hsl: "330 80% 55%" },
  { name: "Viola", hsl: "270 80% 55%" },
  { name: "Teal", hsl: "180 70% 40%" },
] as const;

type AccentColorContextType = {
  accentHsl: string;
  setAccentHsl: (hsl: string) => void;
  colors: typeof ACCENT_COLORS;
};

const AccentColorContext = createContext<AccentColorContextType | null>(null);

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [accentHsl, setAccentHsl] = useState(() => localStorage.getItem("medplanner-accent") || "215 100% 50%");

  useEffect(() => {
    localStorage.setItem("medplanner-accent", accentHsl);
    document.documentElement.style.setProperty("--primary", accentHsl);
    document.documentElement.style.setProperty("--accent", accentHsl);
    document.documentElement.style.setProperty("--ring", accentHsl);
  }, [accentHsl]);

  return (
    <AccentColorContext.Provider value={{ accentHsl, setAccentHsl, colors: ACCENT_COLORS }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export const useAccentColor = () => {
  const ctx = useContext(AccentColorContext);
  if (!ctx) throw new Error("useAccentColor must be used within AccentColorProvider");
  return ctx;
};
