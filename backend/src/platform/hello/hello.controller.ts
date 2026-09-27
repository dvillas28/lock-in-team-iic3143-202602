import { Controller, Get } from "@nestjs/common";

interface HelloResponse {
  message: string;
}

@Controller()
export class HelloController {
  @Get()
  getHello(): HelloResponse {
    return {
      message: "Hello World from AcademiX API!",
    };
  }
}
