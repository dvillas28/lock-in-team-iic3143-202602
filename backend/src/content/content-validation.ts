import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { uuid } from "../courses/validation";
export {object} from "../courses/validation";
export function title(value: unknown) {
 if(typeof value!=="string")throw new BadRequestException();
 const text=value.trim();
 if(!text || [...text].length>200 || text.includes("\0"))throw new UnprocessableEntityException();
 return text;
}
export function markdown(value: unknown) {
 if(typeof value!=="string")throw new BadRequestException();
 if(!value.trim() || [...value].length>10000 || value.includes("\0"))throw new UnprocessableEntityException();
 return value;
}
export function position(value: unknown) {
 if(typeof value!=="number")throw new BadRequestException();
 if(!Number.isInteger(value) || value<1 || value>2147483647)throw new UnprocessableEntityException();
 return value;
}
export function order(value: unknown) {
 if(!Array.isArray(value))throw new BadRequestException();
 const ids=value.map(uuid);
 if(new Set(ids).size!==ids.length)throw new UnprocessableEntityException();
 return ids;
}
export function noBody(value: unknown) {if(value!==undefined)throw new BadRequestException();}
