import type { RouteFeedback } from '../../lib/route-feedback.ts';
export function ResourceFeedback({error, retry}: Readonly<{error: RouteFeedback; retry: () => void}>) {
  return <div className="notice resource-feedback" role="alert"><div><strong>{error.title}</strong><p>{error.message}</p></div><button className="btn btn-ghost" type="button" onClick={retry}>Reintentar</button></div>;
}
export function AcademicDate({value}: Readonly<{value: string}>) {
  return <time dateTime={value} title={value}>{new Date(value).toLocaleString('es-CL', {dateStyle:'medium', timeStyle:'short'})}</time>;
}
export function shortId(value: string) { return `${value.slice(0,8)}…`; }
