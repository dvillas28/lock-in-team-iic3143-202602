"use client";
import { ParticipantsPanel } from "./participants-panel.tsx";
import { SectionForm } from "./section-form.tsx";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { useState } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import type { Course, Section } from "../../lib/courses/validation.ts";
import { getSection } from "../../lib/api/sections.ts";
import { EmptyState, ErrorState, LoadingState } from "../route-states.tsx";
import { useResource } from "./use-resource.ts";
export function SectionsPanel({ session, slug, user, course, items, management, onSaved }: {
  session: Session;
  slug: string;
  user: CurrentUser;
  course: Course;
  items: Section[];
  management: boolean;
  onSaved: () => Promise<unknown>;
}) {
  const [selected, setSelected] = useState("");
  return <section className="card panel stack">
    <h2>Secciones autorizadas</h2>{!items.length ? <EmptyState /> : <ul className="stack">{items.map(s => <li key={s.id}>
      <span>Sección {s.code} · Capacidad: {s.capacity ?? "Sin límite"}</span>
      <p className="hint">{user.sectionMemberships.filter(m => m.courseId === course.id && m.sectionId === s.id).map(m => m.role).join(" · ") || "Sin rol académico"}</p>{management && <button className="btn btn-ghost" onClick={() => setSelected(s.id)}>Abrir sección {s.code}</button>}</li>)}</ul>}
    {management && capabilities(user, course).configure && <SectionForm session={session} slug={slug} courseId={course.id} onSaved={onSaved} />}
    {selected && <SelectedSection key={selected} session={session} slug={slug} courseId={course.id} sectionId={selected} user={user} course={course} onSaved={onSaved} />}
  </section>;
}
function SelectedSection({ session, slug, courseId, sectionId, user, course, onSaved }: {
  session: Session;
  slug: string;
  courseId: string;
  sectionId: string;
  user: CurrentUser;
  course: Course;
  onSaved: () => Promise<unknown>;
}) {
  const result = useResource(session, `${slug}:${courseId}:${sectionId}`, c => getSection(c, slug, sectionId, courseId));
  if (result.error)
    return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!result.data)
    return <LoadingState />;
  return <section>
    <h3>Sección {result.data.code}</h3>{capabilities(user, course).configure && <SectionForm key={result.data.code + result.data.capacity} session={session} slug={slug} courseId={courseId} section={result.data} onSaved={onSaved} />}<ParticipantsPanel session={session} slug={slug} user={user} course={course} section={result.data} />
  </section>;
}
