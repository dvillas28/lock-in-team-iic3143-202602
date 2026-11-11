"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";
import { useSkeletonDelay } from "../use-skeleton-delay.ts";

type Reader = "material" | "file";
const labels: Readonly<Record<Reader, string>> = { material: "Cargando material…", file: "Cargando archivo…" };
const paragraphs = [["100%", "96%", "98%", "62%"], ["100%", "94%", "71%"]];

/** The real return link: course and module come from the route, so it never waits for data. */
export function ReaderReturn({ courseId, moduleId, parent }: Readonly<{ courseId: string; moduleId: string; parent?: string }>) {
  return <Link className="reader-return" href={`/courses/${courseId}/modules#module-${moduleId}`}>
    <ArrowLeft size={16} aria-hidden="true" />Volver a módulos{parent && ` · ${parent}`}
  </Link>;
}

/** Paragraph lines on the themed `.reader-paper` card, at the reading text's line height. */
function TextLines() {
  return <div className="reader-skeleton-text">{paragraphs.map((lines, index) =>
    <p key={index}>{lines.map((width, line) => <Skeleton key={line} width={width} />)}</p>)}
  </div>;
}

/** A page of the fixed-paper PDF sheet: title, paragraphs and a code block, as in mockup 09. */
function SheetLines() {
  return <>
    <Skeleton shape="block" width="48%" height="18px" />
    {paragraphs.map((lines, index) => <div key={index} className="pdf-sheet-paragraph">
      {lines.map((width, line) => <Skeleton key={line} shape="block" width={width} height="9px" />)}
    </div>)}
    <div className="pdf-sheet-code">{["55%", "70%", "48%"].map(width => <Skeleton key={width} shape="block" width={width} height="9px" />)}</div>
  </>;
}

/**
 * Header and page of a material or file reader whose metadata is still loading. The reader keeps
 * its real `<article>` and return link around it; title, module and status are placeholders, and
 * actions (download) arrive with the data instead of being drawn.
 */
export function DocumentSkeleton({ reader }: Readonly<{ reader: Reader }>) {
  const heading = <div className="reader-heading">
    <p className="section-label"><Skeleton width="10rem" /></p>
    <p className="skeleton-heading-title"><Skeleton width="min(24rem, 80%)" /></p>
    {reader === "file" ? <p className="file-reader-meta"><Skeleton width="9rem" /></p> : <Skeleton shape="pill" width="5.5rem" />}
  </div>;
  return <div className="reader-skeleton" ref={useSkeletonDelay<HTMLDivElement>()}>
    <SkeletonRegion label={labels[reader]}>
      <div className="stack content-skeleton">
        {reader === "file" ? <div className="file-reader-heading">{heading}</div> : heading}
        <div className="card reader-paper"><TextLines /></div>
      </div>
    </SkeletonRegion>
  </div>;
}

/** Route fallback of `materials/[materialId]` and `files/[fileId]`: the same article the reader renders. */
export function ReaderRouteLoading({ reader }: Readonly<{ reader: Reader }>) {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  return <article className={reader === "file" ? "material-reader academic-file-reader stack" : "material-reader stack"}>
    <ReaderReturn courseId={courseId} moduleId={moduleId} />
    <DocumentSkeleton reader={reader} />
  </article>;
}

type Preview = "pdf" | "image" | "text";

/**
 * A file preview still downloading (or decoding) inside the rendered reader. Each format keeps
 * the geometry of its viewer: the PDF card with its toolbar strip and paper sheet, a reserved image
 * frame, or a text page. `label` names the phase, so consecutive phases are not announced twice.
 */
export function PreviewSkeleton({ preview, label }: Readonly<{ preview: Preview; label: string }>) {
  return <div ref={useSkeletonDelay<HTMLDivElement>()}>
    <SkeletonRegion label={label}>
      <div className="content-skeleton">
        {preview === "pdf" ? <div className="card pdf-preview">
          <div className="pdf-toolbar pdf-toolbar-skeleton"><Skeleton width="7.5rem" /><Skeleton width="3rem" /></div>
          <div className="pdf-viewport"><div className="pdf-sheet pdf-sheet-lines"><SheetLines /></div></div>
        </div> : preview === "image" ? <div className="card image-preview">
          <div className="image-preview-skeleton"><Skeleton shape="block" width="100%" height="100%" /></div>
        </div> : <div className="card reader-paper"><TextLines /></div>}
      </div>
    </SkeletonRegion>
  </div>;
}

/**
 * Lines on a PDF sheet while its page renders. The viewer's own «Cargando página…» status stays
 * the announcement, so these are hidden; the reveal continues a preview skeleton it replaces.
 */
export function PdfSheetSkeleton() {
  return <div className="pdf-sheet-lines pdf-sheet-skeleton" aria-hidden="true" ref={useSkeletonDelay<HTMLDivElement>()}><SheetLines /></div>;
}
