import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type WorkspaceView = "leads" | "map" | "route" | "pipeline" | "calendar" | "system";

type AppShellProps = {
  children: ReactNode;
  currentView: WorkspaceView;
};

const navItems: Array<{ href: string; id: WorkspaceView; label: string; icon: string }> = [
  { href: "/leads", id: "leads", label: "Comercios", icon: "leads" },
  { href: "/map", id: "map", label: "Mapa", icon: "map" },
  { href: "/route", id: "route", label: "Ruta", icon: "route" },
  { href: "/pipeline", id: "pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/calendar", id: "calendar", label: "Calendario", icon: "calendar" },
  { href: "/system", id: "system", label: "Sistema", icon: "system" }
];

export function AppShell({ children, currentView }: AppShellProps) {
  return (
    <div className="shell shell--local-crm">
      <aside className="sidebar">
        <Link href="/leads" className="brand" aria-label="Firekworks Leads">
          <span className="brand__mark">
            <Image src="/firekworks-icon.png" width={22} height={32} alt="" priority style={{ width: "auto", height: "32px" }} />
          </span>
          <span>
            <strong>Firekworks</strong>
            <small>Leads</small>
          </span>
        </Link>

        <nav className="sidebar__nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={currentView === item.id ? "nav-item nav-item--active" : "nav-item"}
            >
              <span className={`css-icon css-icon--${item.icon}`} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar__note">
          <span>Zona fija</span>
          <strong>Castalla, Ibi, Onil, Tibi, Biar, Sax, Elda y Petrer. Alcoy solo histórico.</strong>
        </div>
      </aside>

      <div className="main-pane">{children}</div>
    </div>
  );
}
