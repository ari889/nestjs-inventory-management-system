import { Injectable } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleDto } from './dto/role.dto';

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
    return this.prisma.role.findUnique({ where: { id } });
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
  async update(id: number, roleDto: RoleDto): Promise<Role> {
    return this.prisma.role.update({ where: { id }, data: roleDto });
  }

  /**
   * Delete role by id
   * @param id
   * @returns Role
   */
  async remove(id: number): Promise<Role> {
    return this.prisma.role.delete({ where: { id } });
  }

  /**
   * Delete multiple roles
   * @param ids
   * @returns Role
   */
  async bulkDelete(ids: number[]) {
    return this.prisma.role.deleteMany({
      where: { id: { in: ids }, deletable: true },
    });
  }
}
