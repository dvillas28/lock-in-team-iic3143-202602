import type {Session} from "../auth/session.ts";
import {StaleSessionError} from "../auth/session.ts";
import type {CurrentUser} from "../auth/validation.ts";
import type {Course} from "../courses/validation.ts";
import {FieldError} from "../courses/validation.ts";
import type {SafeQuiz} from "../quizzes/validation.ts";
import {ApiHttpError} from "../api/errors.ts";
import {startAttempt,getAttempt,saveAnswers,submitAttempt,cancelAttempt} from "../api/attempts.ts";
import {attemptCapabilities} from "./capabilities.ts";
import {answersInput,sameAnswers,receiptFromAttempt,type Answer,type Attempt,type Receipt} from "./validation.ts";
type Kind="start"|"save"|"submit"|"cancel";
export type OperationState={attempt?:Attempt;draft:Answer[];confirmed:Answer[];busy:boolean;phase:"pristine"|"dirty"|"saving"|"saved"|"working"|"error"|"uncertain";pending?:Kind;message:string;receipt?:Receipt;cancelConfirmed?:boolean;knownId?:string};
const empty=():OperationState=>({draft:[],confirmed:[],busy:false,phase:"pristine",message:""});
export class AttemptOperations {
 private state:OperationState;
 private listeners=new Set<()=>void>();
 private readonly origin;
 private alive=true;
 private startKey?:string;
 private submitKey?:string;
 private startTarget?:string;
 constructor(private session:Session,private slug:string,private user:CurrentUser,private course:Course,private quiz:SafeQuiz,initial?:Attempt){
  this.origin=session.getSnapshot();
  this.state={...empty(),attempt:initial,draft:initial?.answers.map(a=>({...a}))??[],confirmed:initial?.answers.map(a=>({...a}))??[],receipt:initial&&receiptFromAttempt(initial)};
 }
 private current=()=>{
  const s=this.session.getSnapshot();
  return this.alive && s.status==="authenticated" && s.generation===this.origin.generation && s.context===this.origin.context && s.context?.slug===this.slug && s.context.user?.id===this.user.id;
 };
 activate(initial?:Attempt){
  if(this.alive)return;
  const s=this.session.getSnapshot();
  if(s.context!==this.origin.context||s.generation!==this.origin.generation)return;
  this.alive=true;
  if(initial)this.adopt(initial);
 }
 subscribe=(listener:()=>void)=>{
  this.listeners.add(listener);
  const off=this.session.subscribe(()=>{if(!this.current())this.dispose();});
  return ()=>{this.listeners.delete(listener);off();};
 };
 getSnapshot=()=>this.state;
 private update(patch:Partial<OperationState>){if(this.current()){this.state={...this.state,...patch};this.listeners.forEach(f=>f());}}
 dispose=()=>{this.alive=false;this.startKey=undefined;this.submitKey=undefined;this.startTarget=undefined;this.state=empty();this.listeners.forEach(f=>f());};
 private available(){if(!this.current()){this.dispose();return false;}return !this.state.busy;}
 private caps(){return this.state.attempt?attemptCapabilities(this.user,this.course,this.quiz,this.state.attempt):undefined;}
 private adopt(a:Attempt){this.update({attempt:a,draft:a.answers.map(x=>({...x})),confirmed:a.answers.map(x=>({...x})),receipt:receiptFromAttempt(a)});}
 private read(id:string){return this.session.request(c=>getAttempt(c,this.slug,id,{...(this.caps()?.student||!this.state.attempt?{studentId:this.user.id}:{staff:true}),quizId:this.quiz.id,sectionId:this.state.attempt?.sectionId??this.startTarget}),this.current);}
 private async run(kind:Kind,operation:()=>Promise<void>){
  this.update({busy:true,phase:kind==="save"?"saving":"working",message:kind==="save"?"Guardando respuestas…":"Procesando operación…"});
  try{await operation();}
  catch(error){
   if(!this.current()){this.dispose();return;}
   const rejected=error instanceof FieldError || error instanceof ApiHttpError && error.status>=400 && error.status<500;
   const pending=!rejected||kind==="submit"||kind==="cancel"?kind:undefined;
   const message=error instanceof FieldError?error.message:error instanceof ApiHttpError && error.status===413?"El JSON máximo es 4096 bytes UTF-8.":error instanceof ApiHttpError && error.status===409?"Conflicto: no se confirmó la operación. Consulta el estado; se conserva la operación original.":rejected?"Operación rechazada. Revisa los datos y permisos vigentes.":"Resultado incierto: la operación podría haberse aplicado. No cierres esta página: perderás el estado de recuperación en memoria.";
   this.update({phase:rejected?"error":"uncertain",pending,message});
  }finally{this.update({busy:false});}
 }
 setDraft(answers:Answer[]){
  if(!this.available()||this.state.pending||this.state.cancelConfirmed||!this.caps()?.edit)return;
  const draft=answers.map(a=>({...a}));this.update({draft,phase:sameAnswers(draft,this.state.confirmed)?"saved":"dirty",message:""});
 }
 async start(sectionId:string){
  if(!this.available()||this.state.pending||this.state.attempt)return;
  const active=this.user.institutionMembership.active && this.user.institutionMembership.institution.active;
  const roles=this.user.sectionMemberships.filter(m=>m.courseId===this.course.id);
  const owner=this.user.institutionMembership.isAdmin && this.course.createdBy===this.user.id;
  if(!active||this.quiz.status!=="published"||this.quiz.courseId!==this.course.id||!roles.some(m=>m.role==="student"&&m.sectionId===sectionId)||roles.some(m=>m.role==="teacher"&&(owner||m.sectionId===this.quiz.sectionId))||(this.quiz.sectionId!==null&&sectionId!==this.quiz.sectionId))return;
  if(this.startTarget && this.startTarget!==sectionId)return;
  this.startTarget=sectionId;this.startKey??=crypto.randomUUID();
  await this.run("start",()=>this.performStart());
 }
 private async performStart(){
  const created=await this.session.request(c=>startAttempt(c,this.slug,this.quiz.id,this.startTarget!,this.startKey!,this.user.id),this.current);
  this.update({knownId:created.id});
  const current=await this.read(created.id);
  this.adopt(current);this.update({pending:undefined,phase:"saved",message:"Intento recuperado desde el estado actual del servidor."});
 }
 private snapshot(emptyConfirmed:boolean){
  const snapshot=answersInput(this.state.draft,this.quiz).answers;
  if(!snapshot.length&&!emptyConfirmed)throw new FieldError("answers","Confirma explícitamente guardar o enviar sin respuestas: se borrará el conjunto completo.");
  return snapshot;
 }
 async save(emptyConfirmed=false){
  if(!this.available()||this.state.pending||this.state.cancelConfirmed||!this.caps()?.edit)return;
  await this.run("save",async()=>{
   const snapshot=this.snapshot(emptyConfirmed);
   const saved=await this.session.request(c=>saveAnswers(c,this.slug,this.state.attempt!,this.quiz,snapshot),this.current);
   this.adopt(saved);this.update({phase:"saved",message:"Respuestas guardadas y confirmadas."});
  });
 }
 async submit(emptyConfirmed=false){
  if(!this.available()||this.state.pending||this.state.cancelConfirmed||!this.caps()?.edit)return;
  // Keep save failures classified as save uncertainty: never proceed to POST after an ambiguous PUT.
  if(!sameAnswers(this.state.draft,this.state.confirmed)){
   await this.save(emptyConfirmed);
   if(!this.current()||this.state.phase!=="saved"||this.state.pending)return;
  }
  if(!this.available())return;
  try{this.snapshot(emptyConfirmed);}catch(error){this.update({phase:"error",message:(error as Error).message});return;}
  await this.run("submit",async()=>{
   this.submitKey??=crypto.randomUUID();
   await this.performSubmit();
  });
 }
 private async performSubmit(){
  const receipt=await this.session.request(c=>submitAttempt(c,this.slug,this.state.attempt!.id,this.submitKey!),this.current);
  this.update({receipt,attempt:{...this.state.attempt!,status:"graded",submittedAt:receipt.submittedAt},pending:undefined,phase:"saved",message:"Envío confirmado."});
 }
 async cancel(){
  if(!this.available()||this.state.pending||this.state.cancelConfirmed||!this.caps()?.cancel)return;
  await this.run("cancel",()=>this.performCancel());
 }
 private async performCancel(){
  await this.session.request(c=>cancelAttempt(c,this.slug,this.state.attempt!.id),this.current);
  this.update({cancelConfirmed:true,pending:undefined,phase:"saved",message:"Cancelación confirmada. Fecha pendiente de consulta al servidor."});
 }
 async replay(){
  if(!this.available())return;
  const kind=this.state.pending;
  if(kind==="start"&&this.startKey)await this.run(kind,()=>this.performStart());
  if(kind==="submit"&&this.submitKey)await this.run(kind,()=>this.performSubmit());
  if(kind==="cancel")await this.run(kind,()=>this.performCancel());
 }
 async consult(){
  if(!this.available()||!this.state.attempt)return;
  this.update({busy:true});
  try{
   const observed=await this.read(this.state.attempt.id);
   if(!this.current())throw new StaleSessionError();
   const pending=this.state.pending;
   if(this.state.cancelConfirmed && observed.status!=="cancelled"){
    this.update({message:"Cancelación confirmada; la lectura no confirmó su fecha. Se conserva el éxito del 204."});
   }else if(pending!=="save" && (observed.status==="graded"||observed.status==="cancelled")){
    this.adopt(observed);this.update({pending:undefined,phase:"saved",cancelConfirmed:observed.status==="cancelled",message:"Estado terminal confirmado por el servidor."});
   }else this.update({message:this.state.cancelConfirmed?"Cancelación confirmada; fecha pendiente.":"Estado observado: "+observed.status+". Esta lectura no demuestra que una petición tardía haya terminado; se conserva el bloqueo y el borrador."});
  }catch{if(!this.current())this.dispose();else this.update({message:this.state.cancelConfirmed?"Cancelación confirmada. No se pudo consultar su fecha.":"No se pudo consultar. Se conserva el resultado incierto y su operación original."});}
  finally{this.update({busy:false});}
 }
}
