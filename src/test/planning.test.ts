import { describe, expect, it } from "vitest";
import { calculateCoveragePriority, calculateSampleBag, proposeWeek, recalculateRoute } from "@/lib/planning";

const locked = { id: "a", date: "2026-09-14", time: "09:00", doctorId: "d1", doctorName: "Rossi", microarea: "LE07", isLocked: true, planningStatus: "programmato" as const, facilityType: "ospedale" as const };

describe("weekly planning safety", () => {
  it("preserves locked appointments during route recalculation", () => {
    const proposal = { ...locked, id: "b", doctorId: "d2", doctorName: "Bianchi", microarea: "LE09", isLocked: false, planningStatus: "proposto" as const };
    expect(recalculateRoute([locked, proposal])[0]).toEqual(locked);
  });

  it("prevents duplicate doctors and overlaps", () => {
    const result = proposeWeek([locked], [
      { date: "2026-09-15", time: "10:00", doctorId: "d1", doctorName: "Rossi", microarea: "LE07", priority: 10 },
      { date: "2026-09-14", time: "09:00", doctorId: "d2", doctorName: "Bianchi", microarea: "LE07", priority: 9 },
    ], "2026-09-14");
    expect(result.proposals).toHaveLength(0);
    expect(result.conflicts.join(" ")).toContain("già presente");
    expect(result.conflicts.join(" ")).toContain("occupata");
  });

  it("enforces the 12:30–14:30 structure slot", () => {
    const result = proposeWeek([], [{ date: "2026-09-14", time: "13:00", doctorName: "Verdi", microarea: "LE07", facilityType: "studio", priority: 1 }], "2026-09-14");
    expect(result.proposals).toHaveLength(0);
    expect(result.conflicts[0]).toContain("struttura abilitata");
  });
});

describe("commercial calculations", () => {
  it("uses one sample per patient-goal", () => {
    expect(calculateSampleBag([
      { productId: "p1", productName: "Refluxan", patientGoal: 15 },
      { productId: "p1", productName: "Refluxan", patientGoal: 5 },
    ])).toEqual([{ productId: "p1", productName: "Refluxan", samples: 20 }]);
  });
  it("calculates AB Plan coverage priority", () => {
    expect(calculateCoveragePriority(7, 4, 12)).toEqual({ remainingDays: 3, priority: 312 });
  });
});
