import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
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
  ): Promise<{ access_token: string }> {
    const user = (await this.validateUser(email, password)) as User;
    const payload = { email: user.email, id: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
