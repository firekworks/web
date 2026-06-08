"use client";

import { useEffect, useState } from "react";

type IntegrationStatus = {
  supabase: boolean;
  googleMapsPublic: boolean;
  googlePlaces: boolean;
  googleRoutes: boolean;
  googleCalendar: boolean;
  meta: boolean;
  whatsapp: boolean;
  stats: boolean;
};

const initialStatus: IntegrationStatus = {
  supabase: false,
  googleMapsPublic: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
  googlePlaces: false,
  googleRoutes: false,
  googleCalendar: false,
  meta: false,
  whatsapp: false,
  stats: false
};

export function SystemWorkspace() {
  const [status, setStatus] = useState<IntegrationStatus>(initialStatus);

  useEffect(() => {
    fetch("/api/system/integrations", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setStatus((current) => ({ ...current, ...payload })))
      .catch(() => setStatus(initialStatus));
  }, []);

  return (
    <section className="system-workspace">
      <div className="system-grid">
        <IntegrationCard title="Supabase" ok={status.supabase} detail="Base principal de leads." />
        <IntegrationCard title="Google Maps" ok={status.googleMapsPublic} detail="Mapa público en cliente." />
        <IntegrationCard title="Google Places" ok={status.googlePlaces} detail="Importación limitada y manual." />
        <IntegrationCard title="Google Routes" ok={status.googleRoutes} detail="Preparado para rutas avanzadas." />
        <IntegrationCard title="Google Calendar" ok={status.googleCalendar} detail="Seguimientos internos." />
        <IntegrationCard title="Meta" ok={status.meta} detail="Futuro análisis de campañas." />
        <IntegrationCard title="WhatsApp" ok={status.whatsapp} detail="Futuro Business API." />
        <IntegrationCard title="Stats" ok={status.stats} detail="Enlace interno cuando un lead sea cliente." />
      </div>

      <div className="system-notes">
        <article>
          <span className="eyebrow">Arquitectura</span>
          <strong>Prospección genérica retirada</strong>
          <p>
            El CRM queda centrado en comercios locales, visitas presenciales, seguimiento y conversión. `/prospecting`,
            `/pulse` y la portada redirigen a `/leads`.
          </p>
        </article>
        <article>
          <span className="eyebrow">Google</span>
          <strong>Modo seguro</strong>
          <p>
            No se ejecutan búsquedas pagadas desde la UI principal. La importación Places queda limitada y explícita en
            el endpoint de sistema.
          </p>
        </article>
      </div>
    </section>
  );
}

function IntegrationCard({ title, ok, detail }: { title: string; ok: boolean; detail: string }) {
  return (
    <article className={ok ? "integration-card integration-card--ok" : "integration-card"}>
      <span>{ok ? "Conectado" : "Pendiente"}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </article>
  );
}
