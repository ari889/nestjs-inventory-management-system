import { Injectable, NotFoundException } from '@nestjs/common';
import { Unit } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlukDeleteUnitDto, UnitDto } from './dto/unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All units with pagination and sorting
   * @param param0
   * @returns Unit[]
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
  }): Promise<{ items: Unit[]; totalItems: number }> {
    const where = search
      ? {
          OR: [
            { unitName: { contains: search.toLowerCase() } },
            { unitCode: { contains: search.toLowerCase() } },
          ],
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.unit.findMany({
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
          baseUnit: {
            select: {
              id: true,
              unitName: true,
              unitCode: true,
            },
          },
        },
      }),
      this.prisma.unit.count(),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Unit find by id
   * @param id
   * @returns Unit
   */
  async findOne(
    id: number,
  ): Promise<Omit<Unit, 'createdBy' | 'updatedBy' | 'baseUnitId'>> {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      select: {
        id: true,
        unitCode: true,
        unitName: true,
        baseUnit: {
          select: {
            unitName: true,
            unitCode: true,
          },
        },
        operator: true,
        operationValue: true,
        status: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!unit) throw new NotFoundException('Unit not found.');
    return unit;
  }

  /**
   * Create new Unit
   * @param unitDto
   * @param creatorEmail
   * @return Unit
   */
  async create(unitDto: UnitDto, creatorEmail: string): Promise<Unit> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.unit.create({
      data: {
        ...unitDto,
        createdBy: creator?.id,
        updatedBy: creator?.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        baseUnit: {
          select: {
            id: true,
            unitName: true,
            unitCode: true,
          },
        },
      },
    });
  }

  /**
   * Update Unit by id
   * @param id
   * @param updatorEmail
   * @param unitDto
   * @returns Unit
   */
  async update(
    id: number,
    updatorEmail: string,
    unitDto: UnitDto,
  ): Promise<Unit> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator unit not found!');

    return this.prisma.unit.update({
      where: { id },
      data: { ...unitDto, updatedBy: updator.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        baseUnit: {
          select: {
            id: true,
            unitName: true,
            unitCode: true,
          },
        },
      },
    });
  }

  /**
   * Delete unit by Id
   * @param id
   * @returns Unit
   */
  async remove(id: number): Promise<Unit> {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!unit) throw new NotFoundException('Unit not found.');

    return this.prisma.unit.delete({ where: { id } });
  }

  /**
   * Bulk delete unit by ids
   * @param ids
   * @returns Unit
   */
  async bulkDelete(ids: BlukDeleteUnitDto['ids']): Promise<{ count: number }> {
    return this.prisma.unit.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
