import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownUrl } from '../../lib/content/markdown-policy.ts';

const components: Components = {
  h1: ({ children }) => <h2>{children}</h2>,
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h4>{children}</h4>,
  h4: ({ children }) => <h5>{children}</h5>,
  h5: ({ children }) => <h6>{children}</h6>,
  h6: ({ children }) => <h6>{children}</h6>,
  a: ({ href, children }) => {
    const safe = href ? markdownUrl(href) : undefined;
    return safe ? <a href={safe} {...(safe.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer', referrerPolicy: 'no-referrer' })}>{children}</a> : <span>{children}</span>;
  },
  // Do not spread props: src/srcSet must never reach the DOM or trigger a request.
  img: ({ alt }) => alt ? <span className="academic-image-alt">{alt}</span> : null,
  table: ({ children }) => <div className="academic-table-scroll" role="region" aria-label="Tabla del material" tabIndex={0}><table>{children}</table></div>,
  pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
};

/** HTML stays literal (no raw-HTML plugin); all resource URLs use one policy. */
export function AcademicMarkdown({ source }: Readonly<{ source: string }>) {
  return <div className="academic-markdown"><Markdown remarkPlugins={[remarkGfm]} components={components} urlTransform={url => markdownUrl(url)}>{source}</Markdown></div>;
}
