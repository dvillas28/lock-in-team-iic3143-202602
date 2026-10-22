import { ChevronRight, GraduationCap, Home } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { institutionHomePath } from "../../lib/institution-routes.ts";

type InstitutionShellProps = Readonly<{
  institutionSlug: string;
  children?: ReactNode;
  institutionName?: string;
  actions?: ReactNode;
  pathname?: string;
}>;

export function InstitutionShell({ institutionSlug, institutionName, actions, children, pathname = "/courses" }: InstitutionShellProps) {
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
          <Link href={homePath} className="nav-item active" aria-current={pathname === homePath ? "page" : undefined}>
            <Home size={16} aria-hidden="true" />
            Mis cursos
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
            <Link href={homePath} aria-current={pathname === homePath ? "page" : undefined}>Cursos</Link>
            {/\/(grades|gradebook|audit)$/.test(pathname) && <><ChevronRight size={14} aria-hidden="true"/><Link href={pathname.replace(/\/(grades|gradebook|audit)$/, '')}>Curso</Link></>}
            {pathname.includes("/quizzes") && <><ChevronRight size={14} aria-hidden="true" /><Link href={pathname.split("/quizzes")[0]}>Curso</Link><ChevronRight size={14} aria-hidden="true" /><Link href={pathname.split("/quizzes")[0] + "/quizzes"}>Quizzes</Link></>}
            {pathname.includes("/modules") && <><ChevronRight size={14} aria-hidden="true" /><Link href={pathname.split("/modules")[0]}>Curso</Link></>}
            {pathname.includes("/materials/") && <><ChevronRight size={14} aria-hidden="true" /><Link href={pathname.split("/modules")[0] + "/modules"}>Módulos</Link></>}
            {pathname.includes('/attempts/') && pathname.startsWith('/courses/') && <><ChevronRight size={14} aria-hidden="true"/><Link href={pathname.split('/attempts/')[0]+'/attempts'}>Intentos</Link></>}
            {pathname !== homePath && <><ChevronRight size={14} aria-hidden="true" /><span className="crumb-active" aria-current="page">{pathname.endsWith('/grades')?'Mis notas':pathname.endsWith('/gradebook')?'Libro de notas':pathname.endsWith('/audit')?'Auditoría':pathname.includes('/attempts/')?'Revisión de intento':pathname.endsWith('/attempts')?'Intentos':pathname.endsWith("/authoring") ? "Autoría y pauta" : pathname.includes("/quizzes/") ? "Detalle del quiz" : pathname.endsWith("/quizzes") ? "Quizzes" : pathname.includes("/materials/") ? "Material" : pathname.endsWith("/modules") ? "Módulos" : pathname.endsWith("/sections") ? "Secciones" : "Detalle del curso"}</span></>}
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
