import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/generated/prisma/client';
import { UserType } from 'src/users/user.types';
import { ProfileDto } from './schemas/profile.schema';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { replaceFile } from 'src/common/fileUpload/fileHelper';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword } from 'src/common/hash';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Validate user
   * @param email
   * @param pass
   * @returns {Promise<any>}
   */
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

  /**
   * Refresh token rotation
   * @param email
   * @returns {Promise<{success: boolean; message: string; data: {accessToken: string; expiresIn: number}}>}
   */
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

  /**
   * Get user by email
   * @param email
   * @returns {Promise<User>}
   */
  async getUser(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials provided!');
    return this.usersService.findByEmail(email);
  }

  /**
   * Update user profile
   * @param profileDto
   * @param updatorEmail
   * @param avatar
   * @returns User
   */
  async updateProfile(
    profileDto: ProfileDto,
    updatorEmail: string,
    avatar?: MemoryStorageFile,
  ) {
    try {
      const user = await this.usersService.findByEmail(updatorEmail);

      if (!user) throw new NotFoundException('User not found!');

      let avatarUrl: string | null = user?.avatar ?? null;

      if (avatar) {
        avatarUrl = await replaceFile(avatar, 'users', user?.avatar ?? null);
      }

      return this.prisma.user.update({
        where: { email: updatorEmail },
        data: {
          ...profileDto,
          updatedBy: user?.id,
          avatar: avatarUrl,
        },
        select: {
          name: true,
          avatar: true,
          phoneNo: true,
          gender: true,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Brand!');
    }
  }

  /**
   * Update user password
   * @param email
   * @param password
   * @returns User
   */
  async updatePassword(email: string, password: string, oldPassword: string) {
    const user = await this.usersService.findByEmail(email, true);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (!user.password) {
      throw new BadRequestException('Password not found!');
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      throw new BadRequestException("Old password doesn't match!");
    }

    const hashedPassword = await hashPassword(password);

    return this.prisma.user.update({
      where: { email },
      select: {
        email: true,
        name: true,
      },
      data: {
        password: hashedPassword,
      },
    });
  }
}
