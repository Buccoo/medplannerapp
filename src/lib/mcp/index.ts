import { auth, defineMcp } from "@lovable.dev/mcp-js";
import readAgenda from "./tools/read-agenda";
import searchDoctors from "./tools/search-doctors";
import searchPharmacies from "./tools/search-pharmacies";
import readDailyPriorities from "./tools/read-daily-priorities";
import createAppointment from "./tools/create-appointment";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "medplanner-pro",
  title: "MedPlanner Pro",
  version: "0.1.0",
  instructions:
    "Strumenti di MedPlanner Pro per l'informatore scientifico collegato: leggere l'agenda, cercare medici e farmacie, leggere le priorità della giornata e creare nuovi appuntamenti. Tutti i dati sono limitati all'utente autenticato.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [readAgenda, searchDoctors, searchPharmacies, readDailyPriorities, createAppointment],
});
