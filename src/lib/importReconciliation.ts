import { stripDoctorTitle } from "@/lib/doctorName";

export type ImportClassification = "nuovo_certo" | "aggiornamento_certo" | "possibile_duplicato" | "incompleto_ambiguo";

export interface DoctorImportRow {
  name?: string;
  specialty?: string;
  paese?: string;
  microarea?: string;
  address?: string;
  facility?: string;
  externalId?: string;
}

export interface ExistingDoctor extends DoctorImportRow { id: string; normalizedName?: string | null }

export const normalizeText = (value = "") => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLocaleLowerCase("it");

export const normalizeDoctorName = (value = "") => normalizeText(stripDoctorTitle(value))
  .replace(/[^a-z0-9 ]/g, "")
  .replace(/\s+/g, " ")
  .trim();

export function classifyDoctorRow(row: DoctorImportRow, doctors: ExistingDoctor[]): {
  classification: ImportClassification;
  match?: ExistingDoctor;
  normalized: DoctorImportRow & { normalizedName: string };
} {
  const normalizedName = normalizeDoctorName(row.name);
  const normalized = {
    ...row,
    name: row.name?.trim(),
    specialty: row.specialty?.trim().toUpperCase(),
    paese: row.paese?.trim(),
    microarea: row.microarea?.trim().toUpperCase(),
    address: row.address?.trim(),
    facility: row.facility?.trim(),
    normalizedName,
  };
  if (!normalizedName || !normalized.microarea) return { classification: "incompleto_ambiguo", normalized };
  const exact = doctors.filter((d) =>
    (row.externalId && d.externalId === row.externalId) ||
    normalizeDoctorName(d.name) === normalizedName
  );
  if (exact.length === 1) return { classification: "aggiornamento_certo", match: exact[0], normalized };
  if (exact.length > 1) return { classification: "possibile_duplicato", normalized };
  const surname = normalizedName.split(" ").at(-1);
  const similar = doctors.filter((d) => normalizeDoctorName(d.name).split(" ").at(-1) === surname);
  if (similar.length) return { classification: "possibile_duplicato", normalized };
  return { classification: "nuovo_certo", normalized };
}
