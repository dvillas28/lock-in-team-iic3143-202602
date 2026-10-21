"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { loginDestination } from "../../lib/auth/navigation.ts";
import { useSession } from "./session-provider.tsx";

export function LoginForm() {
  const { session, state, hostname } = useSession();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [now, setNow] = useState(Date.now);
  const destination = hostname ? loginDestination(hostname, typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next")) : undefined;
  useEffect(() => {
    if (state.status === "authenticated" && destination) router.replace(destination);
  }, [state.status, destination, router]);
  useEffect(() => {
    if (!state.retryAt) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state.retryAt]);
  const busy = state.status === "authenticating";
  const waiting = state.retryAt > now && state.retryAt > 0;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const attempt = session.login(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
    // Password is not retained in React state or in the form after submission.
    const password = form.elements.namedItem("password");
    if (password instanceof HTMLInputElement) password.value = "";
    await attempt;
  }
  return (
    <main className="content auth-content">
      <div className="sidebar-logo"><GraduationCap aria-hidden="true" /><span className="logo-name">AcademiX</span></div>
      <section className="card panel stack auth-panel" aria-labelledby="login-title">
        <div><h1 id="login-title" className="serif">Iniciar sesión</h1><p className="hint">Una identidad, tus instituciones accesibles.</p></div>
        {hostname && !destination ? <p role="alert">Este dominio no está habilitado para AcademiX.</p> : (
          <form className="stack" onSubmit={submit} aria-busy={busy} noValidate>
            <div><label className="field-label" htmlFor="email">Correo electrónico</label>
              <input className="field" id="email" name="email" type="email" autoComplete="username" required maxLength={256} disabled={busy} aria-describedby="login-message" /></div>
            <div><label className="field-label" htmlFor="password">Contraseña</label>
              <div className="auth-password"><input className="field" id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required disabled={busy} aria-describedby="login-message" />
                <button type="button" className="icon-btn" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button></div></div>
            <div id="login-message" role="status" aria-live="polite">{busy ? "Verificando acceso…" : state.message}{waiting && <p>Podrás reintentar en <span className="tnum">{Math.max(1, Math.ceil((state.retryAt - now) / 1000))}</span> segundos.</p>}</div>
            <button className="btn btn-primary" type="submit" disabled={busy || waiting || !destination}>{busy ? "Ingresando…" : "Continuar"}</button>
          </form>
        )}
        <p className="hint">Al recargar o cerrar esta página deberás ingresar nuevamente.</p>
      </section>
    </main>
  );
}
