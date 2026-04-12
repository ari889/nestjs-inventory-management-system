import { Injectable, NotFoundException } from '@nestjs/common';
import { Department } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepartmentDto } from './schemas/department.schema';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all department
   * @param param0
   * @returns Department[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
  }): Promise<{ items: Department[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
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
  async findOne(id: number): Promise<Department | null> {
    return await this.prisma.department.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
          },
        },
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
  ): Promise<Department> {
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
      include: {
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
   * Update department by id
   * @param id
   * @param departmentDto
   * @returns Department
   */
  async update(
    id: number,
    departmentDto: DepartmentDto,
    updatorEmail: string,
  ): Promise<Department> {
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
      include: {
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
   * Delete department by ID
   * @param id Department ID
   * @returns Department
   */
  async remove(id: number): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!department) throw new NotFoundException('Department not found.');

    return this.prisma.department.delete({ where: { id } });
  }

  /**
   * Bulk delete department
   * @param ids Department IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BlukDeleteIdsDto['ids']): Promise<{ count: number }> {
    return this.prisma.department.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
