import type { LeadStatus } from "@/types/lead";

export const statusColors: Record<LeadStatus, string> = {
  Detectado: "gray",
  Validado: "blue",
  Prioritario: "yellow",
  Contactado: "blue",
  Respondió: "yellow",
  "Reunión agendada": "orange",
  "Diagnóstico hecho": "orange",
  "Propuesta enviada": "lilac",
  Negociación: "lilac",
  Ganado: "green",
  Perdido: "muted-red",
  "No encaja": "muted-red",
  "No contactar": "red"
};

export function statusTone(status: LeadStatus) {
  return statusColors[status] || "gray";
}
