"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell, type WorkspaceView } from "@/components/AppShell";
import { Background } from "@/components/Background";
import { CalendarWorkspace } from "@/components/CalendarWorkspace";
import { Filters } from "@/components/Filters";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetail, type QuickLeadAction } from "@/components/LeadDetail";
import { MapWorkspace } from "@/components/MapWorkspace";
import { PipelineBoard } from "@/components/PipelineBoard";
import { RoutePlanner } from "@/components/RoutePlanner";
import { SystemWorkspace } from "@/components/SystemWorkspace";
import {
  createBlankLead,
  exportLeadsToCsv,
  loadLeads,
  persistLead,
  type LeadsSource
} from "@/lib/leads-repository";
import { estimateMonthlyValue } from "@/lib/scoring";
import { leads as seedLeads, statuses } from "@/lib/mock-leads";
import type { ContentUse, FollowersBucket, Lead, LeadStatus, RouteStop } from "@/types/lead";

type LeadsWorkspaceProps = {
  initialView: WorkspaceView;
};

type EnrichResponse = Partial<
  Pick<Lead, "description" | "instagramUrl" | "facebookUrl" | "whatsappUrl" | "logoUrl" | "websiteTitle">
> & {
  error?: string;
};

type VisitResult = "No estaba" | "Hablado" | "Interesado" | "Enviar propuesta" | "No interesa";

const focusCities = ["Castalla", "Ibi", "Onil", "Tibi", "Biar", "Sax", "Elda", "Petrer"];
const followersBuckets: FollowersBucket[] = ["Pendiente", "Sin cuenta", "< 1.000", "1.000 - 5.000", "+5.000"];
const contentUses: ContentUse[] = ["Pendiente", "Sin uso", "Flojo", "Activo", "Muy trabajado"];

