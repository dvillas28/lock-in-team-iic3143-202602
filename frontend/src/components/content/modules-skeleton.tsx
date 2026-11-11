"use client";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";

const widths = ["72%", "56%", "64%"];

/** Mirrors `.module-workspace`: side index and collapsed modules. Shapes only, no links or tools. */
export function ModulesSkeleton() {
  return <div className="module-workspace content-skeleton">
    <div className="module-index card">
      <p className="section-label"><Skeleton width="8rem" /></p>
      {widths.map(width => <span key={width} className="nav-item"><Skeleton width={width} /></span>)}
    </div>
    <div className="stack">{widths.map(width =>
      <div key={width} className="card academic-module"><div className="module-header">
        <p className="skeleton-module-title"><Skeleton width={width} /></p>
        <Skeleton shape="pill" width="5rem" />
      </div></div>)}
    </div>
  </div>;
}

/** Module list pending while the real course header and tabs are already shown. */
export function ModulesPending() {
  return <div ref={useSkeletonDelay<HTMLDivElement>()}>
    <SkeletonRegion label="Cargando módulos…"><ModulesSkeleton /></SkeletonRegion>
  </div>;
}

/**
 * Resources of an expanded module: the static toolbar label, then the real `.module-resource`
 * rows. Shown only after `useDelayedFlag`, so it reveals at once instead of adding another delay.
 */
export function ResourcesPending() {
  return <div className="module-materials resource-skeleton">
    <div className="resource-toolbar"><span className="section-label">Materiales del módulo</span></div>
    <SkeletonRegion label="Cargando materiales…">
      <ul className="module-resource-list content-skeleton">{widths.slice(0, 2).map(width =>
        <li key={width} className="material-item"><div className="module-resource">
          <Skeleton shape="block" width="18px" height="18px" />
          <div className="module-resource-info"><p><Skeleton width={width} /></p><p className="hint"><Skeleton width="6rem" /></p></div>
        </div></li>)}
      </ul>
    </SkeletonRegion>
  </div>;
}

/** Quiz choices of «Enlazar cuestionario», on the real `.option` rows; also behind `useDelayedFlag`. */
export function QuizChoicesPending() {
  return <div className="resource-skeleton">
    <SkeletonRegion label="Cargando cuestionarios…">
      <div className="stack quiz-choices content-skeleton">
        <p className="field-label"><Skeleton width="10rem" /></p>
        {widths.map(width => <div key={width} className="option">
          <Skeleton shape="pill" width="16px" height="16px" /><span className="skeleton-option-label"><Skeleton width={width} /></span>
        </div>)}
      </div>
    </SkeletonRegion>
  </div>;
}
