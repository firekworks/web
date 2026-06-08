"use client";

import { useMemo } from "react";
import type { Lead } from "@/types/lead";
import { scoreLabel, scoreTone } from "@/lib/scoring";

type MapWorkspaceProps = {
  leads: Lead[];
  selectedId: string;
  onSelect: (lead: Lead) => void;
};

export function MapWorkspace({ leads, selectedId, onSelect }: MapWorkspaceProps) {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const leadsWithCoords = leads.filter((lead) => Number.isFinite(lead.latitude) && Number.isFinite(lead.longitude));
  const selectedLead = leadsWithCoords.find((lead) => lead.id === selectedId) || leadsWithCoords[0];
  const cityGroups = useMemo(() => groupByCity(leads), [leads]);

  return (
    <section className="map-workspace">
      <div className="map-panel">
        {mapsKey && selectedLead ? (
          <iframe
            title="Mapa de comercios"
            src={`https://www.google.com/maps/embed/v1/view?key=${mapsKey}&center=${selectedLead.latitude},${selectedLead.longitude}&zoom=13`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="map-fallback">
            <span className="css-icon css-icon--map" aria-hidden="true" />
            <strong>Mapa interactivo pendiente de conectar</strong>
            <p>
              {mapsKey
                ? "La clave existe, pero faltan coordenadas reales en los leads. No se inventan ubicaciones."
                : "Añade NEXT_PUBLIC_GOOGLE_MAPS_API_KEY y guarda latitud/longitud para mostrar pines reales."}
            </p>
          </div>
        )}
      </div>

      <aside className="map-side">
        <div className="map-city-list">
          {cityGroups.map((city) => (
            <article key={city.name}>
              <span>{city.name}</span>
              <strong>{city.total}</strong>
              <small>{city.hot} calientes</small>
            </article>
          ))}
        </div>

        <div className="map-lead-list">
          {(leadsWithCoords.length ? leadsWithCoords : leads).slice(0, 40).map((lead) => (
            <button
              key={lead.id}
              className={lead.id === selectedId ? "map-lead map-lead--active" : "map-lead"}
              type="button"
              onClick={() => onSelect(lead)}
            >
              <span className={`score-pill score-pill--${scoreTone(lead.score)}`}>{lead.score}</span>
              <span>
                <strong>{lead.name}</strong>
                <small>
                  {lead.city} · {scoreLabel(lead.score)}
                </small>
              </span>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}

function groupByCity(leads: Lead[]) {
  const groups = new Map<string, { name: string; total: number; hot: number }>();

  for (const lead of leads) {
    const current = groups.get(lead.city) || { name: lead.city || "Sin ciudad", total: 0, hot: 0 };
    current.total += 1;
    if (lead.score >= 70) current.hot += 1;
    groups.set(current.name, current);
  }

  return Array.from(groups.values()).sort((a, b) => b.hot - a.hot || b.total - a.total);
}
