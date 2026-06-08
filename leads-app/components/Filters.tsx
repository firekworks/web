import type { ContentUse, FollowersBucket, LeadCity, LeadSector, LeadStatus } from "@/types/lead";

type FiltersProps = {
  cities: LeadCity[];
  sectors: LeadSector[];
  statuses: LeadStatus[];
  followersBuckets: FollowersBucket[];
  contentUses: ContentUse[];
  query: string;
  city: string;
  sector: string;
  status: string;
  followersBucket: string;
  contentUse: string;
  withoutInstagram: boolean;
  withoutFacebook: boolean;
  withoutWeb: boolean;
  pendingEnrich: boolean;
  withPhone: boolean;
  minScore: number;
  onQuery: (value: string) => void;
  onCity: (value: string) => void;
  onSector: (value: string) => void;
  onStatus: (value: string) => void;
  onFollowersBucket: (value: string) => void;
  onContentUse: (value: string) => void;
  onWithoutInstagram: (value: boolean) => void;
  onWithoutFacebook: (value: boolean) => void;
  onWithoutWeb: (value: boolean) => void;
  onPendingEnrich: (value: boolean) => void;
  onWithPhone: (value: boolean) => void;
  onMinScore: (value: number) => void;
};

export function Filters({
  cities,
  sectors,
  statuses,
  followersBuckets,
  contentUses,
  query,
  city,
  sector,
  status,
  followersBucket,
  contentUse,
  withoutInstagram,
  withoutFacebook,
  withoutWeb,
  pendingEnrich,
  withPhone,
  minScore,
  onQuery,
  onCity,
  onSector,
  onStatus,
  onFollowersBucket,
  onContentUse,
  onWithoutInstagram,
  onWithoutFacebook,
  onWithoutWeb,
  onPendingEnrich,
  onWithPhone,
  onMinScore
}: FiltersProps) {
  return (
    <div className="filters filters--crm">
      <label className="search-field">
        <span className="css-icon css-icon--search" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Buscar comercio, señal, dolor o próxima acción"
        />
      </label>

      <Select label="Ciudad" value={city} options={cities} onChange={onCity} />
      <Select label="Sector" value={sector} options={sectors} onChange={onSector} />
      <Select label="Estado" value={status} options={statuses} onChange={onStatus} />
      <Select label="Seguidores IG" value={followersBucket} options={followersBuckets} onChange={onFollowersBucket} />
      <Select label="Contenido" value={contentUse} options={contentUses} onChange={onContentUse} />

      <label className="score-filter">
        <span>Score</span>
        <input
          type="number"
          min={0}
          max={100}
          value={minScore || ""}
          onChange={(event) => onMinScore(Number(event.target.value || 0))}
        />
      </label>

      <div className="filter-toggles" aria-label="Filtros rápidos">
        <Toggle label="Sin Instagram" checked={withoutInstagram} onChange={onWithoutInstagram} />
        <Toggle label="Sin Facebook" checked={withoutFacebook} onChange={onWithoutFacebook} />
        <Toggle label="Sin web" checked={withoutWeb} onChange={onWithoutWeb} />
        <Toggle label="Pendiente enriquecer" checked={pendingEnrich} onChange={onPendingEnrich} />
        <Toggle label="Con teléfono" checked={withPhone} onChange={onWithPhone} />
      </div>
    </div>
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
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {options.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
