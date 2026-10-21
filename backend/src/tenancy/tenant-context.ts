import type {IdentityRequest} from "../auth/auth.guard";
export interface TenantRequest extends IdentityRequest {params:{institutionSlug?:string};tenant?:{actor:string;slug:string}}
