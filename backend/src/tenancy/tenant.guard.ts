import {Injectable,type CanActivate,type ExecutionContext} from "@nestjs/common";
import {slug} from "../courses/validation";
import type {TenantRequest} from "./tenant-context";
@Injectable()
export class TenantGuard implements CanActivate {
 canActivate(context:ExecutionContext) {
  const request=context.switchToHttp().getRequest<TenantRequest>();
  if(request.params?.institutionSlug!==undefined)request.tenant={actor:request.userId,slug:slug(request.params.institutionSlug)};
  return true;
 }
}
