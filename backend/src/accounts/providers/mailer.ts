import { ServiceUnavailableException } from "@nestjs/common";
import { Resend } from "resend";
import { randomUUID } from "node:crypto";
import { activationOrigins, configuredMailFrom } from "./config";

export interface InvitationMessage {to: string; subject: string; html: string; text: string}
export interface InvitationMailer {
  readonly available: boolean;
  send(message: InvitationMessage, key: string): Promise<{id: string}>;
}
export class MailDeliveryError extends Error {
  constructor(readonly status: "failed" | "quota_blocked" | "unknown", readonly code: string, readonly retryAfterSeconds?: number) {
    super(code); this.name = "MailDeliveryError";
  }
}
export interface MailResponse {
  data?: {id?: string} | null;
  error?: {name?: string; statusCode?: number | null} | null;
  headers?: Record<string, string> | null;
}
export type MailTransport = (message: InvitationMessage, key: string, signal: AbortSignal) => Promise<MailResponse>;
export interface MailOptions {
  transport?: MailTransport;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  budgetMs?: number;
}

export class DisabledInvitationMailer implements InvitationMailer {
  readonly available = false;
  async send(): Promise<{id: string}> { throw new ServiceUnavailableException({code: "INTEGRATION_NOT_CONFIGURED"}); }
}

/** Injectable only in tests; never logs or exposes captured links through HTTP. */
export class FakeInvitationMailer implements InvitationMailer {
  readonly available = true;
  readonly messages: (InvitationMessage & {key: string; id: string})[] = [];
  constructor(env: NodeJS.ProcessEnv = process.env) {
    if (env.NODE_ENV !== "test") throw new Error("Fake mail is restricted to tests");
  }
  async send(message: InvitationMessage, key: string) {
    const previous = this.messages.find(entry => entry.key === key);
    if (previous) {
      if (["to", "subject", "html", "text"].some(name => previous[name as keyof InvitationMessage] !== message[name as keyof InvitationMessage])) {
        throw new MailDeliveryError("failed", "MAIL_IDEMPOTENCY_CONFLICT");
      }
      return {id: previous.id};
    }
    const id = randomUUID();
    this.messages.push({...message, key, id});
    return {id};
  }
}

function retryDelay(headers: MailResponse["headers"], now: number) {
  const value = headers && Object.entries(headers).find(([key]) => key.toLowerCase() === "retry-after")?.[1];
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

export class ResendInvitationMailer implements InvitationMailer {
  readonly available = true;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly budget: number;
  constructor(private readonly transport: MailTransport, options: MailOptions = {}) {
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
    this.budget = Math.min(8_000, Math.max(1, options.budgetMs ?? 8_000));
  }
  private async attempt(message: InvitationMessage, key: string, milliseconds: number) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        this.transport(message, key, controller.signal),
        new Promise<never>((_, reject) => { timer = setTimeout(() => {controller.abort(); reject(new Error("timeout"));}, milliseconds); }),
      ]);
    } finally { clearTimeout(timer); }
  }
  async send(message: InvitationMessage, key: string) {
    const started = this.now();
    const payload = Object.freeze({...message});
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = this.budget - (this.now() - started);
      if (remaining <= 0) throw new MailDeliveryError("unknown", "MAIL_PROVIDER_UNCERTAIN");
      let result: MailResponse;
      try { result = await this.attempt(payload, key, remaining); }
      catch {
        if (attempt === 0 && this.now() - started < this.budget) continue;
        throw new MailDeliveryError("unknown", "MAIL_PROVIDER_UNCERTAIN");
      }
      if (result.data?.id && !result.error) return {id: result.data.id};
      const name = result.error?.name;
      const status = result.error?.statusCode;
      const delay = retryDelay(result.headers, this.now());
      const retrySeconds = delay > 0 ? Math.ceil(delay / 1000) : undefined;
      if (name === "daily_quota_exceeded" || name === "monthly_quota_exceeded") {
        throw new MailDeliveryError("quota_blocked", "MAIL_QUOTA_EXCEEDED", retrySeconds);
      }
      const rate = name === "rate_limit_exceeded" || status === 429;
      const uncertain = status == null || status >= 500;
      if (rate || uncertain) {
        if (attempt === 0 && delay < this.budget - (this.now() - started)) {
          if (delay) await this.sleep(delay);
          continue;
        }
        throw new MailDeliveryError(rate ? "failed" : "unknown", rate ? "MAIL_RATE_LIMITED" : "MAIL_PROVIDER_UNCERTAIN", retrySeconds);
      }
      throw new MailDeliveryError("failed", "MAIL_PROVIDER_REJECTED");
    }
    throw new MailDeliveryError("unknown", "MAIL_PROVIDER_UNCERTAIN");
  }
}

export function createInvitationMailer(env: NodeJS.ProcessEnv = process.env, options: MailOptions = {}): InvitationMailer {
  const mode = env.MAIL_DELIVERY_MODE ?? "disabled";
  if (mode === "fake" && env.NODE_ENV === "test") return new FakeInvitationMailer(env);
  const origins = activationOrigins(env);
  if (mode !== "resend" || !env.RESEND_API_KEY || !configuredMailFrom(env.MAIL_FROM) ||
      !origins.has("uc") || !origins.has("utfsm") || env.RESEND_DEBUG === "true" || process.env.RESEND_DEBUG === "true") {
    return new DisabledInvitationMailer();
  }
  // Pin the official API: SDK debug/base-url environment overrides must not leak message data.
  const resend = options.transport ? undefined : new Resend(env.RESEND_API_KEY, {baseUrl: "https://api.resend.com"});
  const transport: MailTransport = options.transport ?? ((message, key, signal) =>
    resend!.emails.send({...message, from: env.MAIL_FROM!}, {idempotencyKey: key, signal}));
  return new ResendInvitationMailer(transport, options);
}
