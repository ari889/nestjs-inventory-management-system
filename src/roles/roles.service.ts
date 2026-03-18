import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all roles
   * @param param0
   * @returns Role
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search,
    deletable,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
    deletable?: boolean;
  }): Promise<{ items: Role[]; totalItems: number }> {
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
  async findOne(id: number): Promise<Role | null> {
    return await this.prisma.role.findUnique({
      where: { id },
      include: {
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
  async create(roleDto: RoleDto): Promise<Role> {
    return this.prisma.role.create({ data: roleDto });
  }

  /**
   * Update role by id
   * @param id
   * @param roleDto
   * @returns Role
   */
  async update(id: number, roleDto: UpdateRoleDto): Promise<Role> {
    const { moduleIds = [], permissionIds = [], roleName, deletable } = roleDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1️⃣ Update Role basic info
      const role = await prisma.role.update({
        where: { id },
        data: { roleName, deletable },
      });

      // 2️⃣ Sync ModuleRole
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

      // 3️⃣ Sync PermissionRole
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
  async remove(id: number): Promise<Role> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch role info to check deletable
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new BadRequestException(`Role not found`);
      }

      if (!role.deletable) {
        throw new BadRequestException(
          `You have no enough permission to delete this.`,
        );
      }

      // 2. Check if assigned to any user
      const assignedCount = await prisma.user.count({
        where: { roleId: id },
      });

      if (assignedCount > 0) {
        throw new BadRequestException(
          `Cannot delete role. It is assigned to ${assignedCount} user(s).`,
        );
      }

      // 3. Delete related module_role entries
      await prisma.moduleRole.deleteMany({
        where: { roleId: id },
      });

      // 4. Delete related permission_role entries
      await prisma.permissionRole.deleteMany({
        where: { roleId: id },
      });

      // 5. Delete the role itself
      const deletedRole = await prisma.role.delete({
        where: { id },
      });

      return deletedRole;
    });
  }

  /**
   * Bulk delete roles
   * @param ids Role IDs
   * @returns Summary of deletion
   */
  async bulkDelete(ids: number[]) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch roles to check deletable
      const roles = await prisma.role.findMany({
        where: { id: { in: ids } },
        select: { id: true, deletable: true },
      });

      const nonDeletableIds = roles
        .filter((r) => !r.deletable)
        .map((r) => r.id);

      // 2. Find roles assigned to any user
      const assignedRoles = await prisma.user.findMany({
        where: { roleId: { in: ids } },
        select: { roleId: true },
      });
      const assignedRoleIds = assignedRoles.map((r) => r.roleId);

      // 3. Filter roles that can be deleted
      const deletableIds = ids.filter(
        (id) => !assignedRoleIds.includes(id) && !nonDeletableIds.includes(id),
      );

      if (deletableIds.length === 0) {
        throw new BadRequestException(
          `No roles could be deleted. All selected roles are either assigned to users or not deletable.`,
        );
      }

      // 4. Delete related module_role entries
      await prisma.moduleRole.deleteMany({
        where: { roleId: { in: deletableIds } },
      });

      // 5. Delete related permission_role entries
      await prisma.permissionRole.deleteMany({
        where: { roleId: { in: deletableIds } },
      });

      // 6. Delete roles themselves
      const deletedRoles = await prisma.role.deleteMany({
        where: { id: { in: deletableIds } },
      });

      return {
        deletedRoleIds: deletableIds,
        skippedRoleIds: [...assignedRoleIds, ...nonDeletableIds],
        count: deletedRoles.count,
      };
    });
  }
}
