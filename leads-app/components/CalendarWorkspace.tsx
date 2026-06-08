"use client";

import type { Lead } from "@/types/lead";
import { scoreTone } from "@/lib/scoring";

type CalendarWorkspaceProps = {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onMarkContacted: (lead: Lead) => void;
  onCreateTask: (lead: Lead) => void;
};

export function CalendarWorkspace({ leads, onSelect, onMarkContacted, onCreateTask }: CalendarWorkspaceProps) {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = leads
    .filter((lead) => lead.nextFollowUpAt || lead.nextAction)
    .sort((a, b) => (a.nextFollowUpAt || "9999").localeCompare(b.nextFollowUpAt || "9999"));
  const dueToday = tasks.filter((lead) => (lead.nextFollowUpAt || "").slice(0, 10) <= today);

  return (
    <section className="calendar-workspace">
      <div className="calendar-hero">
        <div>
          <span className="eyebrow">Seguimiento</span>
          <h2>Hoy</h2>
          <p>{dueToday.length ? `${dueToday.length} comercios piden movimiento.` : "Sin urgencias vencidas."}</p>
        </div>
        <strong>{tasks.length}</strong>
      </div>

      <div className="calendar-columns">
        <FollowUpColumn
          title="Vencidos / hoy"
          leads={dueToday}
          empty="No hay seguimientos vencidos."
          onSelect={onSelect}
          onMarkContacted={onMarkContacted}
          onCreateTask={onCreateTask}
        />
        <FollowUpColumn
          title="Próximos"
          leads={tasks.filter((lead) => !dueToday.includes(lead)).slice(0, 18)}
          empty="Crea tareas desde la ficha o la ruta."
          onSelect={onSelect}
          onMarkContacted={onMarkContacted}
          onCreateTask={onCreateTask}
        />
      </div>
    </section>
  );
}

function FollowUpColumn({
  title,
  leads,
  empty,
  onSelect,
  onMarkContacted,
  onCreateTask
}: {
  title: string;
  leads: Lead[];
  empty: string;
  onSelect: (lead: Lead) => void;
  onMarkContacted: (lead: Lead) => void;
  onCreateTask: (lead: Lead) => void;
}) {
  return (
    <section className="calendar-column">
      <header>
        <span>{title}</span>
        <strong>{leads.length}</strong>
      </header>
      <div>
        {leads.length ? (
          leads.map((lead) => (
            <article className="calendar-card" key={lead.id}>
              <button type="button" onClick={() => onSelect(lead)}>
                <span className={`score-pill score-pill--${scoreTone(lead.score)}`}>{lead.score}</span>
                <span>
                  <strong>{lead.name}</strong>
                  <small>
                    {lead.city} · {lead.nextFollowUpAt || "Sin fecha"}
                  </small>
                  <p>{lead.nextAction || lead.nextFollowUpType}</p>
                </span>
              </button>
              <div>
                <button type="button" onClick={() => onMarkContacted(lead)}>
                  Contactado
                </button>
                <button type="button" onClick={() => onCreateTask(lead)}>
                  Reprogramar
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">{empty}</p>
        )}
      </div>
    </section>
  );
}
