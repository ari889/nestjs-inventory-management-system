import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/generated/prisma/client';
import { UserType } from 'src/users/user.types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email, true);
    if (!user) throw new UnauthorizedException('Invalid credentials provided!');
    if (!user.status)
      throw new UnauthorizedException(
        'Your account is inactive, please contact admin!',
      );

    const isValidPassword = await bcrypt.compare(pass, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Your password is incorrect!');
    }
    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(email: string, password: string) {
    const user = (await this.validateUser(email, password)) as User;
    const payload = { email: user.email, id: user.id };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    const decoded: { exp: number } = this.jwtService.decode(accessToken);
    return {
      success: true,
      message: 'You are successfully logged in!',
      data: {
        accessToken,
        refreshToken,
        expiresIn: decoded.exp * 1000,
      },
    };
  }

  async refreshToken(email: string) {
    const user = (await this.usersService.findByEmail(email)) as UserType;
    if (!user) throw new UnauthorizedException('Invalid credentials provided!');
    const payload = { email: user.email, id: user.id };
    const accessToken = this.jwtService.sign(payload);
    const decode: { exp: number } = this.jwtService.decode(accessToken);
    return {
      success: true,
      message: 'Refresh token generated successfully!',
      data: {
        accessToken,
        expiresIn: decode.exp * 1000,
      },
    };
  }
}
