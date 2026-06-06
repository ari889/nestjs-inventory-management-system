import { Injectable, NotFoundException } from '@nestjs/common';
import { Attendance } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AttendanceDto } from './schemas/attendance.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { combineDateAndTime } from 'src/common/date/common';
import { AttendanceQueryDto } from './schemas/attendance-query.schema';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All attendance
   * @param param0
   * @returns Attendance[]
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    employeeId = undefined,
    createdBy = undefined,
    status = undefined,
    date = undefined,
  }: AttendanceQueryDto) {
    const dateFilter = date
      ? {
          date: {
            gte: new Date(
              Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                0,
                0,
                0,
                0,
              ),
            ),
            lte: new Date(
              Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                23,
                59,
                59,
                999,
              ),
            ),
          },
        }
      : {};

    const where = {
      ...(employeeId !== undefined && { employeeId }),
      ...(createdBy !== undefined && { createdBy }),
      ...(status !== undefined && { status }),
      ...dateFilter,
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { [order]: direction },
        select: {
          id: true,
          employee: { select: { id: true, name: true } },
          checkIn: true,
          checkOut: true,
          date: true,
          status: true,
          creator: { select: { id: true, name: true } },
          createdAt: true,
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, totalItems };
  }

  /**
   * Find attendance by id
   * @param id
   * @returns Attendance
   */
  async findOne(
    id: number,
  ): Promise<
    Omit<Attendance, 'createdBy' | 'updatedBy' | 'employeeId' | 'updatedAt'>
  > {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      select: {
        id: true,
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        checkIn: true,
        checkOut: true,
        date: true,
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
    if (!attendance) throw new NotFoundException('Attendance not found.');
    return attendance;
  }

  /**
   * Create or update attendance
   * @param dto
   * @returns Attendance
   */
  async create(
    dto: AttendanceDto,
    creatorEmail: string,
  ): Promise<
    Omit<Attendance, 'createdBy' | 'updatedBy' | 'employeeId' | 'updatedAt'>
  > {
    const [creator, employee] = await Promise.all([
      this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      }),
      this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true },
      }),
    ]);

    if (!creator) throw new NotFoundException('Creator user not found!');
    if (!employee) throw new NotFoundException('Employee not found!');

    const checkIn = combineDateAndTime(dto.date, dto.checkIn);

    const checkOut = dto.checkOut
      ? combineDateAndTime(dto.date, dto.checkOut)
      : null;

    return this.prisma.attendance.create({
      data: { ...dto, checkIn, checkOut, createdBy: creator?.id },
      select: {
        id: true,
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        checkIn: true,
        checkOut: true,
        date: true,
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
   * Update attendance by id
   * @param id
   * @param dto
   * @param updatorEmail
   * @returns Attendance
   */
  async update(
    id: number,
    dto: AttendanceDto,
    updatorEmail: string,
  ): Promise<
    Omit<Attendance, 'createdBy' | 'updatedBy' | 'employeeId' | 'updatedAt'>
  > {
    const [updator, employee] = await Promise.all([
      this.prisma.user.findUnique({
        where: { email: updatorEmail },
        select: { id: true },
      }),
      this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true },
      }),
    ]);

    if (!updator) throw new NotFoundException('Creator user not found!');
    if (!employee) throw new NotFoundException('Employee not found!');

    const checkIn = combineDateAndTime(dto.date, dto.checkIn);

    const checkOut = dto.checkOut
      ? combineDateAndTime(dto.date, dto.checkOut)
      : null;

    return this.prisma.attendance.update({
      where: { id },
      data: { ...dto, checkIn, checkOut, updatedBy: updator?.id },
      select: {
        id: true,
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        checkIn: true,
        checkOut: true,
        date: true,
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
   * Delete attendance by Id
   * @param id
   * @returns Attendance
   */
  async remove(
    id: number,
  ): Promise<
    Omit<Attendance, 'createdBy' | 'updatedBy' | 'employeeId' | 'updatedAt'>
  > {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!attendance) throw new NotFoundException('Attendance not found.');

    return this.prisma.attendance.delete({
      where: { id },
      select: {
        id: true,
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        checkIn: true,
        checkOut: true,
        date: true,
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
   * Bulk delete Attendance by ids
   * @param ids
   * @returns Attendance
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    return this.prisma.attendance.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
