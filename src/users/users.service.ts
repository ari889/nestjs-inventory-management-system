import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword } from 'src/common/hash';
import { UserQueryDto } from './schema/user-query.schema';
import { UserListItem } from './@types/user.types';
import { CreateUserDto, UpdateUserDto } from './schema/user.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

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
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    gender = undefined,
    status = undefined,
  }: UserQueryDto): Promise<{
    items: UserListItem[];
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phoneNo: { contains: search } },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(gender !== undefined && { gender }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNo: true,
          avatar: true,
          gender: true,
          status: true,
          createdAt: true,
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
      this.prisma.user.count({ where }),
    ]);
    return { items, totalItems };
  }

  /**
   * Find user by email
   * @param email
   * @param isPassword
   * @returns User
   */
  async findByEmail(email: string, isPassword: boolean = false) {
    return this.prisma.user.findUnique({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phoneNo: true,
        password: isPassword,
        status: true,
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
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: {
          select: {
            id: true,
            roleName: true,
            deletable: true,
          },
        },
        phoneNo: true,
        gender: true,
      },
    });
  }

  /**
   * Create new user
   * @param userDto
   * @param creatorEmail
   * @returns User
   */
  async create(
    userDto: CreateUserDto,
    creatorEmail: string,
  ): Promise<UserListItem> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    const user = await this.findByEmail(userDto.email, true);

    if (user) throw new UnauthorizedException('User already exists!');

    const hashedPassword = await hashPassword(userDto.password);

    return this.prisma.user.create({
      data: {
        ...userDto,
        createdBy: creator?.id,
        updatedBy: creator?.id,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        avatar: true,
        gender: true,
        status: true,
        createdAt: true,
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
    });
  }

  /**
   * Update user by id
   * @param id
   * @param updatorEmail
   * @param userDto
   * @returns User
   */
  async update(
    id: number,
    updatorEmail: string,
    userDto: UpdateUserDto,
  ): Promise<UserListItem> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    if (userDto.password) {
      userDto.password = await hashPassword(userDto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...userDto, updatedBy: updator.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        avatar: true,
        gender: true,
        status: true,
        createdAt: true,
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
    if (!user.status)
      throw new UnauthorizedException('User is already inactive!');
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
        phoneNo: true,
        avatar: true,
        gender: true,
        status: true,
        createdAt: true,
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
    });
  }

  /**
   * Bulk delete users by ids
   * @param ids
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    const deletableUsers = await this.prisma.user.findMany({
      where: {
        id: { in: ids },
        status: true,
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
