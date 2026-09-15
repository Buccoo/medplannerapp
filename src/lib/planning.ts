export type PlanningStatus = "proposto" | "programmato" | "confermato" | "completato" | "annullato";

export interface PlanningAppointment {
  id: string;
  date: string;
  time: string;
  doctorId?: string | null;
  doctorName: string;
  microarea: string;
  facilityType?: "ospedale" | "asl" | "clinica_privata" | "poliambulatorio" | "studio" | null;
  isLocked: boolean;
  planningStatus: PlanningStatus;
}

export interface CandidateVisit extends Omit<PlanningAppointment, "id" | "isLocked" | "planningStatus"> {
  id?: string;
  priority: number;
}

export interface PlanResult {
  proposals: PlanningAppointment[];
  conflicts: string[];
}

const STRUCTURE_TYPES = new Set(["ospedale", "asl", "clinica_privata", "poliambulatorio"]);

export const isStructureSlot = (time: string) => time >= "12:30" && time < "14:30";

export const isAllowedInStructureSlot = (facilityType?: string | null) =>
  Boolean(facilityType && STRUCTURE_TYPES.has(facilityType));

export function proposeWeek(
  anchors: PlanningAppointment[],
  candidates: CandidateVisit[],
  weekStart: string,
): PlanResult {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 5);
  const inWeek = (date: string) => {
    const value = new Date(`${date}T00:00:00Z`);
    return value >= start && value < end;
  };
  const fixed = anchors.filter((a) => inWeek(a.date) && a.planningStatus !== "annullato");
  const usedDoctors = new Set(fixed.map((a) => a.doctorId || a.doctorName.toLocaleLowerCase("it")));
  const usedSlots = new Set(fixed.map((a) => `${a.date}|${a.time}`));
  const conflicts: string[] = [];
  const proposals: PlanningAppointment[] = [];

  [...candidates].sort((a, b) => b.priority - a.priority || a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .forEach((candidate, index) => {
      if (!inWeek(candidate.date)) return;
      const doctorKey = candidate.doctorId || candidate.doctorName.toLocaleLowerCase("it");
      const slotKey = `${candidate.date}|${candidate.time}`;
      if (usedDoctors.has(doctorKey)) {
        conflicts.push(`${candidate.doctorName}: già presente nella settimana`);
        return;
      }
      if (usedSlots.has(slotKey)) {
        conflicts.push(`${candidate.doctorName}: fascia ${candidate.date} ${candidate.time} occupata`);
        return;
      }
      if (isStructureSlot(candidate.time) && !isAllowedInStructureSlot(candidate.facilityType)) {
        conflicts.push(`${candidate.doctorName}: la fascia strutture richiede una struttura abilitata`);
        return;
      }
      usedDoctors.add(doctorKey);
      usedSlots.add(slotKey);
      proposals.push({
        ...candidate,
        id: candidate.id || `proposal-${index}`,
        planningStatus: "proposto",
        isLocked: false,
      });
    });

  const dates = [...new Set([...fixed, ...proposals].map((a) => a.date))];
  for (const date of dates) {
    const day = [...fixed, ...proposals].filter((a) => a.date === date);
    if (!day.some((a) => isAllowedInStructureSlot(a.facilityType))) {
      conflicts.push(`${date}: manca una visita in struttura nella microarea trattata`);
    }
  }
  return { proposals, conflicts: [...new Set(conflicts)] };
}

export function recalculateRoute<T extends PlanningAppointment>(appointments: T[]): T[] {
  const lockedPositions = new Map(appointments.map((a, i) => [a.isLocked ? i : -1, a]).filter(([i]) => i !== -1) as [number, T][]);
  const movable = appointments.filter((a) => !a.isLocked && a.planningStatus === "proposto")
    .sort((a, b) => a.microarea.localeCompare(b.microarea) || a.time.localeCompare(b.time));
  let cursor = 0;
  return appointments.map((original, index) => lockedPositions.get(index) || movable[cursor++] || original);
}

export function calculateWeeklyGoal(target: number, actual: number, remainingWeeks: number) {
  return Math.max(0, target - actual) / Math.max(1, remainingWeeks);
}

export function calculateCoveragePriority(plannedDays: number, scheduledDays: number, productGap = 0) {
  const remainingDays = Math.max(0, plannedDays - scheduledDays);
  return { remainingDays, priority: remainingDays * 100 + Math.max(0, productGap) };
}

export function calculateSampleBag(goals: Array<{ productId: string; productName: string; patientGoal: number }>) {
  const totals = new Map<string, { productId: string; productName: string; samples: number }>();
  for (const goal of goals) {
    const current = totals.get(goal.productId) || { productId: goal.productId, productName: goal.productName, samples: 0 };
    current.samples += Math.max(0, goal.patientGoal);
    totals.set(goal.productId, current);
  }
  return [...totals.values()].sort((a, b) => a.productName.localeCompare(b.productName, "it"));
}
