import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException, type OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, verify, argon2id } from "argon2";
import { randomBytes } from "node:crypto";
import { DatabaseService } from "../database/database.service";

const issuer = "academix-api", audience = "academix-clients";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly secret: Buffer;
  private dummy: string;
  constructor(private readonly database: DatabaseService, private readonly jwt: JwtService) {
    const encoded = process.env.AUTH_JWT_SECRET ?? "";
    const decoded = Buffer.from(encoded, "base64");
    if (decoded.length < 32 || decoded.toString("base64") !== encoded) throw new Error("Invalid authentication configuration");
    this.secret = decoded;
  }
  async onModuleInit() {
    this.dummy = await hash(randomBytes(32), {type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1});
  }
  async login(body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new BadRequestException({field: "body"});
    const dto = body as Record<string, unknown>;
    if (Object.keys(dto).length !== 2 || typeof dto.email !== "string" || typeof dto.password !== "string") throw new BadRequestException({field: "body"});
    const email = dto.email.trim();
    if (email.length < 3 || email.length > 254 || !/^[\x21-\x7e]+$/.test(email) ||
        !/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(email)) throw new BadRequestException({field: "email"});
    if (!dto.password.length || Buffer.byteLength(dto.password, "utf8") > 128) throw new BadRequestException({field: "password"});
    let user: {id: string; password_hash: string; active: boolean} | undefined;
    let valid: boolean;
    try {
      const result = await this.database.withIdentity(null,db=>db.query("SELECT id,password_hash,active FROM public.users WHERE lower(btrim(email))=$1", [email.toLowerCase()]));
      user = result.rows[0];
      valid = await verify(user?.password_hash ?? this.dummy, dto.password);
    } catch { throw new ServiceUnavailableException(); }
    if (!user?.active || !valid) throw new UnauthorizedException();
    return {accessToken: this.jwt.sign({sub: user.id}, {secret: this.secret, algorithm: "HS256", issuer, audience, expiresIn: 900}), tokenType: "Bearer", expiresIn: 900};
  }
  verifyToken(token: string) {
    try {
      const claims = this.jwt.verify<{sub: string; iat: number; exp: number; iss: string; aud: string}>(token,
        {secret: this.secret, algorithms: ["HS256"], issuer, audience});
      const now = Math.floor(Date.now() / 1000);
      if (typeof claims.sub !== "string" || !uuid.test(claims.sub) || claims.iss !== issuer || claims.aud !== audience ||
          !Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) || claims.iat > now || claims.exp <= now || claims.exp - claims.iat !== 900) throw new Error();
      return claims;
    } catch { throw new UnauthorizedException(); }
  }
}
