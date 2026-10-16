import { Injectable, SetMetadata, UnauthorizedException, ServiceUnavailableException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { DatabaseService } from "../database/database.service";

export const Public = () => SetMetadata("identity:public", true);
export interface IdentityRequest {
  headers: {authorization?: string};
  rawHeaders: string[];
  userId: string;
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly database: DatabaseService) {}
  async canActivate(context: ExecutionContext) {
    if (context.getHandler && Reflect.getMetadata("identity:public", context.getHandler())) return true;
    const request = context.switchToHttp().getRequest<IdentityRequest>();
    const header = request.headers.authorization;
    const count = request.rawHeaders.filter((_, index) => index % 2 === 0 && request.rawHeaders[index].toLowerCase() === "authorization").length;
    if (count > 1 || typeof header !== "string" || !/^Bearer [^\s,]+$/i.test(header) || Buffer.byteLength(header.slice(7)) > 4096) throw new UnauthorizedException();
    const {sub} = this.auth.verifyToken(header.slice(7));
    let active: boolean;
    try { active = (await this.database.pool.query("SELECT active FROM public.users WHERE id=$1", [sub])).rows[0]?.active === true; }
    catch { throw new ServiceUnavailableException(); }
    if (!active) throw new UnauthorizedException();
    request.userId = sub;
    return true;
  }
}
