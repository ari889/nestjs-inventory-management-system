import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/generated/prisma/client';
import { UserLoginSuccessfulResponse } from './auth.types';
import { UserType } from 'src/users/user.types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email, true);
    if (!user) {
      throw new UnauthorizedException("User doesn't exist");
    }

    const isValidPassword = await bcrypt.compare(pass, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }
    return user;
  }

  async login(
    email: string,
    password: string,
  ): Promise<UserLoginSuccessfulResponse> {
    const user = (await this.validateUser(email, password)) as User;
    const payload = { email: user.email, id: user.id };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });
    return {
      success: true,
      message: 'Login successful!',
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(email: string) {
    const user = (await this.usersService.findOne(email)) as UserType;
    if (!user) throw new UnauthorizedException("User doesn't exist");
    const payload = { email: user.email, id: user.id };
    const accessToken = this.jwtService.sign(payload);
    return {
      success: true,
      message: 'Refresh token generated successfully!',
      accessToken,
    };
  }
}
