import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlukDeleteUserDto } from './dto/bulk-delete-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all users
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns User
   */
  async findAll({
    page,
    limit,
    order,
    direction,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
  }): Promise<{ items: User[]; totalItems: number }> {
    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        include: {
          role: {
            select: {
              id: true,
              roleName: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);
    return { items, totalItems };
  }

  /**
   * Find user by emailm
   * @param email
   * @param isPassword
   * @returns User
   */
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

  /**
   * Find by id
   * @param id
   * @returns
   */
  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            deletable: true,
          },
        },
      },
    });
  }

  /**
   * Remove user by id
   * @param id
   * @returns
   */
  async remove(
    id: number,
  ): Promise<{ id: number; name: string; email: string }> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found!');
    if (!user.role.deletable)
      throw new UnauthorizedException(
        'You have no enough permissions to do this!',
      );
    return this.prisma.user.update({
      where: {
        id,
        role: {
          deletable: true,
        },
      },
      data: {
        status: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  /**
   * Bulk delete users by ids
   * @param ids
   * @returns User
   */
  async bulkDelete(ids: BlukDeleteUserDto['ids']): Promise<{ count: number }> {
    const deletableUsers = await this.prisma.user.findMany({
      where: {
        id: { in: ids },
        role: { deletable: true },
      },
      select: { id: true },
    });

    if (!deletableUsers.length)
      throw new UnauthorizedException(
        'No users found or none have deletable roles!',
      );

    return this.prisma.user.updateMany({
      where: {
        id: { in: deletableUsers.map((u) => u.id) },
      },
      data: {
        status: false,
      },
    });
  }
}
