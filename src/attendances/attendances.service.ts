import { Injectable, NotFoundException } from '@nestjs/common';
import { Attendance } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AttendanceDto } from './schemas/attendance.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { combineDateAndTime } from 'src/common/date/common';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All attendance
   * @param param0
   * @returns Attendance[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
  }): Promise<{ items: Attendance[]; totalItems: number }> {
    const [items, totalItems] = await Promise.all([
      this.prisma.attendance.findMany({
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
          employee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.attendance.count(),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Find attendance by id
   * @param id
   * @returns Attendance
   */
  async findOne(
    id: number,
  ): Promise<Omit<Attendance, 'createdBy' | 'updatedBy'>> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
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
  async create(dto: AttendanceDto, creatorEmail: string) {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: { id: true },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    const checkIn = combineDateAndTime(dto.date, dto.checkIn);

    const checkOut = dto.checkOut
      ? combineDateAndTime(dto.date, dto.checkOut)
      : null;

    return this.prisma.attendance.create({
      data: { ...dto, checkIn, checkOut, createdBy: creator?.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
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
  async update(id: number, dto: AttendanceDto, updatorEmail: string) {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: { id: true },
    });

    if (!updator) throw new NotFoundException('Creator user not found!');

    const checkIn = combineDateAndTime(dto.date, dto.checkIn);

    const checkOut = dto.checkOut
      ? combineDateAndTime(dto.date, dto.checkOut)
      : null;

    return this.prisma.attendance.update({
      where: { id },
      data: { ...dto, checkIn, checkOut, updatedBy: updator?.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete attendance by Id
   * @param id
   * @returns Attendance
   */
  async remove(id: number): Promise<Attendance> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!attendance) throw new NotFoundException('Attendance not found.');

    return this.prisma.attendance.delete({ where: { id } });
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
