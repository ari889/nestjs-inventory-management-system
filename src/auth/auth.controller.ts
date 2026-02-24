import { Body, Controller, Post, Request, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginSchema } from './login.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { LoginUserDto } from './login.schema';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UsePipes(new ZodValidationPipe(LoginSchema))
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto.email, loginUserDto.password);
  }
}
