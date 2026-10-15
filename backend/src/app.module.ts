import { Module } from "@nestjs/common";
import { DatabaseModule } from "./platform/database/database.module";
import { PlatformModule } from "./platform/platform.module";

@Module({
  imports: [DatabaseModule, PlatformModule],
})
export class AppModule {}
