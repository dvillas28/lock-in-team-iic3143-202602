"use client";
import { ChevronRight, ClipboardList, FileText, FolderOpen, GraduationCap, Home, Menu, Moon, Shield, Sun, X, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import { isId } from "../../lib/courses/validation.ts";
import { institutionHomePath } from "../../lib/institution-routes.ts";
type InstitutionShellProps = Readonly<{
    institutionSlug?: string;
    children?: ReactNode;
    user?: CurrentUser;
    institutionName?: string;
    actions?: ReactNode;
    avatar?: ReactNode;
    pathname?: string;
}>;
function pageTitle(pathname: string) {
    if (pathname === '/profile') return 'Mi perfil';
    if (pathname === '/profile/security') return 'Seguridad';
    if (pathname === '/admin/users') return 'Usuarios institucionales';
    if (pathname.endsWith('/grades')) {
        return 'Mis notas';
    }
    if (pathname.endsWith('/gradebook')) {
        return 'Libro de notas';
    }
    if (pathname.endsWith('/audit')) {
        return 'Auditoría';
    }
    if (pathname.includes('/attempts/')) {
        return 'Revisión de intento';
    }
    if (pathname.endsWith('/attempts')) {
        return 'Intentos';
    }
    if (pathname.endsWith('/authoring')) {
        return 'Autoría y pauta';
    }
    if (pathname.includes('/assignments/')) return 'Detalle de la tarea';
    if (pathname.endsWith('/assignments')) return 'Tareas';
    if (pathname.includes('/quizzes/')) {
        return 'Detalle del quiz';
    }
    if (pathname.endsWith('/quizzes')) {
        return 'Quizzes';
    }
    if (pathname.includes('/files/')) return 'Archivo';
    if (pathname.includes('/materials/')) {
        return 'Material';
    }
    if (pathname.endsWith('/modules')) {
        return 'Módulos';
    }
    if (pathname.endsWith('/sections')) {
        return 'Secciones';
    }
    return 'Curso';
}
function toggleTheme() {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
}
export function InstitutionShell({ institutionSlug, institutionName, actions, avatar, children, user, pathname = "/courses" }: InstitutionShellProps) {
    const homePath = institutionSlug ? institutionHomePath(institutionSlug) : '/#instituciones';
    const homeLabel = institutionSlug ? 'Mis cursos' : 'Instituciones';
    const profilePage = pathname === '/profile';
    const securityPage = pathname === '/profile/security';
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButton = useRef<HTMLButtonElement>(null);
    const navigation = useRef<HTMLElement>(null);
    const courseId = pathname.startsWith('/courses/') ? pathname.split('/')[2] : undefined;
    const base = courseId && isId(courseId) ? `/courses/${courseId}` : undefined;
    const roles = user ? [...new Set(user.sectionMemberships.filter(m => !courseId || m.courseId === courseId).map(m => ({ teacher: 'Docente', student: 'Estudiante', assistant: 'Ayudante' })[m.role]))] : [];
    const closeMenu = () => { setMenuOpen(false); menuButton.current?.focus({preventScroll:true}); };
    useEffect(() => {
      if (!menuOpen) return;
      function onEscape(event: KeyboardEvent) {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        event.preventDefault();
        setMenuOpen(false);
        menuButton.current?.focus({preventScroll:true});
      }
      window.addEventListener('keydown', onEscape);
      return () => window.removeEventListener('keydown', onEscape);
    }, [menuOpen]);
    return (<div className={`app academic-app${menuOpen ? ' menu-open' : ''}`}>
      <a href="#main-content" className="btn btn-primary skip-link">Saltar al contenido</a>
      <aside className="sidebar" aria-label={institutionSlug ? "Contexto institucional" : "Mi cuenta"}>
        <div className="sidebar-top">
          <Link href={homePath} className="sidebar-logo institution-brand" aria-label="AcademiX, inicio académico">
            <span className="logo-icon"><GraduationCap size={16} aria-hidden="true"/></span>
            <span className="logo-name">AcademiX</span>
          </Link>
          <button ref={menuButton} type="button" className="icon-btn mobile-menu-button" aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={menuOpen} aria-controls="institution-menu" onClick={() => {
            if (menuOpen) closeMenu(); else { setMenuOpen(true); requestAnimationFrame(() => navigation.current?.querySelector<HTMLAnchorElement>('a')?.focus({preventScroll:true})); }
          }}>{menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}</button>
          {institutionSlug && <div className="tenant-badge institution-context">
            <span>Institución: <strong>{institutionName ?? institutionSlug}</strong></span>
          </div>}
        </div>
        <div className="sidebar-menu" id="institution-menu">
        <nav ref={navigation} id="institution-navigation" className="sidebar-nav" aria-label={institutionSlug ? "Navegación institucional" : "Navegación de cuenta"}>
          <p className="nav-section-label">{institutionSlug ? "Espacio académico" : "Mi cuenta"}</p>
          <Link href={homePath} className={`nav-item${pathname === homePath ? " active" : ""}`} aria-current={pathname === homePath ? "page" : undefined} onClick={() => setMenuOpen(false)}>
            <Home size={16} aria-hidden="true"/>
            {homeLabel}
          </Link>
          <Link href="/profile" className={`nav-item${profilePage ? ' active' : ''}`} aria-current={profilePage ? 'page' : undefined} onClick={()=>setMenuOpen(false)}><UserRound size={16} aria-hidden="true"/>Mi perfil</Link>
          {(profilePage || securityPage) && <Link href="/profile/security" className={`nav-item${securityPage ? ' active' : ''}`} aria-current={securityPage ? 'page' : undefined} onClick={()=>setMenuOpen(false)}><Shield size={16} aria-hidden="true"/>Seguridad</Link>}
          {user && (user.institutionMembership.isAdmin || user.institutionMembership.isSuperAdmin) && <Link href="/admin/users" className={`nav-item${pathname === '/admin/users' ? ' active' : ''}`} aria-current={pathname === '/admin/users' ? 'page' : undefined} onClick={()=>setMenuOpen(false)}><Users size={16} aria-hidden="true"/>Usuarios institucionales</Link>}
          {base && <><p className="nav-section-label">Curso actual</p>{[
            [base + '/modules', 'Módulos y material', FolderOpen], [base + '/quizzes', 'Quizzes', ClipboardList],
            ...(user?.sectionMemberships.some(m => `/courses/${m.courseId}` === base && ['teacher','student'].includes(m.role))
              ? [[base + '/assignments', 'Tareas', FileText]] : []),
          ].map(([href, label, Icon]) => {
            const target = href as string, active = pathname === target || target !== base && pathname.startsWith(target + '/');
            const Glyph = Icon as typeof Home;
            return <Link key={target} href={target} className={`nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => setMenuOpen(false)}><Glyph size={16} aria-hidden="true" />{label as string}</Link>;
          })}</>}
        </nav>
        {user && <div className="sidebar-bottom institution-user"><div className="user-row">{avatar ?? <span className="avatar" aria-hidden="true">{user.name.slice(0,1)}</span>}<div><p className="name">{user.name}</p><p className="role">{[...roles, ...(user.institutionMembership.isAdmin ? ['Administración institucional'] : []), ...(user.institutionMembership.isSuperAdmin ? ['Superadministración'] : [])].join(' · ') || 'Miembro institucional'}</p></div></div>{actions}</div>}
        </div>
      </aside>
      <div className="main">
        <header className="top-header">
          <nav className="breadcrumb institution-context" aria-label="Ruta de navegación">
            <Link href={homePath}>AcademiX</Link>
            {institutionSlug && <><ChevronRight size={14} aria-hidden="true"/>
            <span>{institutionSlug}</span>
            <ChevronRight size={14} aria-hidden="true"/>
            <Link href={homePath} aria-current={pathname === homePath ? "page" : undefined}>Cursos</Link></>}
            {base && pathname !== base && <><ChevronRight size={14} aria-hidden="true"/><Link href={base + "/modules"}>Curso</Link></>}
            {base && pathname.includes('/assignments/') && <><ChevronRight size={14} aria-hidden="true"/><Link href={base + '/assignments'}>Tareas</Link></>}
            {base && pathname.includes('/quizzes/') && <><ChevronRight size={14} aria-hidden="true"/><Link href={base + '/quizzes'}>Quizzes</Link></>}
            {base && (pathname.includes('/materials/') || pathname.includes('/files/')) && <><ChevronRight size={14} aria-hidden="true"/><Link href={base + '/modules'}>Módulos</Link></>}
            {base && pathname.includes('/attempts/') && <><ChevronRight size={14} aria-hidden="true"/><Link href={pathname.split('/attempts/')[0] + '/attempts'}>Intentos</Link></>}
            {pathname !== homePath && <><ChevronRight size={14} aria-hidden="true"/><span className="crumb-active" aria-current="page">{pageTitle(pathname)}</span></>}
          </nav>
          <div className="header-tools"><button type="button" className="icon-btn" aria-label="Cambiar tema" onClick={toggleTheme}><Moon className="only-light" size={16} aria-hidden="true" /><Sun className="only-dark" size={16} aria-hidden="true" /></button>{!user && actions}</div>
        </header>
        <main key={institutionSlug} id="main-content" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>);
}
