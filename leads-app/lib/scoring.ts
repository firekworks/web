import type { Lead } from "@/types/lead";

const focusCities = ["Castalla", "Ibi", "Onil", "Tibi", "Biar", "Sax", "Elda", "Petrer"];
const secondaryCities = ["Alcoy", "Alcoi"];

const sectorPotential: Record<string, number> = {
  Restaurantes: 13,
  Bares: 11,
  Cafeterías: 10,
  Clínicas: 17,
  Fisioterapia: 15,
  Veterinarios: 15,
  Gimnasios: 14,
  Estética: 13,
  Peluquerías: 9,
  Barberías: 9,
  Academias: 12,
  Talleres: 10,
  Inmobiliarias: 16,
  Moda: 10,
  Muebles: 13,
  Hoteles: 15,
  Comercios: 9
};

const monthlyBaseBySector: Record<string, number> = {
  Restaurantes: 360,
  Bares: 320,
  Cafeterías: 300,
  Clínicas: 680,
  Fisioterapia: 520,
  Veterinarios: 520,
  Gimnasios: 520,
  Estética: 420,
  Peluquerías: 280,
  Barberías: 280,
  Academias: 450,
  Talleres: 360,
  Inmobiliarias: 620,
  Moda: 360,
  Muebles: 520,
  Hoteles: 620,
  Comercios: 320
};

const disqualifiedTerms = [
  "ayuntamiento",
  "ajuntament",
  "policía",
  "policia",
  "guardia civil",
  "bomberos",
  "protección civil",
  "oficina de turismo",
  "tourist info",
  "hospital público",
  "centro de salud",
  "colegio público",
  "ceip ",
  "ies ",
  "municipal",
  "parque",
  "monumento",
  "castillo",
  "biblioteca pública"
];

export type ScoreResult = {
  total: number;
  breakdown: Record<string, number>;
  reasons: string[];
  confidence: "low" | "medium" | "high";
  dataSources: string[];
};

export function computeScore(lead: Omit<Lead, "score"> | Lead) {
  return computeScoreDetails(lead).total;
}

export function computeScoreDetails(lead: Omit<Lead, "score"> | Lead): ScoreResult {
  const nameAndSector = `${lead.name} ${lead.sector} ${lead.address}`.toLowerCase();
  const disqualified =
    Boolean(lead.isInvalid) ||
    ["No contactar", "No encaja", "Perdido"].includes(String(lead.status)) ||
    disqualifiedTerms.some((term) => nameAndSector.includes(term));

  if (disqualified) {
    return {
      total: 12,
      breakdown: {
        encajeLocal: 0,
        sectorVendible: 0,
        comercioPrivado: 0,
        capacidadAparente: 0,
        presenciaDigital: 0,
        dolorDigital: 0,
        facilidadContacto: 0,
        resenas: 0,
        senalesInversion: 0,
        potencialFirekworks: 0
      },
      reasons: [lead.invalidReason || "No es un comercio privado prioritario para venta presencial."],
      confidence: "high",
      dataSources: sourceList(lead)
    };
  }

  const hasWeb = Boolean(lead.website || lead.signals?.web);
  const hasInstagram = Boolean(lead.instagramUrl || lead.signals?.instagram);
  const hasWhatsapp = Boolean(lead.whatsappUrl || lead.signals?.whatsapp);
  const hasPhone = Boolean(lead.phone);
  const reviews = Number(lead.reviews || 0);
  const rating = Number(lead.rating || 0);
  const sources = sourceList(lead);
  const insufficientData = sources.length < 2 && !lead.lastRefreshedAt;

  const encajeLocal = clamp(
    focusCities.includes(lead.city) ? 10 : secondaryCities.includes(lead.city) ? 6 : 1,
    10
  );
  const sectorVendible = clamp(sectorPotential[lead.sector] ? 8 : 4, 8);
  const comercioPrivado = 8;
  const capacidadAparente = clamp(
    (reviews >= 180 ? 7 : reviews >= 80 ? 5 : reviews >= 25 ? 3 : reviews > 0 ? 1 : 0) +
      (rating >= 4.6 ? 4 : rating >= 4.2 ? 2 : rating > 0 ? 1 : 0) +
      (lead.googlePhotos >= 10 ? 2 : lead.googlePhotos > 0 ? 1 : 0),
    13
  );
  const presenciaDigital = clamp((hasWeb ? 3 : 0) + (hasInstagram ? 3 : 0) + (hasWhatsapp ? 2 : 0), 8);
  const dolorDigital = clamp(
    (!hasWeb ? 4 : 0) +
      (!hasInstagram ? 4 : 0) +
      (!hasWhatsapp ? 2 : 0) +
      (lead.contentUse === "Sin uso" ? 5 : lead.contentUse === "Flojo" ? 4 : lead.contentUse === "Pendiente" ? 2 : 0) +
      (lead.googlePhotos < 5 ? 1 : 0),
    16
  );
  const facilidadContacto = clamp((hasPhone ? 5 : 0) + (hasWhatsapp ? 3 : 0) + (lead.googleMapsUrl ? 2 : 0), 10);
  const resenas = clamp((reviews >= 100 ? 5 : reviews >= 30 ? 3 : reviews > 0 ? 1 : 0) + (rating >= 4.4 ? 3 : 0), 8);
  const senalesInversion = clamp(lead.adsSignal ? 5 : lead.website && hasInstagram ? 2 : 0, 5);
  const potencialFirekworks = clamp(
    (sectorPotential[lead.sector] ? 6 : 3) +
      (dolorDigital >= 10 ? 4 : dolorDigital >= 6 ? 2 : 0) +
      (reviews >= 50 ? 2 : 0) +
      (hasPhone || hasWhatsapp ? 2 : 0),
    14
  );

  let total =
    encajeLocal +
    sectorVendible +
    comercioPrivado +
    capacidadAparente +
    presenciaDigital +
    dolorDigital +
    facilidadContacto +
    resenas +
    senalesInversion +
    potencialFirekworks;

  if (insufficientData) total = Math.min(total, 60);
  if (!focusCities.includes(lead.city) && !secondaryCities.includes(lead.city)) total = Math.min(total, 55);

  const reasons = [
    reviews && rating ? `${rating} estrellas y ${reviews} reseñas verificables.` : "Demanda pendiente de validar.",
    !hasWeb ? "Sin web clara: oportunidad de landing y SEO local." : "Web detectada.",
    !hasInstagram ? "Instagram pendiente o no detectado." : "Instagram detectado.",
    lead.contentUse === "Sin uso" || lead.contentUse === "Flojo"
      ? "Hueco visual para contenido profesional de foto/vídeo."
      : "Contenido a revisar antes de proponer.",
    hasPhone || hasWhatsapp ? "Contacto directo disponible." : "Contacto pendiente de enriquecer.",
    insufficientData ? "Pendiente de enriquecer: temperatura limitada a 60." : ""
  ].filter(Boolean);

  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    breakdown: {
      encajeLocal,
      sectorVendible,
      comercioPrivado,
      capacidadAparente,
      presenciaDigital,
      dolorDigital,
      facilidadContacto,
      resenas,
      senalesInversion,
      potencialFirekworks
    },
    reasons,
    confidence: insufficientData ? "low" : sources.length >= 4 ? "high" : "medium",
    dataSources: sources
  };
}

