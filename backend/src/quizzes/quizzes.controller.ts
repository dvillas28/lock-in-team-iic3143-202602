import {Controller,Get,Post,Patch,HttpCode,Param,Body,Req,Res,Query} from "@nestjs/common";
import type {IdentityRequest} from "../auth/auth.guard";
import {slug,uuid} from "../courses/validation";
import {QuizzesService} from "./quizzes.service";
interface Response {setHeader(name:string,value:string):void}
@Controller("api/v1/institutions/:institutionSlug")
export class QuizzesController {
 constructor(private readonly quizzes:QuizzesService) {}
 @Post("courses/:courseId/quizzes")
 async create(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Body() body:unknown,@Res({passthrough:true}) response:Response) {
  const result=await this.quizzes.create(r.userId,slug(s),uuid(id),body);
  response.setHeader("Location",`/api/v1/institutions/${s}/quizzes/${result.id}`);return result;
 }
 @Patch("quizzes/:quizId")
 update(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("quizId") id:string,@Body() body:unknown) {return this.quizzes.update(r.userId,slug(s),uuid(id),body);}
 @Post("quizzes/:quizId/publish") @HttpCode(200)
 publish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("quizId") id:string,@Body() body:unknown) {return this.quizzes.publish(r.userId,slug(s),uuid(id),body);}
 @Get("quizzes/:quizId/authoring")
 authoring(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("quizId") id:string) {return this.quizzes.get(r.userId,slug(s),uuid(id),true);}
 @Get("quizzes/:quizId")
 get(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("quizId") id:string) {return this.quizzes.get(r.userId,slug(s),uuid(id));}
 @Get("courses/:courseId/quizzes")
 list(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Query() query:Record<string,unknown>) {return this.quizzes.list(r.userId,slug(s),uuid(id),query);}
}
