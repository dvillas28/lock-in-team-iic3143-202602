import { AccountValidationError } from '../../lib/accounts/validation.ts';
import { ApiHttpError } from '../../lib/api/errors.ts';
import { getRouteFeedback } from '../../lib/route-feedback.ts';
export function accountMessage(error:unknown):string {
 if(error instanceof AccountValidationError)return error.message;
 if(error instanceof ApiHttpError){
  if(error.problem.code==='INTEGRATION_NOT_CONFIGURED')return 'Esta función está temporalmente no disponible. Tus datos permanecen guardados.';
  if(error.status===400||error.status===422)return 'Revisa los campos y sus límites. La operación fue rechazada.';
  if(error.status===409)return 'El estado cambió. Consulta los datos actuales antes de volver a intentar.';
  if(error.status===410)return 'Este enlace o registro ya no puede utilizarse. Solicita una nueva invitación.';
  if(error.status===429)return 'Espera antes de volver a intentar. Se alcanzó el límite de solicitudes.';
 }
 return getRouteFeedback(error).message;
}
