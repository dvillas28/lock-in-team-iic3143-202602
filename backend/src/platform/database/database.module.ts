import { Module } from "@nestjs/common";
import { Pool } from "pg";
import { createPool, DatabaseService } from "./database.service";

@Module({
  providers: [{ provide: Pool, useFactory: () => createPool() }, DatabaseService],
  exports: [Pool, DatabaseService],
})
export class DatabaseModule {}
