import {test,expect} from '../fixtures/test.ts';
import {Api,status} from '../helpers/api.ts';
import {origin,apiBase} from '../runner/settings.ts';
import {loaded,stopTrace} from '../helpers/browser.ts';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import type {Environment} from '../fixtures/environment.ts';
import type {Page} from '@playwright/test';
const ownProfile=async(api:Api)=>status(await api.request('/api/v1/me'),200).body;
async function profilePage(page:Page){await page.getByRole('link',{name:'Mi perfil',exact:true}).click();await expect(page.getByRole('heading',{name:'Mi perfil',exact:true})).toBeVisible();}
async function emitted(e:Environment,email:string){
 const admin=await e.api('AO');const invite=status(await admin.post('invitations',{name:'Persona invitada',email},randomUUID()),201).body;
 const token=randomBytes(32).toString('base64url');
 await e.pool.query(`UPDATE account_invitations SET token_hash=$1,expires_at=clock_timestamp()+interval '24 hours',delivery_version=1,delivery_status='accepted',delivery_key=$2,delivery_started_at=clock_timestamp(),last_delivery_at=clock_timestamp() WHERE id=$3`,[createHash('sha256').update(token).digest('hex'),randomUUID(),invite.id]);
 return {invite,token};
}
test('E2E-ACCOUNT-001 profile edits preserve global identity / profile-own @regression',async({e,actorPage})=>{
 const page=await actorPage('ST1');await page.getByRole('button',{name:'Cambiar tema',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.setViewportSize({width:375,height:812});
 const menu=page.getByRole('button',{name:'Abrir navegación',exact:true});if(await menu.isVisible())await menu.click();
 await profilePage(page);await page.getByLabel('Nombre visible',{exact:true}).fill('Nombre global actualizado');await page.getByLabel('Descripción',{exact:true}).fill('Descripción personal de prueba');await expect(page.getByLabel('Elegir una foto',{exact:true})).toBeDisabled();
 const saved=page.waitForResponse(r=>r.url().endsWith('/api/v1/me')&&r.request().method()==='PATCH');await page.getByRole('button',{name:'Guardar perfil',exact:true}).focus();await page.keyboard.press('Enter');expect((await saved).status()).toBe(200);
 await expect(page.getByText('Perfil actualizado.',{exact:true})).toBeVisible();await expect(page.getByLabel('Elegir una foto',{exact:true})).toBeEnabled();
 const row=(await e.pool.query('SELECT name,bio FROM users WHERE id=$1',[e.data.actors.ST1.id])).rows[0];expect(row).toEqual({name:'Nombre global actualizado',bio:'Descripción personal de prueba'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);
});
test('E2E-ACCOUNT-001 profile works without any institution / without-membership @regression',async({e,page})=>{
 await page.goto(origin()+'/login?next=%2Fprofile');await page.getByLabel('Correo electrónico',{exact:true}).fill(e.data.actors.NONE.email);await page.getByLabel('Contraseña',{exact:true}).fill(e.password);await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.getByRole('heading',{name:'Mi perfil',exact:true})).toBeVisible();
 await page.getByLabel('Descripción',{exact:true}).fill('Cuenta sin institución');await page.getByRole('button',{name:'Guardar perfil',exact:true}).click();await expect(page.getByText('Perfil actualizado.',{exact:true})).toBeVisible();
 expect((await e.pool.query('SELECT count(*)::integer n FROM institution_memberships WHERE user_id=$1',[e.data.actors.NONE.id])).rows[0].n).toBe(0);
});
test('E2E-ACCOUNT-002 password revokes previous sessions / password-revocation @regression',async({e,actorPage})=>{
 const page=await actorPage('ST1');const token=e.tokens.get('ST1')!;await profilePage(page);await page.getByRole('link',{name:'Seguridad',exact:true}).click();await stopTrace(page.context());
 const password='Changed-'+randomBytes(12).toString('hex');await page.getByLabel('Contraseña actual',{exact:true}).fill(e.password);await page.getByLabel('Nueva contraseña',{exact:true}).fill(password);await page.getByLabel('Repetir nueva contraseña',{exact:true}).fill(password);
 const changed=page.waitForResponse(r=>r.url().endsWith('/me/password'));await page.getByRole('button',{name:'Actualizar contraseña',exact:true}).click();expect((await changed).status()).toBe(204);await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
 status(await new Api(token).request('/api/v1/me'),401);status(await new Api(token).get('courses'),401);
 status(await new Api().request('/api/v1/auth/login','POST',{email:e.data.actors.ST1.email,password:e.password}),401);
 status(await new Api().request('/api/v1/auth/login','POST',{email:e.data.actors.ST1.email,password}),200);
});
test('E2E-ACCOUNT-003 institutional admin creates pending invitations / invitations @regression',async({e,actorPage})=>{
 const page=await actorPage('AO');await page.getByRole('link',{name:'Usuarios institucionales',exact:true}).click();await expect(page.getByRole('heading',{name:'Usuarios institucionales',exact:true})).toBeVisible();
 const email='new-'+e.namespace+'@example.test';await page.getByLabel('Nombre visible',{exact:true}).fill('Persona nueva');await page.getByLabel('Correo electrónico',{exact:true}).fill(email);const created=page.waitForResponse(r=>r.url().endsWith('/invitations')&&r.request().method()==='POST');await page.getByRole('button',{name:'Registrar invitación',exact:true}).click();expect((await created).status()).toBe(201);
 await expect(page.getByRole('table',{name:'Invitaciones de esta institución',exact:true})).toContainText(email);await expect(page.getByRole('button',{name:'Enviar invitación',exact:true})).toBeDisabled();
 expect((await e.pool.query('SELECT count(*)::integer n FROM users WHERE email=$1',[email])).rows[0].n).toBe(0);
 const ordinary=await e.api('ST1');status(await ordinary.post('invitations',{name:'No permitido',email:'no@example.test'},randomUUID()),403);
 const admin=await e.api('AO');status(await new Api(admin.token,'utfsm').get('invitations'),404);
 const superadmin=await e.api('SA');status(await superadmin.post('invitations',{name:'Alta superadmin',email:'sa-'+e.namespace+'@example.test'},randomUUID()),201);
});
test('E2E-ACCOUNT-004 CSV validates then confirms atomically / csv-atomic @regression',async({e,actorPage})=>{
 const page=await actorPage('AO');
 await page.getByRole('link',{name:'Usuarios institucionales',exact:true}).click();
 const file=page.getByLabel('Archivo CSV',{exact:true});
 await expect(file).toBeEnabled();
 await loaded(page);
 await file.setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from('name,email\nAna,invalid\n')});
 await page.getByRole('button',{name:'Validar archivo',exact:true}).click();
 await expect(page.getByRole('cell',{name:'Correo inválido',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Confirmar importación',exact:true})).toBeDisabled();
 const emails=['csv-a-'+e.namespace+'@example.test','csv-b-'+e.namespace+'@example.test'];await page.getByLabel('Archivo CSV',{exact:true}).setInputFiles({name:'valid.csv',mimeType:'text/csv',buffer:Buffer.from('name,email\nAna,'+emails[0]+'\nDiego,'+emails[1]+'\n')});await page.getByRole('button',{name:'Validar archivo',exact:true}).click();await expect(page.getByRole('button',{name:'Confirmar importación',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Confirmar importación',exact:true}).click();const confirmed=page.waitForResponse(r=>r.url().includes('/user-imports/')&&r.url().endsWith('/confirm'));await page.getByRole('button',{name:'¿Confirmar estas altas pendientes?',exact:true}).click();const response=await confirmed;expect(response.status()).toBe(200);
 await expect(page.getByRole('button',{name:'Continuar envíos pendientes',exact:true})).toBeDisabled();expect((await e.pool.query('SELECT count(*)::integer n FROM account_invitations WHERE normalized_email=ANY($1::text[])',[emails])).rows[0].n).toBe(2);
 const receipt=await response.json();expect(receipt.createdCount).toBe(2);const api=await e.api('AO');expect(status(await api.post('user-imports/'+receipt.id+'/confirm',{}),200).body.id).toBe(receipt.id);
});
test('E2E-ACCOUNT-005 new account activates only after confirmation / activate-new @regression',async({e,page})=>{
 const email='activate-'+e.namespace+'@example.test';const {invite,token}=await emitted(e,email);await page.goto(origin()+'/activate#token='+token);await expect(page.getByRole('heading',{name:'Activar acceso institucional',exact:true})).toBeVisible();await expect(page).toHaveURL(origin()+'/activate');expect((await e.pool.query('SELECT status FROM account_invitations WHERE id=$1',[invite.id])).rows[0].status).toBe('pending');
 const password='Activated-'+randomBytes(12).toString('hex');await page.getByLabel('Nueva contraseña',{exact:true}).fill(password);await page.getByLabel('Repetir contraseña',{exact:true}).fill(password);const activated=page.waitForResponse(r=>r.url().endsWith('/auth/invitations/activate'));await page.getByRole('button',{name:'Activar mi cuenta',exact:true}).click();expect((await activated).status()).toBe(204);await expect(page.getByText('Cuenta activada. Ya puedes iniciar sesión.',{exact:true})).toBeVisible();
 const result=(await e.pool.query('SELECT m.is_admin,m.is_super_admin FROM institution_memberships m JOIN users u ON u.id=m.user_id WHERE u.email=$1',[email])).rows;expect(result).toEqual([{is_admin:false,is_super_admin:false}]);status(await new Api().request('/api/v1/auth/login','POST',{email,password}),200);expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);
});
test('E2E-ACCOUNT-005 existing user accepts without losing code on login / accept-existing @regression',async({e,page})=>{
 const person=e.data.actors.FST1;const previousMemberships=(await e.pool.query('SELECT id FROM institution_memberships WHERE user_id=$1',[person.id])).rows.map(row=>row.id);const {invite,token}=await emitted(e,person.email);const before=(await e.pool.query('SELECT name,password_hash FROM users WHERE id=$1',[person.id])).rows[0];await page.goto(origin()+'/activate#token='+token);await page.getByRole('button',{name:'Ya tengo cuenta',exact:true}).click();await page.getByLabel('Correo de tu cuenta',{exact:true}).fill(person.email);await page.getByLabel('Contraseña actual',{exact:true}).fill(e.password);await page.getByRole('button',{name:'Ingresar y continuar',exact:true}).click();await expect(page.getByRole('button',{name:'Aceptar acceso con mi cuenta',exact:true})).toBeVisible();await page.getByRole('button',{name:'Aceptar acceso con mi cuenta',exact:true}).click();await expect(page.getByText('Acceso institucional activado.',{exact:true})).toBeVisible();const after=(await e.pool.query('SELECT name,password_hash FROM users WHERE id=$1',[person.id])).rows[0];expect(after.name===before.name&&after.password_hash===before.password_hash).toBe(true);const memberships=(await e.pool.query('SELECT id FROM institution_memberships WHERE user_id=$1',[person.id])).rows.map(row=>row.id);expect(previousMemberships.every(id=>memberships.includes(id))).toBe(true);expect(memberships.length).toBe(previousMemberships.length+1);expect((await e.pool.query('SELECT accepted_user_id FROM account_invitations WHERE id=$1',[invite.id])).rows[0].accepted_user_id).toBe(person.id);
});
test('E2E-ACCOUNT-006 own avatar persists across backend restart / avatar-local @regression',async({e,actorPage})=>{
 const page=await actorPage('ST1');await profilePage(page);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWNgYGAAAAAEAAGjChXjAAAAAElFTkSuQmCC','base64');
 await page.getByLabel('Elegir una foto',{exact:true}).setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:png});const saved=page.waitForResponse(r=>r.url().endsWith('/me/avatar')&&r.request().method()==='PUT');await page.getByRole('button',{name:'Guardar foto',exact:true}).click();expect((await saved).status()).toBe(200);await expect(page.getByRole('button',{name:'Eliminar foto',exact:true})).toBeVisible();
 await e.restartApi();const api=await e.api('ST1');const photo=await fetch(apiBase+'/api/v1/me/avatar',{headers:{Authorization:'Bearer '+api.token}});expect(photo.status).toBe(200);expect(photo.headers.get('content-type')).toContain('image/webp');expect((await photo.arrayBuffer()).byteLength).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Eliminar foto',exact:true}).click();const removed=page.waitForResponse(r=>r.url().endsWith('/me/avatar')&&r.request().method()==='DELETE');await page.getByRole('button',{name:'¿Eliminar tu foto?',exact:true}).click();expect((await removed).status()).toBe(200);expect((await ownProfile(api)).hasAvatar).toBe(false);
});
