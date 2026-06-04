import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleDto, UpdateRoleDto } from './dto/role.dto';
import { RoleQueryDto } from './schemas/role-query.schema';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all roles
   * @param param0
   * @returns Role
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    deletable = undefined,
  }: RoleQueryDto): Promise<{
    items: Array<Omit<Role, 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && { roleName: { contains: search } }),
      ...(deletable !== undefined && { deletable }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          roleName: true,
          deletable: true,
          createdAt: true,
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find role by id
   * @param id
   * @returns Role
   */
  async findOne(id: number): Promise<Omit<Role, 'updatedAt'> | null> {
    return await this.prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        roleName: true,
        deletable: true,
        createdAt: true,
        moduleRole: {
          select: {
            module: {
              select: {
                id: true,
                moduleName: true,
              },
            },
          },
        },
        permissionRole: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create new role
   * @param roleDto
   * @returns Role
   */
  async create(roleDto: RoleDto): Promise<Omit<Role, 'updatedAt'>> {
    return this.prisma.role.create({
      data: roleDto,
      select: {
        id: true,
        roleName: true,
        deletable: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update role by id
   * @param id
   * @param roleDto
   * @returns Role
   */
  async update(
    id: number,
    roleDto: UpdateRoleDto,
  ): Promise<Omit<Role, 'updatedAt'>> {
    const { moduleIds = [], permissionIds = [], roleName, deletable } = roleDto;

    return this.prisma.$transaction(async (prisma) => {
      /**
       * Update Role basic info
       */
      const role = await prisma.role.update({
        where: { id },
        data: { roleName, deletable },
        select: {
          id: true,
          roleName: true,
          deletable: true,
          createdAt: true,
        },
      });

      /**
       * Sync ModuleRole
       */
      const existingModules = await prisma.moduleRole.findMany({
        where: { roleId: id },
        select: { moduleId: true },
      });
      const existingModuleIds = existingModules.map((m) => m.moduleId);

      const modulesToAdd = moduleIds.filter(
        (mid) => !existingModuleIds.includes(mid),
      );
      const modulesToRemove = existingModuleIds.filter(
        (mid) => !moduleIds.includes(mid),
      );

      if (modulesToAdd.length > 0) {
        await prisma.moduleRole.createMany({
          data: modulesToAdd.map((moduleId) => ({
            moduleId,
            roleId: id,
          })),
        });
      }

      if (modulesToRemove.length > 0) {
        await prisma.moduleRole.deleteMany({
          where: {
            roleId: id,
            moduleId: { in: modulesToRemove },
          },
        });
      }

      /**
       * Sync PermissionRole
       */
      const existingPermissions = await prisma.permissionRole.findMany({
        where: { roleId: id },
        select: { permissionId: true },
      });
      const existingPermissionIds = existingPermissions.map(
        (p) => p.permissionId,
      );

      const permissionsToAdd = permissionIds.filter(
        (pid) => !existingPermissionIds.includes(pid),
      );
      const permissionsToRemove = existingPermissionIds.filter(
        (pid) => !permissionIds.includes(pid),
      );

      if (permissionsToAdd.length > 0) {
        await prisma.permissionRole.createMany({
          data: permissionsToAdd.map((permissionId) => ({
            permissionId,
            roleId: id,
          })),
        });
      }

      if (permissionsToRemove.length > 0) {
        await prisma.permissionRole.deleteMany({
          where: {
            roleId: id,
            permissionId: { in: permissionsToRemove },
          },
        });
      }

      return role;
    });
  }

  /**
   * Delete role by ID
   * @param id Role ID
   * @returns Deleted Role
   */
  async remove(id: number): Promise<Omit<Role, 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) throw new NotFoundException('Role not found!');

      if (!role.deletable)
        throw new ForbiddenException(
          'You have no enough permission to delete this.',
        );

      const assignedCount = await prisma.user.count({
        where: { roleId: id },
      });

      if (assignedCount > 0)
        throw new ConflictException(
          `Cannot delete role. It is assigned to ${assignedCount} user(s).`,
        );

      await prisma.moduleRole.deleteMany({ where: { roleId: id } });
      await prisma.permissionRole.deleteMany({ where: { roleId: id } });

      return prisma.role.delete({
        where: { id },
        select: { id: true, roleName: true, deletable: true, createdAt: true },
      });
    });
  }

  /**
   * Bulk delete roles
   * @param ids Role IDs
   * @returns Summary of deletion
   */
  async bulkDelete(ids: number[]) {
    return this.prisma.$transaction(async (prisma) => {
      const roles = await prisma.role.findMany({
        where: { id: { in: ids } },
        select: { id: true, deletable: true },
      });

      const nonDeletableIds = roles
        .filter((r) => !r.deletable)
        .map((r) => r.id);

      const assignedRoles = await prisma.user.findMany({
        where: { roleId: { in: ids } },
        select: { roleId: true },
      });
      const assignedRoleIds = assignedRoles.map((r) => r.roleId);

      const deletableIds = ids.filter(
        (id) => !assignedRoleIds.includes(id) && !nonDeletableIds.includes(id),
      );

      if (deletableIds.length === 0) {
        throw new BadRequestException(
          `No roles could be deleted. All selected roles are either assigned to users or not deletable.`,
        );
      }

      await prisma.moduleRole.deleteMany({
        where: { roleId: { in: deletableIds } },
      });

      await prisma.permissionRole.deleteMany({
        where: { roleId: { in: deletableIds } },
      });

      return prisma.role.deleteMany({
        where: { id: { in: deletableIds } },
      });
    });
  }
}
