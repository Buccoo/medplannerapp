import { describe, expect, it } from "vitest";
import { classifyDoctorRow, normalizeDoctorName } from "@/lib/importReconciliation";

describe("doctor import reconciliation", () => {
  it("normalizes accents, titles, case and spaces", () => {
    expect(normalizeDoctorName("  Dott.  Nicolò D'AMICO ")).toBe("nicolo damico");
  });
  it("classifies exact, new, duplicate and incomplete rows", () => {
    const doctors = [{ id: "1", name: "Dott. Mario Rossi", microarea: "LE07" }, { id: "2", name: "Luigi Verdi", microarea: "LE08" }];
    expect(classifyDoctorRow({ name: "Mario Rossi", microarea: "le07" }, doctors).classification).toBe("aggiornamento_certo");
    expect(classifyDoctorRow({ name: "Anna Bianchi", microarea: "LE09" }, doctors).classification).toBe("nuovo_certo");
    expect(classifyDoctorRow({ name: "Anna Rossi", microarea: "LE09" }, doctors).classification).toBe("possibile_duplicato");
    expect(classifyDoctorRow({ name: "Senza Area" }, doctors).classification).toBe("incompleto_ambiguo");
  });
});
