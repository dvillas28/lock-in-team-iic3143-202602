import { HttpException, PayloadTooLargeException, ServiceUnavailableException, UnsupportedMediaTypeException } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { NestFactory } from "@nestjs/core";
import { submissionBytes } from "./assignments/submission-validation";
import { maxUploadBytes } from "./academic-files/file-format";
import { ProblemFilter } from "./http/problem.filter";
import { corsOptions } from "./http/cors";
import { AppModule } from "./app.module";
import { reportError } from "./database/config";

async function bootstrap() {
  const deadline = setTimeout(() => {
    reportError("startup", new Error("Startup deadline exceeded"));
    process.exit(1);
  }, 25000);
  let app;
  try {
    app = await NestFactory.create<NestExpressApplication>(AppModule, { abortOnError: false, logger: false, bodyParser: false });
    app.getHttpAdapter().getInstance().set("trust proxy", false);
    app.enableCors(corsOptions());
    let activeUploads=0;
    app.use((request: {method: string; path: string; headers: Record<string, string>}, response: {setHeader(name:string,value:string):void;once(event:string,listener:()=>void):void}, next: (error?: unknown) => void) => {
      if (/^\/api\/v1\/(?:me(?:\/|$)|auth\/invitations(?:\/|$)|institution\/[^/]+\/(?:invitations|user-imports)(?:\/|$))/i.test(request.path)) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        const multipart=(request.method==="PUT" && /^\/api\/v1\/me\/avatar\/?$/i.test(request.path)) ||
          (request.method==="POST" && /^\/api\/v1\/institution\/[^/]+\/user-imports\/preview\/?$/i.test(request.path));
        const content=request.headers["content-type"]?.split(";",1)[0].trim().toLowerCase();
        if (multipart ? content!=="multipart/form-data" :
            ((Number(request.headers["content-length"])>0 || request.headers["transfer-encoding"]) && content!=="application/json")) {
          next(new UnsupportedMediaTypeException()); return;
        }
      }
      if (/^\/api\/v1\/institution\/[^/]+\/(?:courses\/[^/]+\/(?:modules|quizzes|assignments|evaluation-groups|grade-items|gradebook|my-grades)|sections\/[^/]+\/quizzes\/[^/]+\/attempts|quiz-attempts|modules|materials|quizzes)(?:\/|$)/i.test(request.path)) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        const submission=request.method==="POST" && /\/courses\/[^/]+\/assignments\/[^/]+\/my-submissions\/?$/i.test(request.path);
        const upload=submission || (request.method==="POST" && /\/modules\/[^/]+\/files\/?$/i.test(request.path)) ||
          (request.method==="PUT" && /\/materials\/[^/]+\/file\/?$/i.test(request.path));
        const length=Number(request.headers["content-length"]);
        const type=request.headers["content-type"]?.split(";",1)[0].trim().toLowerCase();
        if (upload ? type!=="multipart/form-data" :
            ((length>0 || request.headers["transfer-encoding"]) && type!=="application/json")) {
          next(new UnsupportedMediaTypeException()); return;
        }
        if (upload) {
          if (length>(submission ? submissionBytes+65536 : maxUploadBytes+8192)) {next(new PayloadTooLargeException());return;}
          if (activeUploads>=3) {next(new ServiceUnavailableException());return;}
          activeUploads++;
          response.once("close",()=>{activeUploads--;});
        }
      }
      if (request.method === "POST" && /^\/api\/v1\/auth\/login\/?$/i.test(request.path) && request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
        next(new UnsupportedMediaTypeException()); return;
      }
      next();
    });
    app.useBodyParser("json", {limit: 64*1024, strict: false, inflate: false,
      verify: (request: {method?:string;url?:string}, _response: unknown, body: Buffer) => {
        const pathname=request.url?.split("?",1)[0]??"";
        const gradeGroups=request.method==="PUT" &&
          /^\/api\/v1\/institution\/[^/]+\/courses\/[^/]+\/gradebook\/groups\/?$/i.test(pathname);
        const assignmentWrite=(request.method==="POST" || request.method==="PATCH") &&
          /^\/api\/v1\/institution\/[^/]+\/courses\/[^/]+\/assignments(?:\/[^/]+)?\/?$/i.test(pathname);
        const assignmentGrade=request.method==="PUT" && /\/assignments\/[^/]+\/submissions\/[^/]+\/grade\/?$/i.test(pathname);
        const gradeWrite=/\/gradebook\/(?:grades\/[^/]+|publications)\/?$/i.test(pathname);
        if (!gradeGroups && !assignmentWrite && !assignmentGrade && !gradeWrite && body.length>4096) throw Object.assign(new Error("Request too large"),{status:413});
      },
    });
    app.use((error: {status?: number}, _request: unknown, _response: unknown, next: (error: unknown) => void) => {
      next(new HttpException("Invalid request", [400,413,415,503].includes(error.status ?? 0) ? error.status! : 500));
    });
    app.useGlobalFilters(new ProblemFilter());
    app.enableShutdownHooks();
    await app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0");
  } catch (error) {
    if (app) await app.close();
    reportError("startup", error);
    process.exitCode = 1;
  } finally { clearTimeout(deadline); }
}

void bootstrap();
