import { Body, Controller, Header, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { Public } from "./auth.guard";

@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("login")
  @Public()
  @UseGuards(ThrottlerGuard)
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  login(@Body() body: unknown) { return this.auth.login(body); }
}
