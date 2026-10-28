"use client";

import { useState } from "react";
import { BookOpen, ChartColumn, CheckCheck, ClipboardList, GraduationCap, Moon, ShieldCheck, Sun, Users } from "lucide-react";
import type { PublicInstitution } from "../../lib/auth/public-entry.ts";

const features = [
  { icon: BookOpen, title: "Material de tus cursos", text: "Consulta las lecturas y los recursos que tus docentes comparten, organizados por curso y módulo." },
  { icon: ClipboardList, title: "Evaluaciones en línea", text: "Responde las evaluaciones de tu curso. Si guardaste una sin terminar, puedes retomarla mientras siga disponible." },
  { icon: CheckCheck, title: "Corrección automática", text: "Las respuestas se corrigen al enviar tu evaluación. Podrás ver tu nota cuando tu docente la publique." },
  { icon: ChartColumn, title: "Tus notas, al día", text: "Revisa las notas que publica tu docente, cuánto pesa cada evaluación y tu promedio parcial.", accent: true },
  { icon: Users, title: "Para aprender y enseñar", text: "Como estudiante, consulta tus cursos. Como docente o ayudante, acompaña el trabajo de tu sección." },
  { icon: ShieldCheck, title: "Tu universidad en AcademiX", text: "Entra al espacio de tu universidad para encontrar tus cursos y trabajar con tu comunidad." },
];

function Brand() {
  return <span className="landing-brand"><span className="logo-icon"><GraduationCap size={20} aria-hidden="true" /></span><span className="logo-name">AcademiX</span></span>;
}

export function PublicLanding({ institutions }: Readonly<{ institutions: PublicInstitution[] }>) {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark");
  function toggleTheme() {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDark(next);
  }
  return <div className="landing">
    <a className="btn btn-primary skip-link" href="#main-content">Saltar al contenido</a>
    <header className="landing-header">
      <nav className="landing-width landing-nav" aria-label="Navegación principal">
        <a className="landing-brand-link" href="#main-content" aria-label="AcademiX, inicio"><Brand /></a>
        <div className="landing-nav-actions">
          <a className="landing-features-link" href="#funciones">Qué puedes hacer</a>
          <button className="icon-btn" type="button" aria-label="Cambiar tema" aria-pressed={dark} onClick={toggleTheme}>
            {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <a className="btn btn-primary" href="#instituciones">Iniciar sesión</a>
        </div>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <section className="landing-width landing-hero" aria-labelledby="landing-title">
        <p className="section-label">Tu espacio para aprender y enseñar</p>
        <h1 id="landing-title" className="serif">Tus cursos, materiales<br /> <em>y notas, en un solo lugar.</em></h1>
        <p className="landing-intro">Encuentra el material de tus clases, responde evaluaciones y consulta tus notas. AcademiX te acompaña durante el semestre para que puedas concentrarte en aprender y enseñar.</p>
        <div className="landing-hero-actions">
          <a className="btn btn-primary" href="#instituciones">Elegir mi universidad</a>
          <a className="btn btn-ghost" href="#funciones">Conoce AcademiX</a>
        </div>
        <ol className="landing-flow" aria-label="De tus cursos a tus notas">
          {["Tus cursos", "Material de estudio", "Evaluaciones", "Tus notas"].map((step, index) => <li key={step}>
            <span className="tnum">0{index + 1}</span>{step}
          </li>)}
        </ol>
      </section>
      <section id="funciones" className="landing-section" aria-labelledby="features-title">
        <div className="landing-width">
          <div className="landing-section-heading"><p className="section-label">Durante todo el semestre</p><h2 id="features-title" className="serif">Lo que necesitas para tus cursos</h2><p>Material de estudio, evaluaciones y notas para acompañar tus clases.</p></div>
          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, title, text, accent }) => <article className="card landing-feature" key={title}>
              <div className={`landing-icon${accent ? " landing-icon-accent" : ""}`}><Icon size={20} aria-hidden="true" /></div>
              <h3 className="serif">{title}</h3><p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>
      <section id="instituciones" className="landing-section landing-directory" aria-labelledby="institutions-title">
        <div className="landing-width">
          <div className="landing-section-heading"><p className="section-label">Inicia sesión</p><h2 id="institutions-title" className="serif">Elige tu universidad</h2><p>Continúa para iniciar sesión y ver tus cursos.</p></div>
          <div className="landing-institution-grid">
            {institutions.map(institution => <a className="card card-hover landing-institution" href={institution.href} key={institution.slug}>
              <span className="landing-institution-initials serif">{institution.shortName}</span>
              <h3 className="serif">{institution.name}</h3>
              <span className="btn btn-ghost landing-institution-action">Ingresar a {institution.shortName}</span>
            </a>)}
          </div>
          <p className="landing-directory-note"><ShieldCheck size={18} aria-hidden="true" />Para entrar, necesitas una cuenta con acceso a la universidad que elijas.</p>
        </div>
      </section>
    </main>
    <footer className="landing-footer"><div className="landing-width"><Brand /><p>AcademiX · Enseñar y aprender, en un mismo lugar.</p><a href="#instituciones">Elegir universidad</a></div></footer>
  </div>;
}
