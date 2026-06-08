"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContentUse, FollowersBucket, Lead, LeadStatus } from "@/types/lead";
import { googleSearchUrls } from "@/lib/leads-repository";
import { estimateAdBudget, estimateMonthlyValue, recommendServicePlan, scoreLabel } from "@/lib/scoring";
import { statusTone } from "@/lib/status";
import { ScoreRing } from "@/components/ScoreRing";

export type QuickLeadAction =
  | "add-route"
  | "prioritize"
  | "contacted"
  | "discard"
  | "convert-client";

type LeadDetailProps = {
  lead: Lead;
  statuses: LeadStatus[];
  onSave: (lead: Lead) => void;
  onEnrich: (lead: Lead) => void;
  onFindOwner: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: QuickLeadAction) => void;
  enriching: boolean;
  findingOwner: boolean;
};

type DetailTab = "resumen" | "auditoria" | "resenas" | "propuesta" | "seguimiento" | "datos";

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "auditoria", label: "Auditoría" },
  { id: "resenas", label: "Reseñas" },
  { id: "propuesta", label: "Propuesta" },
  { id: "seguimiento", label: "Seguimiento" },
  { id: "datos", label: "Datos" }
];

const followersBuckets: FollowersBucket[] = ["Pendiente", "Sin cuenta", "< 1.000", "1.000 - 5.000", "+5.000"];
const contentUses: ContentUse[] = ["Pendiente", "Sin uso", "Flojo", "Activo", "Muy trabajado"];
const priorityOptions: Lead["priority"][] = ["Muy alta", "Alta", "Media", "Baja"];

