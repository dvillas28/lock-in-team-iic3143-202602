import { ChevronRight, GraduationCap, Home } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { institutionHomePath } from "../../lib/institution-routes.ts";

type InstitutionShellProps = Readonly<{
  institutionSlug: string;
  children?: ReactNode;
  institutionName?: string;
  actions?: ReactNode;
}>;

export function InstitutionShell({ institutionSlug, institutionName, actions, children }: InstitutionShellProps) {
  const homePath = institutionHomePath(institutionSlug);

  return (
    <div className="app">
      <a href="#main-content" className="btn btn-primary skip-link">Saltar al contenido</a>
      <aside className="sidebar" aria-label="Contexto institucional">
        <div className="sidebar-top">
          <Link href="/" className="sidebar-logo institution-brand" aria-label="AcademiX, inicio global">
            <span className="logo-icon"><GraduationCap size={16} aria-hidden="true" /></span>
            <span className="logo-name">AcademiX</span>
          </Link>
          <div className="tenant-badge institution-context">
            <span>Institución: <strong>{institutionName ?? institutionSlug}</strong></span>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación institucional">
          <Link href={homePath} className="nav-item active" aria-current="page">
            <Home size={16} aria-hidden="true" />
            Inicio
          </Link>
        </nav>
      </aside>
      <div className="main">
        <header className="top-header">
          <nav className="breadcrumb institution-context" aria-label="Ruta de navegación">
            <Link href="/">AcademiX</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span>{institutionSlug}</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="crumb-active">Inicio</span>
          </nav>
          {actions}
        </header>
        <main key={institutionSlug} id="main-content" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
