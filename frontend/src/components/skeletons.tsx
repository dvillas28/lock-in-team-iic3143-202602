import type { CSSProperties, ReactNode } from "react";

/**
 * Placeholder geometry only: never interactive, never announced.
 * A `line` fills one line box of its parent, so placing it inside the element that will hold
 * the real text (`h2`, `.hint`, `.section-label`) reproduces that text's height exactly.
 */
type Shape = "line" | "block" | "pill";

export function Skeleton({ shape = "line", width, height }: Readonly<{
  shape?: Shape;
  width?: CSSProperties["inlineSize"];
  height?: CSSProperties["blockSize"];
}>) {
  const size = width === undefined && height === undefined ? undefined : { inlineSize: width, blockSize: height };
  return <span aria-hidden="true" className={`skeleton skeleton-${shape}`} style={size} />;
}

/**
 * Announces one specific status and reveals placeholders only once a load is slow enough to notice.
 * Real content (headings, controls) belongs outside; children are hidden from assistive technology.
 */
export function SkeletonRegion({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return <div className="skeleton-region">
    <p role="status" className="sr-only">{label}</p>
    <div className="skeleton-content" aria-hidden="true">{children}</div>
  </div>;
}

/** Render outside `SkeletonRegion`: a known title stays a real, announced `<h1>`. */
export function PageHeaderSkeleton({ title }: Readonly<{ title?: string }>) {
  return <div className="page-heading">
    <div>
      <p className="section-label"><Skeleton width="9rem" /></p>
      {title ? <h1>{title}</h1> : <p className="skeleton-heading-title"><Skeleton width="min(18rem, 70%)" /></p>}
      <p><Skeleton width="min(24rem, 90%)" /></p>
    </div>
  </div>;
}

/** Mirrors `.course-grid` > `.course-card`, so real cards replace it without moving the grid. */
export function CardGridSkeleton({ count = 6 }: Readonly<{ count?: number }>) {
  return <div className="course-grid">{Array.from({ length: count }, (_, index) =>
    <div key={index} className="card course-card">
      <div className="course-card-meta"><Skeleton shape="block" width="40px" height="40px" /><Skeleton shape="pill" width="4.5rem" /></div>
      <p className="section-label"><Skeleton width="5rem" /></p>
      <p className="skeleton-card-title"><Skeleton width={index % 2 ? "62%" : "84%"} /></p>
      <p className="hint"><Skeleton width="70%" /></p>
      <div className="course-card-footer"><Skeleton width="6rem" /></div>
    </div>)}
  </div>;
}

/** Rows with a leading icon, two text lines and a status chip (modules, quizzes, assignments). */
export function ListSkeleton({ rows = 3 }: Readonly<{ rows?: number }>) {
  return <ul className="skeleton-list">{Array.from({ length: rows }, (_, index) =>
    <li key={index}>
      <Skeleton shape="block" width="40px" height="40px" />
      <span className="skeleton-list-copy"><Skeleton width={index % 2 ? "48%" : "64%"} /><Skeleton width="36%" /></span>
      <Skeleton shape="pill" width="4.5rem" />
    </li>)}
  </ul>;
}

/** Uses `.data-table`, so the placeholder keeps the real table's padding, borders and row height. */
export function TableSkeleton({ columns, rows = 5 }: Readonly<{ columns: number; rows?: number }>) {
  const cells = Array.from({ length: columns }, (_, index) => index);
  return <table className="data-table skeleton-table">
    <thead><tr>{cells.map(cell => <th key={cell}><Skeleton width="60%" /></th>)}</tr></thead>
    <tbody>{Array.from({ length: rows }, (_, row) => <tr key={row}>{cells.map(cell =>
      <td key={cell}><Skeleton width={(row + cell) % 3 ? "72%" : "48%"} /></td>)}</tr>)}</tbody>
  </table>;
}
