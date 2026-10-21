import {Controller,Post,Get,Put,HttpCode,Req,Param,Body,Res,Query} from "@nestjs/common";
import type {IdentityRequest} from "../auth/auth.guard";
import {slug,uuid} from "../courses/validation";
import {AttemptsService} from "./attempts.service";
import {idempotencyKey} from "./attempt-validation";
interface Response {setHeader(name:string,value:string):void}
@Controller("api/v1/institution/:institutionSlug")
export class AttemptsController {
 constructor(private readonly attempts:AttemptsService) {}
 @Post("sections/:sectionId/quizzes/:quizId/attempts")
 async start(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("sectionId") section:string,@Param("quizId") quiz:string,@Body() body:unknown,@Res({passthrough:true}) response:Response) {
  const result=await this.attempts.start(r.userId,slug(s),uuid(quiz),uuid(section),idempotencyKey(r.rawHeaders),body);
  response.setHeader("Location",`/api/v1/institution/${s}/quiz-attempts/${result.id}`);return result;
 }
 @Get("quizzes/:quizId/attempts")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("quizId") id:string,@Query() q:Record<string,unknown>) {return this.attempts.list(r.userId,slug(s),uuid(id),q);}
 @Get("quiz-attempts/:attemptId")
 get(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("attemptId") id:string) {return this.attempts.get(r.userId,slug(s),uuid(id));}
 @Put("quiz-attempts/:attemptId/answers")
 save(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("attemptId") id:string,@Body() body:unknown) {return this.attempts.save(r.userId,slug(s),uuid(id),body);}
 @Post("quiz-attempts/:attemptId/cancel") @HttpCode(204)
 cancel(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("attemptId") id:string,@Body() body:unknown) {return this.attempts.cancel(r.userId,slug(s),uuid(id),body);}
 @Post("quiz-attempts/:attemptId/submit") @HttpCode(200)
 submit(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("attemptId") id:string,@Body() body:unknown) {
  return this.attempts.submit(r.userId,slug(s),uuid(id),idempotencyKey(r.rawHeaders),body);
 }

}
