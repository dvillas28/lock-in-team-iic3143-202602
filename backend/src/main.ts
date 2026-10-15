import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { reportError } from "./database/config";

async function bootstrap() {
  const deadline = setTimeout(() => {
    reportError("startup", new Error("Startup deadline exceeded"));
    process.exit(1);
  }, 25000);
  let app;
  try {
    app = await NestFactory.create(AppModule, { abortOnError: false, logger: false });
    app.enableShutdownHooks();
    await app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0");
  } catch (error) {
    if (app) await app.close();
    reportError("startup", error);
    process.exitCode = 1;
  } finally { clearTimeout(deadline); }
}

void bootstrap();
