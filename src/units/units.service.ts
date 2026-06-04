import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Unit } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UnitQueryDto } from './schemas/unit-query.schema';
import { UnitDto } from './schemas/units.schemas';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

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
    status,
    baseUnitId,
    createdBy,
  }: UnitQueryDto): Promise<{
    items: Array<
      Omit<Unit, 'createdBy' | 'updatedBy' | 'updatedAt' | 'baseUnitId'>
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { unitCode: { contains: search } },
          { unitName: { contains: search } },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(baseUnitId !== undefined && { baseUnitId }),
      ...(createdBy !== undefined && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          unitCode: true,
          unitName: true,
          baseUnit: {
            select: {
              id: true,
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
          createdAt: true,
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
  ): Promise<
    Omit<Unit, 'createdBy' | 'updatedBy' | 'baseUnitId' | 'updatedAt'>
  > {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      select: {
        id: true,
        unitCode: true,
        unitName: true,
        baseUnit: {
          select: {
            id: true,
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
        createdAt: true,
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
  async create(
    unitDto: UnitDto,
    creatorEmail: string,
  ): Promise<
    Omit<Unit, 'createdBy' | 'updatedBy' | 'updatedAt' | 'baseUnitId'>
  > {
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
      select: {
        id: true,
        unitCode: true,
        unitName: true,
        baseUnit: {
          select: {
            id: true,
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
        createdAt: true,
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
  ): Promise<
    Omit<Unit, 'createdBy' | 'updatedBy' | 'updatedAt' | 'baseUnitId'>
  > {
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
      select: {
        id: true,
        unitCode: true,
        unitName: true,
        baseUnit: {
          select: {
            id: true,
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
        createdAt: true,
      },
    });
  }

  /**
   * Delete unit by Id
   * @param id
   * @returns Unit
   */
  async remove(id: number): Promise<Unit> {
    return this.prisma.$transaction(async (prisma) => {
      const unit = await prisma.unit.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!unit) throw new NotFoundException('Unit not found.');

      const [
        baseUnitCount,
        baseProductCount,
        purchaseProductUnitCount,
        saleProductUnitCount,
        purchaseProductCount,
        saleProductCount,
      ] = await Promise.all([
        prisma.unit.count({ where: { baseUnitId: id } }),
        prisma.product.count({ where: { unitId: id } }),
        prisma.product.count({ where: { purchaseUnitId: id } }),
        prisma.product.count({ where: { saleUnitId: id } }),
        prisma.purchaseProduct.count({ where: { unitId: id } }),
        prisma.saleProduct.count({ where: { unitId: id } }),
      ]);

      const conflicts: string[] = [];
      if (baseUnitCount > 0) conflicts.push(`${baseUnitCount} child unit(s)`);
      if (baseProductCount > 0)
        conflicts.push(`${baseProductCount} product(s) as base unit`);
      if (purchaseProductUnitCount > 0)
        conflicts.push(
          `${purchaseProductUnitCount} product(s) as purchase unit`,
        );
      if (saleProductUnitCount > 0)
        conflicts.push(`${saleProductUnitCount} product(s) as sale unit`);
      if (purchaseProductCount > 0)
        conflicts.push(`${purchaseProductCount} purchase product(s)`);
      if (saleProductCount > 0)
        conflicts.push(`${saleProductCount} sale product(s)`);

      if (conflicts.length > 0)
        throw new ConflictException(
          `Cannot delete unit. It is assigned to: ${conflicts.join(', ')}.`,
        );

      return prisma.unit.delete({ where: { id } });
    });
  }

  /**
   * Bulk delete unit by ids
   * @param ids
   * @returns Unit
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const units = await prisma.unit.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = units.map((u) => u.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No units found for the given IDs.');

      const [
        baseUnits,
        baseProducts,
        purchaseProductUnits,
        saleProductUnits,
        purchaseProducts,
        saleProducts,
      ] = await Promise.all([
        prisma.unit.groupBy({
          by: ['baseUnitId'],
          where: { baseUnitId: { in: foundIds } },
          _count: true,
        }),
        prisma.product.groupBy({
          by: ['unitId'],
          where: { unitId: { in: foundIds } },
          _count: true,
        }),
        prisma.product.groupBy({
          by: ['purchaseUnitId'],
          where: { purchaseUnitId: { in: foundIds } },
          _count: true,
        }),
        prisma.product.groupBy({
          by: ['saleUnitId'],
          where: { saleUnitId: { in: foundIds } },
          _count: true,
        }),
        prisma.purchaseProduct.groupBy({
          by: ['unitId'],
          where: { unitId: { in: foundIds } },
          _count: true,
        }),
        prisma.saleProduct.groupBy({
          by: ['unitId'],
          where: { unitId: { in: foundIds } },
          _count: true,
        }),
      ]);

      const conflictMap = new Map<number, string[]>();

      const addConflict = (unitId: number | null, label: string) => {
        if (!unitId) return;
        if (!conflictMap.has(unitId)) conflictMap.set(unitId, []);
        conflictMap.get(unitId)!.push(label);
      };

      baseUnits.forEach((u) =>
        addConflict(u.baseUnitId, `${u._count} child unit(s)`),
      );
      baseProducts.forEach((p) =>
        addConflict(p.unitId, `${p._count} product(s) as base unit`),
      );
      purchaseProductUnits.forEach((p) =>
        addConflict(
          p.purchaseUnitId,
          `${p._count} product(s) as purchase unit`,
        ),
      );
      saleProductUnits.forEach((p) =>
        addConflict(p.saleUnitId, `${p._count} product(s) as sale unit`),
      );
      purchaseProducts.forEach((pp) =>
        addConflict(pp.unitId, `${pp._count} purchase product(s)`),
      );
      saleProducts.forEach((sp) =>
        addConflict(sp.unitId, `${sp._count} sale product(s)`),
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
          message: 'No units could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.unit.deleteMany({
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
