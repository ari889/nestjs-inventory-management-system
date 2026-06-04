import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionQueryDto } from './schemas/permission-query.schema';
import {
  PermissionCreateDto,
  PermissionDto,
} from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Permission with pagination
   * @param {page, limit, order, direction}
   * @returns
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    moduleId = undefined,
    deletable = undefined,
  }: PermissionQueryDto): Promise<{
    items: Array<Omit<Permission, 'moduleId' | 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [{ name: { contains: search } }, { slug: { contains: search } }],
      }),
      ...(deletable !== undefined && { deletable }),
      ...(moduleId && { moduleId }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          module: {
            select: {
              id: true,
              moduleName: true,
            },
          },
          name: true,
          slug: true,
          deletable: true,
          createdAt: true,
        },
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Create permission
   * @param permissionDto
   * @returns Permission
   */
  async create(
    permissionDto: PermissionCreateDto,
  ): Promise<Array<Omit<Permission, 'moduleId' | 'updatedAt'>>> {
    const { moduleId, permissions } = permissionDto;

    const slugs = permissions.map((p) => p.slug);

    const exists = await this.prisma.permission.findMany({
      where: {
        slug: { in: slugs },
      },
    });
    if (exists.length > 0) {
      throw new BadRequestException(
        `Permission slug already exists: ${exists.map((e) => e.slug).join(', ')}`,
      );
    }

    return Promise.all(
      permissions.map((p) =>
        this.prisma.permission.create({
          data: {
            moduleId,
            name: p.name,
            slug: p.slug,
            deletable: p.deletable ?? true,
          },
          select: {
            id: true,
            module: {
              select: {
                id: true,
                moduleName: true,
              },
            },
            name: true,
            slug: true,
            deletable: true,
            createdAt: true,
          },
        }),
      ),
    );
  }

  /**
   * Update Permission by id
   * @param id
   * @param permissionDto
   * @returns Permission
   */
  async update(
    id: number,
    permissionDto: PermissionDto,
  ): Promise<Omit<Permission, 'moduleId' | 'updatedAt'>> {
    const exists = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new BadRequestException('Permission not found.');
    }

    return this.prisma.permission.update({
      where: { id },
      data: permissionDto,
      select: {
        id: true,
        module: {
          select: {
            id: true,
            moduleName: true,
          },
        },
        name: true,
        slug: true,
        deletable: true,
        createdAt: true,
      },
    });
  }

  /**
   * Find permission by id
   * @param id
   * @returns
   */
  async findOne(
    id: number,
  ): Promise<Omit<Permission, 'moduleId' | 'updatedAt'> | null> {
    return this.prisma.permission.findUnique({
      where: { id },
      select: {
        id: true,
        module: {
          select: {
            id: true,
            moduleName: true,
          },
        },
        name: true,
        slug: true,
        deletable: true,
        createdAt: true,
      },
    });
  }

  /**
   * Remove permission by id
   * @param id
   * @returns Permission
   */
  async remove(
    id: number,
  ): Promise<Omit<Permission, 'moduleId' | 'updatedAt'>> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: {
        id: true,
        deletable: true,
        _count: { select: { permissionRole: true } },
      },
    });

    if (!permission) throw new NotFoundException('Permission not found.');

    if (!permission.deletable)
      throw new ForbiddenException(
        'You have no enough permissions to do this.',
      );

    if (permission._count.permissionRole > 0)
      throw new BadRequestException(
        'Cannot delete permission that is assigned to roles.',
      );

    return this.prisma.permission.delete({
      where: { id },
      select: {
        id: true,
        module: { select: { id: true, moduleName: true } },
        name: true,
        slug: true,
        deletable: true,
        createdAt: true,
      },
    });
  }

  /**
   * Bulk delete permissions
   * @param ids
   * @returns { count: number }
   */
  async bulkDelete(ids: number[]): Promise<{ count: number }> {
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: ids }, deletable: true },
      select: {
        id: true,
        name: true,
        _count: { select: { permissionRole: true } },
      },
    });

    if (!permissions.length)
      throw new BadRequestException(
        'No permissions found or none are deletable!',
      );

    const assignedPermissions = permissions.filter(
      (p) => p._count.permissionRole > 0,
    );

    if (assignedPermissions.length > 0)
      throw new BadRequestException(
        `Cannot delete permissions assigned to roles: ${assignedPermissions.map((p) => p.name).join(', ')}`,
      );

    return this.prisma.permission.deleteMany({
      where: { id: { in: ids }, deletable: true },
    });
  }

  async checkSlug(slug: string, email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) return false;

    if (user.id === 1) return true;

    const permission = await this.prisma.permission.findFirst({
      where: {
        slug,
        permissionRole: {
          some: {
            role: {
              users: {
                some: {
                  email,
                },
              },
            },
          },
        },
      },
    });

    return !!permission;
  }
}
