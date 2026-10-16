import { HttpException, UnsupportedMediaTypeException } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { NestFactory } from "@nestjs/core";
import { ProblemFilter } from "./http/problem.filter";
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
    app.use((request: {method: string; path: string; headers: Record<string, string>}, response: {setHeader(name:string,value:string):void}, next: (error?: unknown) => void) => {
      if (/^\/api\/v1\/institutions\/[^/]+\/(?:courses\/[^/]+\/modules|modules|materials)(?:\/|$)/i.test(request.path)) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        if ((Number(request.headers["content-length"])>0 || request.headers["transfer-encoding"]) && request.headers["content-type"]?.split(";",1)[0].trim().toLowerCase()!=="application/json") {
          next(new UnsupportedMediaTypeException()); return;
        }
      }
      if (request.method === "POST" && /^\/api\/v1\/auth\/login\/?$/i.test(request.path) && request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
        next(new UnsupportedMediaTypeException()); return;
      }
      next();
    });
    app.useBodyParser("json", {limit: 4096, strict: false, inflate: false});
    app.use((error: {status?: number}, _request: unknown, _response: unknown, next: (error: unknown) => void) => {
      next(new HttpException("Invalid request", [400,413,415].includes(error.status ?? 0) ? error.status! : 500));
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
