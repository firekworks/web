"use client";

import { motion } from "framer-motion";
import type { Lead } from "@/types/lead";
import { estimateMonthlyValue, scoreLabel, scoreTone } from "@/lib/scoring";
import { statusTone } from "@/lib/status";

type LeadCardProps = {
  lead: Lead;
  active: boolean;
  onSelect: (lead: Lead) => void;
};

export function LeadCard({ lead, active, onSelect }: LeadCardProps) {
  const initial = lead.name.trim().slice(0, 1).toUpperCase() || "F";
  const monthlyValue = lead.estimatedMonthlyValue || estimateMonthlyValue(lead);

  return (
    <motion.button
      type="button"
      className={active ? "lead-card lead-card--active lead-card--clean" : "lead-card lead-card--clean"}
      onClick={() => onSelect(lead)}
      layout
      whileHover={{ y: -1 }}
      transition={{ duration: 0.16 }}
    >
      <span className="lead-avatar" aria-hidden="true">
        {lead.logoUrl ? (
          <img
            src={lead.logoUrl}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <span>{initial}</span>
      </span>

      <span className="lead-card__main">
        <span className="lead-card__title">
          <strong>{lead.name}</strong>
          <span className={`status-pill status-pill--${statusTone(lead.status)}`}>{lead.status}</span>
        </span>
        <small>
          {lead.city} · {lead.sector}
        </small>
        <span className="data-icons" aria-label="Señales disponibles">
          <DataIcon active={lead.signals.googleProfile || Boolean(lead.googleMapsUrl)} label="Maps" tone="google" />
          <DataIcon active={Boolean(lead.phone)} label="Tel" tone="phone" />
          <DataIcon active={lead.signals.web || Boolean(lead.website)} label="Web" tone="web" />
          <DataIcon active={lead.signals.instagram || Boolean(lead.instagramUrl)} label="IG" tone="instagram" />
          <DataIcon active={lead.signals.facebook || Boolean(lead.facebookUrl)} label="FB" tone="facebook" />
          <DataIcon active={lead.reviews > 0} label={`${lead.reviews || 0}`} tone="reviews" />
          <DataIcon active={lead.googlePhotos > 0} label={`${lead.googlePhotos || 0}`} tone="photos" />
          <DataIcon active={Boolean(lead.adsSignal)} label="Ads" tone="ads" />
        </span>
      </span>

      <span className="lead-card__meta lead-card__meta--compact">
        <span className={`score-pill score-pill--${scoreTone(lead.score)}`}>
          <strong>{lead.score}</strong>
          <small>{scoreLabel(lead.score)}</small>
        </span>
        <span className="meta-chip">IG {lead.followersBucket}</span>
        <span className="meta-chip meta-chip--content">{lead.contentUse}</span>
        <span className="meta-chip">{monthlyValue ? `≈ ${monthlyValue}€/mes` : "Sin estimación"}</span>
      </span>
    </motion.button>
  );
}

function DataIcon({
  active,
  label,
  tone
}: {
  active: boolean;
  label: string;
  tone: string;
}) {
  return (
    <span className={active ? `data-icon data-icon--${tone} data-icon--on` : "data-icon"} title={label}>
      {label}
    </span>
  );
}