export function scoreLabel(score: number) {
  if (score >= 85) return "Muy caliente";
  if (score >= 70) return "Caliente";
  if (score >= 50) return "Interesante";
  if (score >= 30) return "Tibio";
  return "Frío";
}

export function scoreTone(score: number) {
  if (score >= 85) return "hot";
  if (score >= 70) return "warm";
  if (score >= 50) return "medium";
  if (score >= 30) return "cool";
  return "low";
}

export function estimateMonthlyValue(lead: Lead) {
  if (["No contactar", "No encaja", "Perdido", "Ganado"].includes(lead.status) || lead.isInvalid) return 0;
  const base = monthlyBaseBySector[lead.sector] || 320;
  const scoreMultiplier = lead.score >= 85 ? 1.22 : lead.score >= 70 ? 0.95 : lead.score >= 50 ? 0.62 : 0.28;
  const gapMultiplier = lead.contentUse === "Sin uso" ? 1.12 : lead.contentUse === "Flojo" ? 1.06 : 0.94;
  return Math.round((base * scoreMultiplier * gapMultiplier) / 25) * 25;
}

export function recommendServicePlan(lead: Lead) {
  const monthlyValue = estimateMonthlyValue(lead);
  const ads = estimateAdBudget(lead);

  if (monthlyValue >= 650 || lead.score >= 85) {
    return {
      name: "Dominio Local",
      visits: "2 visitas/mes",
      content: "8-10 piezas + campañas",
      ads,
      focus: "Contenido avanzado, embudo, Meta Ads, Stats y optimización mensual"
    };
  }

  if (monthlyValue >= 375 || lead.score >= 65) {
    return {
      name: "Captación Local",
      visits: "1 visita/mes",
      content: "4-6 reels/carruseles/historias",
      ads,
      focus: "Contenido profesional, Meta Ads, WhatsApp/landing y seguimiento"
    };
  }

  return {
    name: "Visibilidad Local",
    visits: "1 visita puntual",
    content: "Fotos/reels base + Google Business",
    ads,
    focus: "Presencia local, WhatsApp Business y primeras publicaciones"
  };
}

export function estimateAdBudget(lead: Lead) {
  if (lead.score >= 85) return lead.sector === "Clínicas" || lead.sector === "Inmobiliarias" ? 500 : 350;
  if (lead.score >= 70) return 250;
  if (lead.score >= 50) return 150;
  return 80;
}

function sourceList(lead: Omit<Lead, "score"> | Lead) {
  return [
    lead.placeId || lead.googleMapsUrl ? "Google Business Profile" : "",
    lead.website ? "Web" : "",
    lead.instagramUrl ? "Instagram" : "",
    lead.facebookUrl ? "Facebook" : "",
    lead.phone || lead.whatsappUrl ? "Contacto" : "",
    lead.reviews || lead.rating ? "Reseñas" : ""
  ].filter(Boolean);
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}
