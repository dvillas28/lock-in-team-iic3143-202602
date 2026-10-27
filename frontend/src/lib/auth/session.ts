import { createApiClient, type ApiClient } from "../api/client.ts";
import { ApiHttpError, ApiResponseError } from "../api/errors.ts";
import { getCurrentUser, listAccessibleInstitutions } from "../api/institutions.ts";
import { getRouteFeedback, type RouteFeedback } from "../route-feedback.ts";
import { isInstitutionSlug } from "../institution-routes.ts";
import { credentials, currentUser, institutionList, loginToken, type CurrentUser } from "./validation.ts";

export type SessionState = Readonly<{
  status: "anonymous" | "authenticating" | "authenticated";
  generation: number;
  message?: string;
  retryAt: number;
  institutions?: ReturnType<typeof institutionList>;
  directoryError?: RouteFeedback;
  contextWarning?: RouteFeedback;
  context?: { slug: string; user?: CurrentUser; error?: RouteFeedback };
}>;
type Options = { baseUrl?: string; fetch?: typeof globalThis.fetch; now?: () => number;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: typeof clearTimeout };
export class StaleSessionError extends Error {
  constructor() { super("La sesión cambió. Vuelve a intentarlo."); }
}

/** One instance per mounted browser provider. Never a module singleton or server session. */
export class Session {
  private state: SessionState = { status: "anonymous", generation: 0, retryAt: 0 };
  private readonly listeners = new Set<() => void>();
  private readonly controllers = new Set<AbortController>();
  private token?: string;
  private subject = "";
  private expiresAt = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private contextRequest = 0;
  private directoryRequest = 0;
  private contextFlight?: { slug: string; promise: Promise<void> };
  private readonly now: () => number;
  private readonly options: Options;
  constructor(options: Options = {}) { this.options = options; this.now = options.now ?? Date.now; }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(patch: Partial<SessionState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }
  logout = (message?: string) => {
    this.token = undefined; this.subject = ""; this.expiresAt = 0;
    this.contextRequest++; this.contextFlight = undefined;
    (this.options.cancel ?? clearTimeout)(this.timer);
    this.controllers.forEach(controller => controller.abort()); this.controllers.clear();
    this.state = { status: "anonymous", generation: this.state.generation + 1, retryAt: this.state.retryAt, message };
    this.listeners.forEach(listener => listener());
  };
  checkExpiry = () => {
    if (this.token && this.now() >= this.expiresAt) this.logout("Tu sesión venció. Inicia sesión nuevamente.");
  };
  private assertCurrent(generation: number) {
    this.checkExpiry();
    if (generation !== this.state.generation) throw new StaleSessionError();
  }
  private async perform<T>(generation: number, token: string | undefined, operation: (client: ApiClient) => Promise<T>, current: () => boolean = () => true, revalidateOnFailure = true): Promise<T> {
    const context = this.state.context;
    const controller = new AbortController(); this.controllers.add(controller);
    try {
      this.assertCurrent(generation);
      const client = createApiClient({ baseUrl: this.options.baseUrl, getToken: () => token,
        fetch: async input => {
          this.assertCurrent(generation);
          if (!current()) throw new StaleSessionError();
          const request = input instanceof Request ? input : new Request(input);
          if (!['GET', 'HEAD'].includes(request.method) && this.state.contextWarning) {
            throw new ApiHttpError(409, { code: 'ACCESS_REVALIDATION_REQUIRED' });
          }
          const response = await (this.options.fetch ?? globalThis.fetch)(new Request(request, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) }));
          this.assertCurrent(generation);
          if (!current()) throw new StaleSessionError();
          return response;
        } });
      const result = await operation(client);
      this.assertCurrent(generation);
      if (!current()) throw new StaleSessionError();
      return result;
    } catch (error) {
      this.assertCurrent(generation);
      if (!current()) throw new StaleSessionError();
      if (token && error instanceof ApiHttpError && error.status === 401) this.logout("Tu sesión ya no es válida. Inicia sesión nuevamente.");
      if (revalidateOnFailure && token && context?.user && this.state.context === context && error instanceof ApiHttpError && [403, 404].includes(error.status)) void this.loadContext(context.slug);
      throw error;
    } finally { this.controllers.delete(controller); }
  }
  /** All private consumers use this boundary; old completions/401s cannot affect a new identity. */
  request = async <T>(operation: (client: ApiClient) => Promise<T>, current?: () => boolean): Promise<T> => {
    this.checkExpiry();
    if (this.state.status !== "authenticated" || !this.token) throw new StaleSessionError();
    return this.perform(this.state.generation, this.token, operation, current);
  };
  login = async (email: string, password: string): Promise<boolean> => {
    if (this.state.status === "authenticating" || this.now() < this.state.retryAt) return false;
    let body;
    try { body = credentials(email, password); }
    catch (error) { this.update({ message: (error as Error).message }); return false; }
    this.logout();
    const generation = this.state.generation;
    const startedAt = this.now();
    this.update({ status: "authenticating", message: undefined });
    try {
      const result = await this.perform(generation, undefined, client => client.POST("/api/v1/auth/login", { body }));
      const token = loginToken(result.data, this.now());
      this.token = token.token; this.subject = token.subject; this.expiresAt = Math.min(token.expiresAt, startedAt + 900_000);
      this.checkExpiry(); this.assertCurrent(generation);
      // Confirm backend acceptance before rendering any authenticated UI.
      const list = await this.perform(generation, this.token, client => listAccessibleInstitutions(client));
      const institutions = institutionList(list.data);
      this.update({ status: "authenticated", institutions, retryAt: 0 });
      this.timer = (this.options.schedule ?? setTimeout)(this.checkExpiry, Math.max(0, this.expiresAt - this.now()));
      return true;
    } catch (error) {
      if (generation !== this.state.generation) return false;
      this.logout();
      const retryAt = error instanceof ApiHttpError && error.status === 429
        ? this.now() + (error.retryAfterMs ?? 60_000) : 0;
      this.update({ retryAt, message: loginMessage(error) });
      return false;
    }
  };
  loadInstitutions = async () => {
    const generation = this.state.generation, sequence = ++this.directoryRequest;
    this.update({ institutions: undefined, directoryError: undefined });
    try {
      const result = await this.request(client => listAccessibleInstitutions(client));
      if (sequence === this.directoryRequest) this.update({ institutions: institutionList(result.data) });
    } catch (error) {
      if (generation === this.state.generation && sequence === this.directoryRequest) this.update({ directoryError: getRouteFeedback(error) });
    }
  };
  /** Revalidate without replacing an unchanged authorization scope or losing local work. */
  loadContext = (slug: string): Promise<void> => {
    this.checkExpiry();
    if (this.state.status !== "authenticated" || !this.token) return Promise.resolve();
    if (this.contextFlight?.slug === slug) return this.contextFlight.promise;
    const generation = this.state.generation, sequence = ++this.contextRequest;
    const previous = this.state.context?.slug === slug ? this.state.context : undefined;
    if (!previous?.user) this.update({ context: { slug }, contextWarning: undefined });
    const work = async () => {
      try {
        if (!isInstitutionSlug(slug)) throw new ApiHttpError(400);
        const result = await this.perform(generation, this.token, client => getCurrentUser(client, slug),
          () => sequence === this.contextRequest, false);
        if (generation !== this.state.generation || sequence !== this.contextRequest) return;
        const user = currentUser(result.data, slug, this.subject);
        // Keep object identity: mounted drafts and in-flight operations use this boundary.
        const unchanged = previous?.user && JSON.stringify(previous.user) === JSON.stringify(user);
        this.update({ context: unchanged ? previous : { slug, user }, contextWarning: undefined });
      } catch (error) {
        if (generation !== this.state.generation || sequence !== this.contextRequest) return;
        const feedback = getRouteFeedback(error);
        if (previous?.user && !(error instanceof ApiHttpError && error.status < 500) && !(error instanceof TypeError) && !(error instanceof ApiResponseError)) {
          this.update({ contextWarning: feedback });
        } else {
          this.update({ context: { slug, error: feedback }, contextWarning: undefined });
        }
      }
    };
    const promise = work().finally(() => {
      if (this.contextFlight?.promise === promise) this.contextFlight = undefined;
    });
    this.contextFlight = { slug, promise };
    return promise;
  };
  clearContext = () => {
    this.contextRequest++; this.contextFlight = undefined;
    this.update({ context: undefined, contextWarning: undefined });
  };
}

function loginMessage(error: unknown): string {
  if (error instanceof ApiHttpError) {
    if (error.status === 401) return "Correo o contraseña incorrectos, o cuenta no disponible.";
    if ([400, 413, 415].includes(error.status)) return "No se pudo iniciar sesión. Revisa el correo y la contraseña.";
    if (error.status === 429) return "Demasiados intentos. Espera antes de volver a intentar.";
  }
  return "No se pudo iniciar sesión. Verifica tu conexión e inténtalo nuevamente.";
}
