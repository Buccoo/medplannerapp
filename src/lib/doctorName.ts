const TITLE_RE = /^\s*(prof\.?\s*ssa|prof\.?|dott\.?\s*ssa|dr\.?\s*ssa|dott\.?|dr\.?)\s+/i;

const MAP: Record<string, string> = {
  dr: "Dr.",
  "dr.": "Dr.",
  drssa: "Dr.ssa",
  "dr.ssa": "Dr.ssa",
  dott: "Dott.",
  "dott.": "Dott.",
  dottssa: "Dott.ssa",
  "dott.ssa": "Dott.ssa",
  prof: "Prof.",
  "prof.": "Prof.",
  profssa: "Prof.ssa",
  "prof.ssa": "Prof.ssa",
};

export function splitDoctorTitle(fullName: string): { title: string; name: string } {
  const src = fullName || "";
  const m = src.match(TITLE_RE);
  if (!m) return { title: "", name: src.trim() };
  const raw = m[1].toLowerCase().replace(/\s+/g, "");
  return {
    title: MAP[raw] ?? m[1].trim(),
    name: src.slice(m[0].length).trim(),
  };
}

export const stripDoctorTitle = (n: string) => splitDoctorTitle(n).name;