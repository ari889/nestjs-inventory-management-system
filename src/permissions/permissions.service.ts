import { BadRequestException, Injectable } from '@nestjs/common';
import { Permission } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionDto } from './dto/permission.dto';
import { PermissionItemDto } from './dto/permission-item.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Permission with pagination
   * @param {page, limit, order, direction}
   * @returns
   */
  async getPermissions({
    page,
    limit,
    order,
    direction,
    name,
    slug,
    deletable,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    name?: string;
    slug?: string;
    deletable?: boolean;
  }): Promise<{ items: Permission[]; totalItems: number }> {
    const where = {
      ...(name && { name: { contains: name } }),
      ...(slug && { slug: { contains: slug } }),
      ...(deletable !== undefined && { deletable }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        include: {
          module: {
            select: {
              id: true,
              moduleName: true,
            },
          },
        },
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
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
  async createPermission(
    permissionDto: CreatePermissionDto,
  ): Promise<Permission[]> {
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

    const createdPermissions = await Promise.all(
      permissions.map((p) =>
        this.prisma.permission.create({
          data: {
            moduleId,
            name: p.name,
            slug: p.slug,
            deletable: p.deletable ?? true,
          },
          include: {
            module: {
              select: {
                id: true,
                moduleName: true,
              },
            },
          },
        }),
      ),
    );

    return createdPermissions;
  }

  /**
   * Update Permission by id
   * @param id
   * @param permissionDto
   * @returns Permission
   */
  async updatePermission(
    id: number,
    permissionDto: PermissionItemDto,
  ): Promise<Permission> {
    const exists = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new BadRequestException('Permission not found.');
    }

    return this.prisma.permission.update({
      where: { id },
      data: permissionDto,
      include: {
        module: {
          select: {
            id: true,
            moduleName: true,
          },
        },
      },
    });
  }

  /**
   * Find permission by id
   * @param id
   * @returns
   */
  async findPermission(id: number): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            moduleName: true,
          },
        },
      },
    });
  }

  /**
   * Delete permission by id
   * @param id
   * @returns
   */
  async deletePermission(id: number): Promise<Permission> {
    return this.prisma.permission.delete({ where: { id } });
  }

  /**
   * Bulk delete permissions by ids
   * @param ids
   * @returns Number
   */
  async bulkDeletePermission(ids: number[]) {
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
