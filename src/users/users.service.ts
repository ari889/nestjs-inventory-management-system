import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  user() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  async findOne(email: string, isPassword: boolean = false) {
    return this.prisma.user.findUnique({
      select: {
        id: true,
        name: true,
        email: true,
        password: isPassword,
        role: {
          select: {
            id: true,
            roleName: true,
          },
        },
      },
      where: {
        email,
      },
    });
  }
}
