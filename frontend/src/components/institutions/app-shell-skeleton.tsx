"use client";
import { GraduationCap } from "lucide-react";
import { LoadingState } from "../route-states.tsx";
import { Skeleton } from "../skeletons.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";

const navItems = ["5.5rem", "4.5rem"];

/**
 * `InstitutionShell` geometry while the authorized institutional context is still unknown. The
 * frame is decorative and hidden from assistive technology: no links, landmarks, names, avatars or
 * institution, and only the two navigation rows every member receives (Mis cursos, Mi perfil).
 * Role-dependent rows and actions arrive with the real shell. The content area is the neutral
 * `LoadingState`, the single announcement. Surfaces render at once; bars follow the reveal delay.
 */
export function AppShellSkeleton() {
  return <div className="app academic-app app-shell-skeleton" ref={useSkeletonDelay<HTMLDivElement>()}>
    <div className="sidebar skeleton-shell" aria-hidden="true">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <span className="logo-icon"><GraduationCap size={16} /></span>
          <span className="logo-name">AcademiX</span>
        </div>
        <span className="skeleton-menu-button"><Skeleton shape="block" width="34px" height="34px" /></span>
        <div className="tenant-badge"><Skeleton width="72%" /></div>
      </div>
      <div className="sidebar-menu">
        <div className="sidebar-nav">
          <p className="nav-section-label"><Skeleton width="7.5rem" /></p>
          {navItems.map(width => <div key={width} className="nav-item">
            <Skeleton shape="block" width="16px" height="16px" /><Skeleton width={width} />
          </div>)}
        </div>
        <div className="sidebar-bottom">
          <div className="user-row">
            <Skeleton shape="pill" width="32px" height="32px" />
            <div className="skeleton-user-copy"><p className="name"><Skeleton width="8rem" /></p><p className="role"><Skeleton width="6rem" /></p></div>
          </div>
        </div>
      </div>
    </div>
    <div className="main">
      <div className="top-header skeleton-shell" aria-hidden="true">
        <div className="breadcrumb"><Skeleton width="4rem" /><Skeleton width="3rem" /><Skeleton width="4rem" /></div>
        <div className="header-tools"><Skeleton shape="block" width="34px" height="34px" /></div>
      </div>
      <main className="content"><LoadingState /></main>
    </div>
  </div>;
}
