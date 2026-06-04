import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Employee } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmployeeDto } from './schemas/employee.schema';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import {
  deleteOldFile,
  replaceFile,
  saveFile,
} from 'src/common/fileUpload/fileHelper';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All employees
   * @param param0
   * @returns Employee[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search = '',
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
  }): Promise<{ items: Employee[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.employee.findMany({
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
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Find employee by id
   * @param id
   * @returns Employee
   */
  async findOne(
    id: number,
  ): Promise<Omit<Employee, 'createdBy' | 'updatedBy'>> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!employee) throw new NotFoundException('Brand not found.');
    return employee;
  }

  /**
   * Create or update employee
   * @param dto
   * @param image
   * @returns Brand
   */
  async create(
    dto: EmployeeDto,
    creatorEmail: string,
    image?: MemoryStorageFile,
  ) {
    try {
      const creator = await this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      });

      if (!creator) throw new NotFoundException('Creator user not found!');
      const payload: Omit<Employee, 'createdAt' | 'updatedAt' | 'id'> = {
        ...dto,
        image: null,
        createdBy: creator.id,
        updatedBy: creator.id,
      };

      if (image) {
        const imageUrl = await saveFile(image, 'employees');
        payload.image = imageUrl;
      }

      return this.prisma.employee.create({
        data: payload,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Brand!');
    }
  }

  /**
   * Update employee by id
   * @param id
   * @param dto
   * @param updatorEmail
   * @param image
   * @returns Employee
   */
  async update(
    id: number,
    dto: EmployeeDto,
    updatorEmail: string,
    image?: MemoryStorageFile,
  ) {
    try {
      const [employee, updator] = await Promise.all([
        this.prisma.employee.findUnique({
          where: { id },
          select: { id: true, name: true, image: true, status: true },
        }),
        this.prisma.user.findUnique({
          where: { email: updatorEmail },
          select: { id: true },
        }),
      ]);

      if (!updator) throw new NotFoundException('Creator user not found!');

      if (!employee) throw new NotFoundException('Employee not found!');

      let imageUrl: string | null = employee?.image ?? null;

      if (image) {
        imageUrl = await replaceFile(
          image,
          'employees',
          employee?.image ?? null,
        );
      }

      const payload: Omit<
        Employee,
        'createdAt' | 'updatedAt' | 'id' | 'createdBy'
      > = {
        ...dto,
        image: imageUrl,
        updatedBy: updator.id,
      };

      return this.prisma.employee.update({
        where: { id },
        data: payload,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Employee!');
    }
  }

  /**
   * Delete employee by Id
   * @param id
   * @returns Employee
   */
  async remove(id: number): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { id: true, image: true },
    });

    if (!employee) throw new NotFoundException('Employee not found.');

    await deleteOldFile(employee?.image ?? null);

    return this.prisma.employee.delete({ where: { id } });
  }

  /**
   * Bulk delete employee by ids
   * @param ids
   * @returns Employee
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: ids } },
      select: { id: true, image: true },
    });

    if (!employees.length) {
      throw new NotFoundException('Employees not found.');
    }

    await Promise.all(employees.map((emp) => deleteOldFile(emp.image ?? null)));

    const result = await this.prisma.employee.deleteMany({
      where: { id: { in: ids } },
    });

    return result;
  }
}