export function LeadDetail({
  lead,
  statuses,
  onSave,
  onEnrich,
  onFindOwner,
  onQuickAction,
  enriching,
  findingOwner
}: LeadDetailProps) {
  const [draft, setDraft] = useState(lead);
  const [tab, setTab] = useState<DetailTab>("resumen");
  const searchUrls = useMemo(() => googleSearchUrls(draft), [draft]);
  const monthlyValue = draft.estimatedMonthlyValue || estimateMonthlyValue(draft);
  const plan = recommendServicePlan(draft);
  const adsBudget = estimateAdBudget(draft);

  useEffect(() => {
    setDraft(lead);
    setTab("resumen");
  }, [lead]);

  function update<K extends keyof Lead>(key: K, value: Lead[K]) {
    setDraft((current) => ({ ...current, [key]: value, updatedAt: new Date().toISOString() }));
  }

  return (
    <aside className="lead-detail lead-detail--tabs">
      <div className="lead-detail__top">
        <div className="lead-title-block">
          <span className="eyebrow">Ficha comercial</span>
          <h2>{draft.name}</h2>
          <p>
            {draft.city} · {draft.sector}
          </p>
          <span className={`status-pill status-pill--${statusTone(draft.status)}`}>{draft.status}</span>
        </div>
        <ScoreRing score={draft.score} label={scoreLabel(draft.score)} />
      </div>

      <div className="lead-detail__quickbar" aria-label="Acciones rápidas">
        <a href={draft.googleMapsUrl || searchUrls.googleMaps} target="_blank" rel="noreferrer">
          Maps
        </a>
        <a href={draft.phone ? `tel:${draft.phone.replace(/\s+/g, "")}` : searchUrls.googleMaps}>Llamar</a>
        <a href={draft.whatsappUrl || whatsappFromPhone(draft.phone)} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a href={draft.website || searchUrls.googleMaps} target="_blank" rel="noreferrer">
          Web
        </a>
        <a href={draft.instagramUrl || searchUrls.instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
      </div>

      <div className="lead-detail__actions">
        <button type="button" onClick={() => onQuickAction(draft, "add-route")}>
          Añadir a ruta
        </button>
        <button type="button" onClick={() => onQuickAction(draft, "prioritize")}>
          Priorizar
        </button>
        <button type="button" onClick={() => onQuickAction(draft, "contacted")}>
          Contactado
        </button>
        <button type="button" onClick={() => onQuickAction(draft, "discard")}>
          Descartar
        </button>
        <button type="button" onClick={() => onQuickAction(draft, "convert-client")}>
          Convertir a cliente
        </button>
      </div>

      <div className="lead-detail__tabs" role="tablist" aria-label="Secciones de ficha">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "resumen" ? (
        <section className="detail-pane">
          <div className="detail-summary">
            <Metric label="Mensualidad" value={monthlyValue ? `≈ ${monthlyValue}€/mes` : "Sin estimación"} />
            <Metric label="Plan" value={plan.name} />
            <Metric label="Ads" value={`≈ ${adsBudget}€/mes`} />
          </div>

          <div className="score-reasons">
            {(draft.scoreReasons?.length ? draft.scoreReasons : [draft.diagnosis || draft.pain || "Pendiente de diagnóstico"]).map(
              (reason) => (
                <span key={reason}>{reason}</span>
              )
            )}
          </div>

          <TextArea label="Problema detectado" value={draft.pain} onChange={(value) => update("pain", value)} />
          <TextArea label="Oportunidad / diagnóstico" value={draft.diagnosis} onChange={(value) => update("diagnosis", value)} />
          <TextArea label="Siguiente paso" value={draft.nextAction} onChange={(value) => update("nextAction", value)} />
        </section>
      ) : null}

      {tab === "auditoria" ? (
        <section className="detail-pane">
          <div className="audit-grid">
            <Signal label="Google" active={draft.signals.googleProfile || Boolean(draft.googleMapsUrl)} />
            <Signal label="Teléfono" active={Boolean(draft.phone)} />
            <Signal label="WhatsApp" active={draft.signals.whatsapp || Boolean(draft.whatsappUrl)} />
            <Signal label="Web" active={draft.signals.web || Boolean(draft.website)} />
            <Signal label="Instagram" active={draft.signals.instagram || Boolean(draft.instagramUrl)} />
            <Signal label="Facebook" active={draft.signals.facebook || Boolean(draft.facebookUrl)} />
            <Signal label="Fotos" active={draft.googlePhotos > 0} />
            <Signal label="Ads" active={Boolean(draft.adsSignal)} />
          </div>
          <div className="score-breakdown">
            {Object.entries(draft.scoreBreakdown || {}).map(([key, value]) => (
              <div key={key}>
                <span>{labelize(key)}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <button className="button" type="button" onClick={() => onEnrich(draft)} disabled={enriching}>
            {enriching ? "Enriqueciendo" : "Enriquecer web/redes"}
          </button>
        </section>
      ) : null}

      {tab === "resenas" ? (
        <section className="detail-pane">
          <div className="detail-summary">
            <Metric label="Rating" value={draft.rating ? String(draft.rating) : "Pendiente"} />
            <Metric label="Reseñas" value={String(draft.reviews || 0)} />
            <Metric label="Fotos" value={String(draft.googlePhotos || 0)} />
          </div>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => onFindOwner(draft)}
            disabled={findingOwner || !draft.placeId}
          >
            {findingOwner ? "Revisando" : "Buscar dueño en reseñas"}
          </button>
          <div className="owner-candidates">
            {(draft.reviewOwnerCandidates || []).length ? (
              draft.reviewOwnerCandidates.map((candidate) => <span key={candidate}>{candidate}</span>)
            ) : (
              <p>Sin candidatos guardados todavía.</p>
            )}
          </div>
          <a className="button button--quiet" href={searchUrls.owner} target="_blank" rel="noreferrer">
            Buscar dueño/contacto en Google
          </a>
        </section>
      ) : null}

      {tab === "propuesta" ? (
        <section className="detail-pane">
          <div className="proposal-packs">
            <article>
              <span>Base</span>
              <strong>Visibilidad Local</strong>
              <p>Google Business Profile, WhatsApp Business, fotos base y primeras piezas.</p>
            </article>
            <article className={plan.name === "Captación Local" ? "active" : ""}>
              <span>Principal</span>
              <strong>Captación Local</strong>
              <p>1 visita/mes, 4-6 piezas, landing/WhatsApp, Meta Ads y seguimiento.</p>
            </article>
            <article className={plan.name === "Dominio Local" ? "active" : ""}>
              <span>Avanzado</span>
              <strong>Dominio Local</strong>
              <p>2 visitas/mes, 8-10 piezas, campañas, embudo y optimización mensual.</p>
            </article>
          </div>
          <Field label="Oferta recomendada" value={draft.proposedPlan || plan.name} onChange={(value) => update("proposedPlan", value)} />
          <NumberField
            label="Valor estimado mensual"
            value={monthlyValue}
            onChange={(value) => update("estimatedMonthlyValue", value)}
          />
          <TextArea
            label="Mensaje WhatsApp sugerido"
            value={messageSuggestion(draft, plan.name)}
            onChange={(value) => update("diagnosis", value)}
          />
        </section>
      ) : null}

      {tab === "seguimiento" ? (
        <section className="detail-pane">
          <Select label="Estado" value={draft.status} options={statuses} onChange={(value) => update("status", value as LeadStatus)} />
          <Select
            label="Prioridad"
            value={draft.priority}
            options={priorityOptions}
            onChange={(value) => update("priority", value as Lead["priority"])}
          />
          <Field label="Último contacto" value={draft.lastContact} onChange={(value) => update("lastContact", value)} />
          <Field label="Próximo seguimiento" value={draft.nextFollowUpAt || ""} onChange={(value) => update("nextFollowUpAt", value)} />
          <Field label="Tipo de acción" value={draft.nextFollowUpType || ""} onChange={(value) => update("nextFollowUpType", value)} />
          <Field label="Última visita" value={draft.lastVisitAt || ""} onChange={(value) => update("lastVisitAt", value)} />
          <Field label="Resultado visita" value={draft.visitResult || ""} onChange={(value) => update("visitResult", value)} />
        </section>
      ) : null}

      {tab === "datos" ? (
        <section className="detail-pane detail-pane--form">
          <Field label="Nombre" value={draft.name} onChange={(value) => update("name", value)} />
          <Field label="Sector" value={draft.sector} onChange={(value) => update("sector", value)} />
          <Field label="Ciudad" value={draft.city} onChange={(value) => update("city", value)} />
          <Field label="Dirección" value={draft.address} onChange={(value) => update("address", value)} />
          <Field label="Teléfono" value={draft.phone} onChange={(value) => update("phone", value)} />
          <Field label="Dueño/contacto" value={draft.ownerName} onChange={(value) => update("ownerName", value)} />
          <Select
            label="Uso contenido"
            value={draft.contentUse}
            options={contentUses}
            onChange={(value) => update("contentUse", value as ContentUse)}
          />
          <Select
            label="Seguidores IG"
            value={draft.followersBucket}
            options={followersBuckets}
            onChange={(value) => update("followersBucket", value as FollowersBucket)}
          />
          <Field label="Instagram" value={draft.instagramUrl} onChange={(value) => update("instagramUrl", value)} />
          <Field label="Facebook" value={draft.facebookUrl} onChange={(value) => update("facebookUrl", value)} />
          <Field label="WhatsApp" value={draft.whatsappUrl} onChange={(value) => update("whatsappUrl", value)} />
          <Field label="Web" value={draft.website} onChange={(value) => update("website", value)} />
          <Field label="Logo" value={draft.logoUrl} onChange={(value) => update("logoUrl", value)} />
          <Field label="Título web" value={draft.websiteTitle} onChange={(value) => update("websiteTitle", value)} />
          <NumberField label="Rating" value={draft.rating} onChange={(value) => update("rating", value)} />
          <NumberField label="Reseñas" value={draft.reviews} onChange={(value) => update("reviews", value)} />
          <NumberField label="Fotos" value={draft.googlePhotos} onChange={(value) => update("googlePhotos", value)} />
          <NumberField label="Latitud" value={draft.latitude || 0} onChange={(value) => update("latitude", value)} />
          <NumberField label="Longitud" value={draft.longitude || 0} onChange={(value) => update("longitude", value)} />
          <Field label="Google Maps" value={draft.googleMapsUrl} onChange={(value) => update("googleMapsUrl", value)} />
          <label className="check-row">
            <input type="checkbox" checked={draft.isInvalid} onChange={(event) => update("isInvalid", event.target.checked)} />
            Marcado como inválido
          </label>
          {draft.isInvalid ? (
            <Field label="Motivo inválido" value={draft.invalidReason} onChange={(value) => update("invalidReason", value)} />
          ) : null}
        </section>
      ) : null}

      <div className="detail-actions detail-actions--footer">
        <button className="button" type="button" onClick={() => onSave(draft)}>
          Guardar cambios
        </button>
        <a className="button button--ghost" href={searchUrls.instagram} target="_blank" rel="noreferrer">
          Buscar Instagram
        </a>
        <a className="button button--ghost" href={searchUrls.facebook} target="_blank" rel="noreferrer">
          Buscar Facebook
        </a>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Signal({ label, active }: { label: string; active: boolean }) {
  return <span className={active ? "signal signal--on" : "signal"}>{label}</span>;
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input type="number" value={value || ""} onChange={(event) => onChange(Number(event.target.value || 0))} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="detail-form__wide">
      {label}
      <textarea value={value} rows={3} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function whatsappFromPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits.startsWith("34") ? digits : `34${digits}`}` : "#";
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function messageSuggestion(lead: Lead, planName: string) {
  return (
    lead.diagnosis ||
    `Hola, soy Firekworks. Hemos revisado ${lead.name} y vemos una oportunidad clara para captar más clientes locales con ${planName}: contenido profesional, Google Business Profile, WhatsApp Business y Meta Ads con seguimiento.`
  );
}
