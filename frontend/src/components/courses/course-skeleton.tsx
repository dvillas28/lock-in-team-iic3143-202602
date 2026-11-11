"use client";
import type { ReactNode } from "react";
import { PageHeaderSkeleton, Skeleton, SkeletonRegion } from "../skeletons.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";

/**
 * Course header and tabs while a course section loads. The section title is static, so it is the
 * real `<h1>`; course code, term and name are placeholders. Only the two tabs every role receives
 * (Módulos y material, Quizzes) are drawn, as plain shapes: role-dependent tabs appear with the
 * real navigation, and nothing here is a link. `children` replaces the neutral content area with
 * the section's own placeholder.
 */
export function CourseSectionSkeleton({ title, children }: Readonly<{ title: string; children?: ReactNode }>) {
  return <div className="stack academic-workspace" ref={useSkeletonDelay<HTMLDivElement>()}>
    <PageHeaderSkeleton title={title} />
    <SkeletonRegion label={`Cargando ${title.toLocaleLowerCase("es")}…`}>
      <div className="stack">
        <div className="course-navigation skeleton-course-tabs">
          <span className="course-tab"><Skeleton width="7.5rem" /></span>
          <span className="course-tab"><Skeleton width="3.25rem" /></span>
        </div>
        {children ?? <div className="card panel stack">
          <Skeleton width="min(16rem, 60%)" />
          <Skeleton width="90%" />
          <Skeleton width="72%" />
        </div>}
      </div>
    </SkeletonRegion>
  </div>;
}
