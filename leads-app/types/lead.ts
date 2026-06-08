export type LeadStatus =
  | "Detectado"
  | "Validado"
  | "Prioritario"
  | "Contactado"
  | "Respondió"
  | "Reunión agendada"
  | "Diagnóstico hecho"
  | "Propuesta enviada"
  | "Negociación"
  | "Ganado"
  | "Perdido"
  | "No encaja"
  | "No contactar";

export type LeadPriority = "Muy alta" | "Alta" | "Media" | "Baja";

export type LeadSector = string;

export type LeadCity = string;

export type FollowersBucket =
  | "Pendiente"
  | "Sin cuenta"
  | "< 1.000"
  | "1.000 - 5.000"
  | "+5.000";

export type ContentUse =
  | "Pendiente"
  | "Sin uso"
  | "Flojo"
  | "Activo"
  | "Muy trabajado";

export type LeadSource = "manual" | "google_places" | "importado" | "web";
export type ScoreConfidence = "low" | "medium" | "high";
export type InstagramStatus = "pendiente" | "no encontrado" | "verificado" | "manual";

export type LeadSignals = {
  web: boolean;
  instagram: boolean;
  facebook: boolean;
  whatsapp: boolean;
  photos: boolean;
  googleProfile: boolean;
};

export type Lead = {
  id: string;
  name: string;
  sector: LeadSector;
  city: LeadCity;
  address: string;
  phone: string;
  website: string;
  description: string;
  ownerName: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappUrl: string;
  logoUrl: string;
  followersBucket: FollowersBucket;
  contentUse: ContentUse;
  websiteTitle: string;
  googleMapsUrl: string;
  rating: number;
  reviews: number;
  googlePhotos: number;
  placeId: string;
  source: LeadSource;
  isInvalid: boolean;
  invalidReason: string;
  lastSeenAt: string;
  lastRefreshedAt: string;
  reviewOwnerCandidates: string[];
  latitude?: number | null;
  longitude?: number | null;
  businessStatus?: string;
  instagramStatus?: InstagramStatus;
  nextFollowUpAt?: string;
  nextFollowUpType?: string;
  lastVisitAt?: string;
  visitResult?: string;
  proposedPlan?: string;
  estimatedMonthlyValue?: number;
  adsSignal?: string;
  scoreTotal?: number;
  scoreBreakdown?: Record<string, number>;
  scoreReasons?: string[];
  scoreConfidence?: ScoreConfidence;
  dataSources?: string[];
  lastScoredAt?: string;
  status: LeadStatus;
  priority: LeadPriority;
  potential: number;
  lastContact: string;
  nextAction: string;
  pain: string;
  diagnosis: string;
  score: number;
  signals: LeadSignals;
  createdAt: string;
  updatedAt: string;
};

export type RouteStop = Lead & {
  visitOrder: number;
  routeReason: string;
};

export type PipelineColumnId = "discard" | "detected" | "priority" | "contacted" | "closing";
