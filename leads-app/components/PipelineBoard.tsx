"use client";

import type { DragEvent } from "react";
import type { Lead, LeadStatus, PipelineColumnId } from "@/types/lead";
import { estimateMonthlyValue, scoreTone } from "@/lib/scoring";

type PipelineBoardProps = {
  leads: Lead[];
  selectedId: string;
  onSelect: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
};

type PipelineColumn = {
  id: PipelineColumnId;
  title: string;
  tone: string;
  primaryStatus: LeadStatus;
  statuses: LeadStatus[];
};

const columns: PipelineColumn[] = [
  {
    id: "discard",
    title: "Descartar",
    tone: "red",
    primaryStatus: "No contactar",
    statuses: ["No contactar", "No encaja", "Perdido"]
  },
  {
    id: "detected",
    title: "Detectados",
    tone: "gray",
    primaryStatus: "Detectado",
    statuses: ["Detectado", "Validado"]
  },
  {
    id: "priority",
    title: "Prioritarios",
    tone: "yellow",
    primaryStatus: "Prioritario",
    statuses: ["Prioritario"]
  },
  {
    id: "contacted",
    title: "Contactados",
    tone: "blue",
    primaryStatus: "Contactado",
    statuses: ["Contactado", "Respondió", "Reunión agendada", "Diagnóstico hecho"]
  },
  {
    id: "closing",
    title: "Cierre",
    tone: "lilac",
    primaryStatus: "Propuesta enviada",
    statuses: ["Propuesta enviada", "Negociación", "Ganado"]
  }
];

export function PipelineBoard({ leads, selectedId, onSelect, onStatusChange }: PipelineBoardProps) {
  function handleDrop(event: DragEvent<HTMLElement>, status: LeadStatus) {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain");
    const lead = leads.find((item) => item.id === leadId);
    if (lead) onStatusChange(lead, status);
  }

  return (
    <div className="pipeline-board pipeline-board--compact">
      {columns.map((column, columnIndex) => {
        const columnLeads = leads
          .filter((lead) => !lead.isInvalid && column.statuses.includes(lead.status))
          .sort((a, b) => b.score - a.score);

        return (
          <section
            className={`pipeline-column pipeline-column--${column.tone}`}
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column.primaryStatus)}
          >
            <header>
              <span>{column.title}</span>
              <strong>{columnLeads.length}</strong>
            </header>
            <div className="pipeline-column__list">
              {columnLeads.length ? (
                columnLeads.map((lead) => (
                  <article
                    className={selectedId === lead.id ? "pipeline-card pipeline-card--active" : "pipeline-card"}
                    key={lead.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", lead.id)}
                  >
                    <button className="pipeline-card__body" type="button" onClick={() => onSelect(lead)}>
                      <span className={`score-pill score-pill--${scoreTone(lead.score)}`}>{lead.score}</span>
                      <span>
                        <strong>{lead.name}</strong>
                        <small>
                          {lead.city} · {lead.status} · ≈ {estimateMonthlyValue(lead)}€/mes
                        </small>
                      </span>
                    </button>
                    <div className="pipeline-card__moves">
                      <button
                        type="button"
                        disabled={columnIndex === 0}
                        onClick={() => onStatusChange(lead, columns[columnIndex - 1].primaryStatus)}
                        aria-label="Retroceder estado"
                      >
                        &lt;
                      </button>
                      <button
                        type="button"
                        disabled={columnIndex === columns.length - 1}
                        onClick={() => onStatusChange(lead, columns[columnIndex + 1].primaryStatus)}
                        aria-label="Avanzar estado"
                      >
                        &gt;
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-state">Vacío</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
