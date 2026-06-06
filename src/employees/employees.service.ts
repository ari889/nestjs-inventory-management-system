import {
  BadRequestException,
  ConflictException,
  Injectable,
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
import { EmployeeQueryDto } from './schemas/employee-query.schema';

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
    status = undefined,
    createdBy = undefined,
    departmentId = undefined,
  }: EmployeeQueryDto): Promise<{
    items: Array<
      Omit<Employee, 'createdBy' | 'updatedBy' | 'updatedAt' | 'departmentId'>
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
          { city: { contains: search } },
          { state: { contains: search } },
          { zip: { contains: search } },
          { postalCode: { contains: search } },
          { country: { contains: search } },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(createdBy !== undefined && { createdBy }),
      ...(departmentId !== undefined && { departmentId }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          postalCode: true,
          country: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
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
  ): Promise<
    Omit<Employee, 'createdBy' | 'updatedBy' | 'updatedAt' | 'departmentId'>
  > {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        postalCode: true,
        country: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
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
  ): Promise<
    Omit<Employee, 'createdBy' | 'updatedBy' | 'updatedAt' | 'departmentId'>
  > {
    const [isPhoneExists, department, creator] = await Promise.all([
      this.prisma.employee.findFirst({
        where: { phone: dto.phone },
        select: { id: true },
      }),
      this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      }),
    ]);

    if (isPhoneExists) throw new BadRequestException('Phone already exists.');
    if (!department) throw new NotFoundException('Department not found.');
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
      select: {
        id: true,
        name: true,
        image: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        postalCode: true,
        country: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
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
  ): Promise<
    Omit<Employee, 'createdBy' | 'updatedBy' | 'updatedAt' | 'departmentId'>
  > {
    const [isPhoneExists, department, employee, updator] = await Promise.all([
      this.prisma.employee.findFirst({
        where: { phone: dto.phone, id: { not: id } },
        select: { id: true },
      }),
      this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { id: true },
      }),
      this.prisma.employee.findUnique({
        where: { id },
        select: { id: true, name: true, image: true, status: true },
      }),
      this.prisma.user.findUnique({
        where: { email: updatorEmail },
        select: { id: true },
      }),
    ]);

    if (isPhoneExists) throw new BadRequestException('Phone already exists.');
    if (!department) throw new NotFoundException('Department not found.');
    if (!updator) throw new NotFoundException('Creator user not found!');
    if (!employee) throw new NotFoundException('Employee not found!');

    let imageUrl: string | null = employee?.image ?? null;

    if (image) {
      imageUrl = await replaceFile(image, 'employees', employee?.image ?? null);
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
      select: {
        id: true,
        name: true,
        image: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        postalCode: true,
        country: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
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
   * Delete employee by Id
   * @param id
   * @returns Employee
   */
  async remove(
    id: number,
  ): Promise<
    Omit<Employee, 'createdBy' | 'updatedBy' | 'updatedAt' | 'departmentId'>
  > {
    return this.prisma.$transaction(async (prisma) => {
      const employee = await prisma.employee.findUnique({
        where: { id },
        select: { id: true, image: true },
      });

      if (!employee) throw new NotFoundException('Employee not found.');

      const [attendanceCount, payrollCount] = await Promise.all([
        prisma.attendance.count({ where: { employeeId: id } }),
        prisma.payroll.count({ where: { employeeId: id } }),
      ]);

      const conflicts: string[] = [];
      if (attendanceCount > 0)
        conflicts.push(`${attendanceCount} attendance(s)`);
      if (payrollCount > 0) conflicts.push(`${payrollCount} payroll(s)`);

      if (conflicts.length > 0)
        throw new ConflictException(
          `Cannot delete employee. It is assigned to: ${conflicts.join(', ')}.`,
        );

      await deleteOldFile(employee.image ?? null);

      return prisma.employee.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          postalCode: true,
          country: true,
          department: { select: { id: true, name: true } },
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
    });
  }

  /**
   * Bulk delete employee by ids
   * @param ids
   * @returns Employee
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const employees = await prisma.employee.findMany({
        where: { id: { in: ids } },
        select: { id: true, image: true },
      });

      const foundIds = employees.map((e) => e.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No employees found for the given IDs.');

      const [attendances, payrolls] = await Promise.all([
        prisma.attendance.groupBy({
          by: ['employeeId'],
          where: { employeeId: { in: foundIds } },
          _count: true,
        }),
        prisma.payroll.groupBy({
          by: ['employeeId'],
          where: { employeeId: { in: foundIds } },
          _count: true,
        }),
      ]);

      const conflictMap = new Map<number, string[]>();

      const addConflict = (employeeId: number, label: string) => {
        if (!conflictMap.has(employeeId)) conflictMap.set(employeeId, []);
        conflictMap.get(employeeId)!.push(label);
      };

      attendances.forEach((a) =>
        addConflict(a.employeeId, `${a._count} attendance(s)`),
      );
      payrolls.forEach((p) =>
        addConflict(p.employeeId, `${p._count} payroll(s)`),
      );

      const deletableIds = foundIds.filter((id) => !conflictMap.has(id));
      const deletableEmployees = employees.filter((e) =>
        deletableIds.includes(e.id),
      );

      const skippedIds = [
        ...notFoundIds.map((id) => ({ id, reasons: ['Not found'] })),
        ...Array.from(conflictMap.entries()).map(([id, reasons]) => ({
          id,
          reasons,
        })),
      ];

      if (deletableIds.length === 0)
        throw new ConflictException({
          message: 'No employees could be deleted.',
          skipped: skippedIds,
        });

      await Promise.all(
        deletableEmployees.map((e) => deleteOldFile(e.image ?? null)),
      );

      const result = await prisma.employee.deleteMany({
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
