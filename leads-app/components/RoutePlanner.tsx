"use client";

import { useMemo, useState } from "react";
import type { RouteStop } from "@/types/lead";

type VisitResult = "No estaba" | "Hablado" | "Interesado" | "Enviar propuesta" | "No interesa";

type RoutePlannerProps = {
  stops: RouteStop[];
  onSelect: (lead: RouteStop) => void;
  onMarkVisited: (lead: RouteStop, result: VisitResult) => void;
  onCreateTask: (lead: RouteStop) => void;
};

const visitResults: VisitResult[] = ["No estaba", "Hablado", "Interesado", "Enviar propuesta", "No interesa"];

export function RoutePlanner({ stops, onSelect, onMarkVisited, onCreateTask }: RoutePlannerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => stops.slice(0, 8).map((lead) => lead.id));
  const selectedStops = useMemo(
    () => selectedIds.map((id) => stops.find((lead) => lead.id === id)).filter(Boolean) as RouteStop[],
    [selectedIds, stops]
  );
  const availableStops = stops.filter((lead) => !selectedIds.includes(lead.id));
  const mapsUrl = buildGoogleMapsRoute(selectedStops);

  function toggleStop(lead: RouteStop) {
    setSelectedIds((current) =>
      current.includes(lead.id) ? current.filter((id) => id !== lead.id) : [...current, lead.id]
    );
  }

  function move(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function copyRoute() {
    const text = selectedStops
      .map((lead, index) => `${index + 1}. ${lead.name} - ${lead.city}, ${lead.address}`)
      .join("\n");
    await navigator.clipboard.writeText(text || "Ruta vacía");
  }

  return (
    <div className="route-builder">
      <section className="route-actions-panel">
        <div>
          <span className="eyebrow">Ruta seleccionada</span>
          <strong>{selectedStops.length} visitas</strong>
        </div>
        <a className="button" href={mapsUrl} target="_blank" rel="noreferrer">
          Abrir Google Maps
        </a>
        <button className="button button--ghost" type="button" onClick={copyRoute}>
          Copiar ruta
        </button>
        <button
          className="button button--quiet"
          type="button"
          onClick={() => selectedStops[0] && onCreateTask(selectedStops[0])}
          disabled={!selectedStops.length}
        >
          Crear tarea
        </button>
      </section>

      <section className="route-list route-selection">
        {selectedStops.length ? (
          selectedStops.map((lead, index) => (
            <article className="route-stop route-stop--selected" key={lead.id}>
              <button className="route-stop__body" type="button" onClick={() => onSelect(lead)}>
                <span className="route-stop__order">{index + 1}</span>
                <div>
                  <strong>{lead.name}</strong>
                  <small>
                    {lead.city} · {lead.address}
                  </small>
                  <p>{lead.routeReason}</p>
                </div>
                <span className="route-stop__score">{lead.score}</span>
              </button>
              <div className="route-stop__tools">
                <button type="button" onClick={() => move(lead.id, -1)} disabled={index === 0}>
                  Subir
                </button>
                <button type="button" onClick={() => move(lead.id, 1)} disabled={index === selectedStops.length - 1}>
                  Bajar
                </button>
                <button type="button" onClick={() => toggleStop(lead)}>
                  Quitar
                </button>
              </div>
              <div className="visit-results">
                {visitResults.map((result) => (
                  <button key={result} type="button" onClick={() => onMarkVisited(lead, result)}>
                    {result}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-panel">
            <strong>Ruta vacía</strong>
            <span>Selecciona comercios de la lista de oportunidades.</span>
          </div>
        )}
      </section>

      <section className="route-pool">
        <span className="eyebrow">Oportunidades para añadir</span>
        <div className="route-list">
          {availableStops.slice(0, 24).map((lead) => (
            <button className="route-stop route-stop--pool" key={lead.id} type="button" onClick={() => toggleStop(lead)}>
              <span className="route-stop__order">+</span>
              <div>
                <strong>{lead.name}</strong>
                <small>
                  {lead.city} · {lead.sector}
                </small>
              </div>
              <span className="route-stop__score">{lead.score}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildGoogleMapsRoute(stops: RouteStop[]) {
  const origin = "Firekworks Castalla";
  const addresses = stops.map((lead) => `${lead.name}, ${lead.address}, ${lead.city}, Alicante, España`);
  const destination = addresses.at(-1) || origin;
  const waypoints = addresses.slice(0, -1).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving"
  });

  if (waypoints) params.set("waypoints", waypoints);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