export function LeadsWorkspace({ initialView }: LeadsWorkspaceProps) {
  const [leadItems, setLeadItems] = useState<Lead[]>(seedLeads);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState("");
  const [followersBucket, setFollowersBucket] = useState("");
  const [contentUse, setContentUse] = useState("");
  const [withoutInstagram, setWithoutInstagram] = useState(false);
  const [withoutFacebook, setWithoutFacebook] = useState(false);
  const [withoutWeb, setWithoutWeb] = useState(false);
  const [pendingEnrich, setPendingEnrich] = useState(false);
  const [withPhone, setWithPhone] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [selectedId, setSelectedId] = useState(seedLeads[0]?.id || "");
  const [dataSource, setDataSource] = useState<LeadsSource>("localStorage");
  const [syncMessage, setSyncMessage] = useState("Cargando datos");
  const [enrichingId, setEnrichingId] = useState("");
  const [findingOwnerId, setFindingOwnerId] = useState("");

  useEffect(() => {
    let active = true;

    loadLeads().then((result) => {
      if (!active) return;
      setLeadItems(result.leads);
      setDataSource(result.source);
      setSyncMessage(
        result.source === "supabase"
          ? "Supabase activo"
          : result.error
            ? `Fallback local: ${result.error}`
            : "Fallback local activo"
      );
      setSelectedId((current) => current || result.leads[0]?.id || "");
    });

    return () => {
      active = false;
    };
  }, []);

  const cities = useMemo(() => uniqueOptions(leadItems.map((lead) => lead.city)), [leadItems]);
  const sectors = useMemo(() => uniqueOptions(leadItems.map((lead) => lead.sector)), [leadItems]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leadItems.filter((lead) => {
      const matchesQuery = normalizedQuery
        ? [
            lead.name,
            lead.city,
            lead.sector,
            lead.pain,
            lead.diagnosis,
            lead.nextAction,
            lead.description,
            lead.ownerName,
            lead.websiteTitle
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;

      return (
        matchesQuery &&
        (!city || lead.city === city) &&
        (!sector || lead.sector === sector) &&
        (!status || lead.status === status) &&
        (!followersBucket || lead.followersBucket === followersBucket) &&
        (!contentUse || lead.contentUse === contentUse) &&
        (!withoutInstagram || !lead.instagramUrl) &&
        (!withoutFacebook || !lead.facebookUrl) &&
        (!withoutWeb || !lead.website) &&
        (!pendingEnrich || !lead.lastRefreshedAt || lead.followersBucket === "Pendiente" || lead.contentUse === "Pendiente") &&
        (!withPhone || Boolean(lead.phone)) &&
        (!lead.isInvalid || status === "No contactar" || status === "No encaja") &&
        (!minScore || lead.score >= minScore)
      );
    });
  }, [
    city,
    contentUse,
    followersBucket,
    leadItems,
    minScore,
    pendingEnrich,
    query,
    sector,
    status,
    withPhone,
    withoutFacebook,
    withoutInstagram,
    withoutWeb
  ]);

  const selectedLead = leadItems.find((lead) => lead.id === selectedId) || filteredLeads[0] || leadItems[0];

  const routeStops = useMemo<RouteStop[]>(
    () =>
      leadItems
        .filter(
          (lead) =>
            !lead.isInvalid &&
            !["Ganado", "Perdido", "No encaja", "No contactar"].includes(lead.status) &&
            focusCities.includes(lead.city)
        )
        .slice()
        .sort((a, b) => b.score - a.score)
        .map((lead, index) => ({
          ...lead,
          visitOrder: index + 1,
          routeReason:
            lead.score >= 70
              ? "Demanda visible + hueco digital para propuesta presencial"
              : "Validar escaparate, WhatsApp y oportunidad local"
        })),
    [leadItems]
  );

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const active = leadItems.filter((lead) => !lead.isInvalid && !["Ganado", "No contactar", "No encaja", "Perdido"].includes(lead.status));
    return {
      active: active.length,
      priority: active.filter((lead) => lead.status === "Prioritario" || lead.score >= 70).length,
      followups: active.filter((lead) => (lead.nextFollowUpAt || "").slice(0, 10) <= today && lead.nextFollowUpAt).length,
      monthly: active.reduce((total, lead) => total + estimateMonthlyValue(lead), 0)
    };
  }, [leadItems]);

  function handleSelect(lead: Lead) {
    setSelectedId(lead.id);
  }

  async function handleSaveLead(lead: Lead) {
    const result = await persistLead(lead);
    setLeadItems(result.leads);
    setDataSource(result.source);
    setSyncMessage(result.source === "supabase" ? "Guardado en Supabase" : "Guardado en localStorage");
    setSelectedId(result.lead.id);
  }

  async function handleStatusChange(lead: Lead, nextStatus: LeadStatus) {
    await handleSaveLead({ ...lead, status: nextStatus, updatedAt: new Date().toISOString() });
  }

  async function handleNewLead() {
    const lead = createBlankLead();
    const result = await persistLead(lead);
    setLeadItems(result.leads);
    setSelectedId(lead.id);
    setDataSource(result.source);
    setSyncMessage(result.source === "supabase" ? "Comercio creado en Supabase" : "Comercio creado localmente");
  }

  async function handleEnrich(lead: Lead) {
    setEnrichingId(lead.id);

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lead })
      });
      const enriched = (await response.json()) as EnrichResponse;

      const nextLead = {
        ...lead,
        description: enriched.description || lead.description,
        instagramUrl: enriched.instagramUrl || lead.instagramUrl,
        facebookUrl: enriched.facebookUrl || lead.facebookUrl,
        whatsappUrl: enriched.whatsappUrl || lead.whatsappUrl,
        logoUrl: enriched.logoUrl || lead.logoUrl,
        websiteTitle: enriched.websiteTitle || lead.websiteTitle,
        lastRefreshedAt: new Date().toISOString()
      };

      await handleSaveLead(nextLead);
      setSyncMessage(enriched.error ? `Enriquecimiento parcial: ${enriched.error}` : "Web/redes enriquecidas");
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "No se pudo enriquecer el comercio");
    } finally {
      setEnrichingId("");
    }
  }

  async function handleFindOwner(lead: Lead) {
    setFindingOwnerId(lead.id);

    try {
      const response = await fetch("/api/places/owner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ placeId: lead.placeId, allowPaidRequests: false })
      });
      const payload = (await response.json()) as { candidates?: string[]; message?: string; error?: string };

      if (!response.ok) throw new Error(payload.error || "No se pudieron revisar reseñas");
      setSyncMessage(payload.message || "Búsqueda de dueño preparada sin consumir Google Places");
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "No se pudieron revisar reseñas");
    } finally {
      setFindingOwnerId("");
    }
  }

  async function handleQuickAction(lead: Lead, action: QuickLeadAction) {
    const now = new Date().toISOString();
    const nextLead = { ...lead, updatedAt: now };

    if (action === "add-route") {
      await handleSaveLead({
        ...nextLead,
        status: lead.status === "Detectado" || lead.status === "Validado" ? "Prioritario" : lead.status,
        priority: lead.priority === "Muy alta" ? "Muy alta" : "Alta",
        nextAction: "Añadir a próxima ruta presencial"
      });
      return;
    }

    if (action === "prioritize") {
      await handleSaveLead({ ...nextLead, status: "Prioritario", priority: "Muy alta", nextAction: "Preparar ángulo y contacto" });
      return;
    }

    if (action === "contacted") {
      await handleSaveLead({ ...nextLead, status: "Contactado", lastContact: readableDate(), nextAction: "Programar seguimiento" });
      return;
    }

    if (action === "discard") {
      await handleSaveLead({ ...nextLead, status: "No contactar", nextAction: "No insistir salvo cambio de señales" });
      return;
    }

    await handleSaveLead({
      ...nextLead,
      status: "Ganado",
      lastContact: readableDate(),
      nextAction: "Abrir alta interna y vincular con Firekworks Stats"
    });
  }

  async function handleMarkVisited(lead: RouteStop, result: VisitResult) {
    const statusByResult: Record<VisitResult, LeadStatus> = {
      "No estaba": "Contactado",
      Hablado: "Contactado",
      Interesado: "Prioritario",
      "Enviar propuesta": "Propuesta enviada",
      "No interesa": "No contactar"
    };

    await handleSaveLead({
      ...lead,
      status: statusByResult[result],
      visitResult: result,
      lastVisitAt: new Date().toISOString(),
      lastContact: `Visita ${readableDate()}`,
      nextAction: nextActionFromVisit(result),
      updatedAt: new Date().toISOString()
    });
  }

  async function handleCreateTask(lead: Lead) {
    const next = new Date();
    next.setDate(next.getDate() + 2);
    next.setHours(10, 0, 0, 0);

    const updated = {
      ...lead,
      nextFollowUpAt: next.toISOString(),
      nextFollowUpType: lead.nextFollowUpType || "Seguimiento comercial",
      nextAction: lead.nextAction || "Seguimiento comercial",
      updatedAt: new Date().toISOString()
    };

    await handleSaveLead(updated);

    try {
      await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          title: `Seguimiento: ${lead.name}`,
          scheduledAt: next.toISOString(),
          type: "Seguimiento comercial"
        })
      });
    } catch {
      // The lead itself already stores the reminder; external calendar sync is optional.
    }
  }

  const title = viewTitle(initialView);
  const subtitle =
    initialView === "leads"
      ? "Prioriza visitas locales con datos útiles."
      : "Comercios locales, seguimiento y captación presencial sin ruido.";

  return (
    <main className="app">
      <Background />
      <AppShell currentView={initialView}>
        <header className="workspace-header workspace-header--crm">
          <div>
            <p className="eyebrow">CRM interno Firekworks</p>
            <h1>{title}</h1>
            <p className="workspace-subtitle">{subtitle}</p>
          </div>
          <div className="header-actions">
            <span className={`source-pill source-pill--${dataSource}`}>{syncMessage}</span>
            <button className="button button--ghost" type="button" onClick={() => exportLeadsToCsv(filteredLeads)}>
              Exportar CSV
            </button>
            <button className="button" type="button" onClick={handleNewLead}>
              <span className="css-icon css-icon--plus" />
              Nuevo comercio
            </button>
          </div>
        </header>

        {initialView !== "system" ? (
          <section className="stat-strip stat-strip--crm" aria-label="Resumen comercial">
            <article>
              <span>Activos</span>
              <strong>{stats.active}</strong>
            </article>
            <article>
              <span>Prioritarios</span>
              <strong>{stats.priority}</strong>
            </article>
            <article>
              <span>Seguimientos</span>
              <strong>{stats.followups}</strong>
            </article>
            <article>
              <span>Potencial mensual</span>
              <strong>≈ {stats.monthly}€</strong>
            </article>
          </section>
        ) : null}

        <AnimatePresence mode="wait">
          {initialView === "leads" ? (
            <motion.section
              key="leads"
              className="radar-layout radar-layout--crm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="radar-main">
                <Filters
                  cities={cities}
                  sectors={sectors}
                  statuses={statuses}
                  followersBuckets={followersBuckets}
                  contentUses={contentUses}
                  query={query}
                  city={city}
                  sector={sector}
                  status={status}
                  followersBucket={followersBucket}
                  contentUse={contentUse}
                  withoutInstagram={withoutInstagram}
                  withoutFacebook={withoutFacebook}
                  withoutWeb={withoutWeb}
                  pendingEnrich={pendingEnrich}
                  withPhone={withPhone}
                  minScore={minScore}
                  onQuery={setQuery}
                  onCity={setCity}
                  onSector={setSector}
                  onStatus={setStatus}
                  onFollowersBucket={setFollowersBucket}
                  onContentUse={setContentUse}
                  onWithoutInstagram={setWithoutInstagram}
                  onWithoutFacebook={setWithoutFacebook}
                  onWithoutWeb={setWithoutWeb}
                  onPendingEnrich={setPendingEnrich}
                  onWithPhone={setWithPhone}
                  onMinScore={setMinScore}
                />

                <div className="lead-list">
                  {filteredLeads.length ? (
                    filteredLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        active={lead.id === selectedLead?.id}
                        onSelect={handleSelect}
                      />
                    ))
                  ) : (
                    <div className="empty-panel">
                      <strong>No hay comercios con esos filtros</strong>
                      <span>Prueba otra ciudad, sector, señal o score.</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedLead ? (
                <LeadDetail
                  lead={selectedLead}
                  statuses={statuses}
                  onSave={handleSaveLead}
                  onEnrich={handleEnrich}
                  onFindOwner={handleFindOwner}
                  onQuickAction={handleQuickAction}
                  enriching={enrichingId === selectedLead.id}
                  findingOwner={findingOwnerId === selectedLead.id}
                />
              ) : null}
            </motion.section>
          ) : null}

          {initialView === "map" ? (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MapWorkspace leads={filteredLeads} selectedId={selectedLead?.id || ""} onSelect={handleSelect} />
            </motion.div>
          ) : null}

          {initialView === "route" ? (
            <motion.section
              key="route"
              className="route-layout route-layout--crm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RoutePlanner stops={routeStops} onSelect={handleSelect} onMarkVisited={handleMarkVisited} onCreateTask={handleCreateTask} />
              {selectedLead ? (
                <LeadDetail
                  lead={selectedLead}
                  statuses={statuses}
                  onSave={handleSaveLead}
                  onEnrich={handleEnrich}
                  onFindOwner={handleFindOwner}
                  onQuickAction={handleQuickAction}
                  enriching={enrichingId === selectedLead.id}
                  findingOwner={findingOwnerId === selectedLead.id}
                />
              ) : null}
            </motion.section>
          ) : null}

          {initialView === "pipeline" ? (
            <motion.section
              key="pipeline"
              className="pipeline-layout pipeline-layout--crm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PipelineBoard
                leads={leadItems}
                selectedId={selectedLead?.id || ""}
                onSelect={handleSelect}
                onStatusChange={handleStatusChange}
              />
              {selectedLead ? (
                <LeadDetail
                  lead={selectedLead}
                  statuses={statuses}
                  onSave={handleSaveLead}
                  onEnrich={handleEnrich}
                  onFindOwner={handleFindOwner}
                  onQuickAction={handleQuickAction}
                  enriching={enrichingId === selectedLead.id}
                  findingOwner={findingOwnerId === selectedLead.id}
                />
              ) : null}
            </motion.section>
          ) : null}

          {initialView === "calendar" ? (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CalendarWorkspace
                leads={leadItems}
                onSelect={handleSelect}
                onMarkContacted={(lead) => handleQuickAction(lead, "contacted")}
                onCreateTask={handleCreateTask}
              />
            </motion.div>
          ) : null}

          {initialView === "system" ? (
            <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SystemWorkspace />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </AppShell>
    </main>
  );
}

function viewTitle(view: WorkspaceView) {
  const titles: Record<WorkspaceView, string> = {
    leads: "Comercios",
    map: "Mapa local",
    route: "Ruta de visitas",
    pipeline: "Pipeline",
    calendar: "Calendario",
    system: "Sistema"
  };

  return titles[view];
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
}

function readableDate() {
  return new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function nextActionFromVisit(result: VisitResult) {
  const actions: Record<VisitResult, string> = {
    "No estaba": "Volver a pasar o llamar en otro horario",
    Hablado: "Enviar resumen breve por WhatsApp",
    Interesado: "Preparar diagnóstico visual y propuesta",
    "Enviar propuesta": "Enviar propuesta de captación local",
    "No interesa": "No contactar salvo nueva señal"
  };

  return actions[result];
}
