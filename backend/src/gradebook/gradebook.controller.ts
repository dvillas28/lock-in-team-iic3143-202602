import {Controller,Get,Put,Post,HttpCode,Header,Req,Param,Body,Query} from "@nestjs/common";
import type {IdentityRequest} from "../auth/auth.guard";
import {slug,uuid} from "../courses/validation";
import {GradebookService} from "./gradebook.service";
import {publicationKey} from "./gradebook-validation";
@Controller("api/v1/institution/:institutionSlug/courses/:courseId")
export class GradebookController {
 constructor(private readonly gradebook:GradebookService) {}
 @Get("grade-items") @Header("Cache-Control","no-store")
 items(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string) {return this.gradebook.listItems(r.userId,slug(s),uuid(id));}
 @Put("gradebook/weights") @Header("Cache-Control","no-store")
 weights(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Body() b:unknown) {return this.gradebook.weights(r.userId,slug(s),uuid(id),b);}
 @Post("gradebook/publications") @HttpCode(200) @Header("Cache-Control","no-store")
 publish(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Body() b:unknown) {return this.gradebook.publish(r.userId,slug(s),uuid(id),publicationKey(r.rawHeaders),b);}
 @Get("gradebook") @Header("Cache-Control","no-store")
 book(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Query() q:Record<string,unknown>) {return this.gradebook.book(r.userId,slug(s),uuid(id),q);}
 @Get("my-grades") @Header("Cache-Control","no-store")
 own(@Req() r:IdentityRequest,@Param("institutionSlug") s:string,@Param("courseId") id:string,@Query() q:Record<string,unknown>) {return this.gradebook.myGrades(r.userId,slug(s),uuid(id),q);}
}
