import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepartmentDto } from './schemas/department.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { DepartmentQueryDto } from './schemas/department-query.schema';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all department
   * @param param0
   * @returns Department[]
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    status = undefined,
    createdBy = undefined,
  }: DepartmentQueryDto): Promise<{
    items: Array<Omit<Department, 'createdBy' | 'updatedBy' | 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        name: { contains: search },
      }),
      ...(createdBy !== undefined && { createdBy }),
      ...(status !== undefined && { status }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
          status: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find department by id
   * @param id
   * @returns Department
   */
  async findOne(
    id: number,
  ): Promise<Omit<Department, 'createdBy' | 'updatedBy' | 'updatedAt'> | null> {
    return await this.prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });
  }

  /**
   * Create new department
   * @param departmentDto
   * @returns Department
   */
  async create(
    departmentDto: DepartmentDto,
    creatorEmail: string,
  ): Promise<Omit<Department, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.department.create({
      data: { ...departmentDto, createdBy: creator?.id },
      select: {
        id: true,
        name: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });
  }

  /**
   * Update department by id
   * @param id
   * @param departmentDto
   * @returns Department
   */
  async update(
    id: number,
    departmentDto: DepartmentDto,
    updatorEmail: string,
  ): Promise<Omit<Department, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.department.update({
      where: { id },
      data: { ...departmentDto, updatedBy: updator?.id },
      select: {
        id: true,
        name: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });
  }

  /**
   * Delete department by ID
   * @param id Department ID
   * @returns Department
   */
  async remove(
    id: number,
  ): Promise<Omit<Department, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const department = await prisma.department.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!department) throw new NotFoundException('Department not found.');

      const employeeCount = await prisma.employee.count({
        where: { departmentId: id },
      });

      if (employeeCount > 0)
        throw new ConflictException(
          `Cannot delete department. It is assigned to ${employeeCount} employee(s).`,
        );

      return prisma.department.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          status: true,
          creator: { select: { id: true, name: true } },
          createdAt: true,
        },
      });
    });
  }

  /**
   * Bulk delete department
   * @param ids Department IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const departments = await prisma.department.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = departments.map((d) => d.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No departments found for the given IDs.');

      const employees = await prisma.employee.groupBy({
        by: ['departmentId'],
        where: { departmentId: { in: foundIds } },
        _count: true,
      });

      const conflictMap = new Map<number, string[]>();
      employees.forEach((e) =>
        conflictMap.set(e.departmentId, [`${e._count} employee(s)`]),
      );

      const deletableIds = foundIds.filter((id) => !conflictMap.has(id));

      const skippedIds = [
        ...notFoundIds.map((id) => ({ id, reasons: ['Not found'] })),
        ...Array.from(conflictMap.entries()).map(([id, reasons]) => ({
          id,
          reasons,
        })),
      ];

      if (deletableIds.length === 0)
        throw new ConflictException({
          message: 'No departments could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.department.deleteMany({
        where: { id: { in: deletableIds } },
      });

      return {
        count: result.count,
        deletedIds: deletableIds,
        skippedIds,
      };
    });
  }
}
