import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tax } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaxQueryDto } from './schemas/tax-query.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { TaxDto } from './schemas/taxes.schema';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All taxes with pagination and sorting
   * @param param0
   * @returns Tax[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search = '',
    status = undefined,
  }: TaxQueryDto): Promise<{
    items: Array<Omit<Tax, 'createdBy' | 'updatedBy' | 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        name: { contains: search },
      }),
      ...(status !== undefined && { status }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.tax.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
          rate: true,
          status: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.tax.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Tax find by id
   * @param id
   * @returns Tax
   */
  async findOne(
    id: number,
  ): Promise<Omit<Tax, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const tax = await this.prisma.tax.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        rate: true,
        status: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!tax) throw new NotFoundException('Tax not found.');
    return tax;
  }

  /**
   * Create new Customer Group
   * @param taxDto
   * @param creatorEmail
   * @return CustomerGroup
   */
  async create(
    taxDto: TaxDto,
    creatorEmail: string,
  ): Promise<Omit<Tax, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.tax.create({
      data: {
        ...taxDto,
        createdBy: creator?.id,
        updatedBy: creator?.id,
      },
      select: {
        id: true,
        name: true,
        rate: true,
        status: true,
        createdAt: true,
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
   * Update Tax by id
   * @param id
   * @param updatorEmail
   * @param taxDto
   * @returns Tax
   */
  async update(
    id: number,
    updatorEmail: string,
    taxDto: TaxDto,
  ): Promise<Omit<Tax, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator tax not found!');

    return this.prisma.tax.update({
      where: { id },
      data: { ...taxDto, updatedBy: updator.id },
      select: {
        id: true,
        name: true,
        rate: true,
        status: true,
        createdAt: true,
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
   * Delete tax by Id
   * @param id
   * @returns Tax
   */
  async remove(
    id: number,
  ): Promise<Omit<Tax, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const tax = await prisma.tax.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!tax) throw new NotFoundException('Tax not found.');

      const [
        productCount,
        purchaseCount,
        saleCount,
        purchaseProductCount,
        saleProductCount,
      ] = await Promise.all([
        prisma.product.count({ where: { taxId: id } }),
        prisma.purchase.count({ where: { taxId: id } }),
        prisma.sale.count({ where: { taxId: id } }),
        prisma.purchaseProduct.count({ where: { taxId: id } }),
        prisma.saleProduct.count({ where: { taxId: id } }),
      ]);

      const conflicts: string[] = [];
      if (productCount > 0) conflicts.push(`${productCount} product(s)`);
      if (purchaseCount > 0) conflicts.push(`${purchaseCount} purchase(s)`);
      if (saleCount > 0) conflicts.push(`${saleCount} sale(s)`);
      if (purchaseProductCount > 0)
        conflicts.push(`${purchaseProductCount} purchase product(s)`);
      if (saleProductCount > 0)
        conflicts.push(`${saleProductCount} sale product(s)`);

      if (conflicts.length > 0)
        throw new ConflictException(
          `Cannot delete tax. It is assigned to: ${conflicts.join(', ')}.`,
        );

      return prisma.tax.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          rate: true,
          status: true,
          createdAt: true,
          creator: { select: { id: true, name: true } },
        },
      });
    });
  }

  /**
   * Bulk delete customer group by ids
   * @param ids
   * @returns CustomerGroup
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const taxes = await prisma.tax.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = taxes.map((t) => t.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No taxes found for the given IDs.');

      const [products, purchases, sales, purchaseProducts, saleProducts] =
        await Promise.all([
          prisma.product.groupBy({
            by: ['taxId'],
            where: { taxId: { in: foundIds } },
            _count: true,
          }),
          prisma.purchase.groupBy({
            by: ['taxId'],
            where: { taxId: { in: foundIds } },
            _count: true,
          }),
          prisma.sale.groupBy({
            by: ['taxId'],
            where: { taxId: { in: foundIds } },
            _count: true,
          }),
          prisma.purchaseProduct.groupBy({
            by: ['taxId'],
            where: { taxId: { in: foundIds } },
            _count: true,
          }),
          prisma.saleProduct.groupBy({
            by: ['taxId'],
            where: { taxId: { in: foundIds } },
            _count: true,
          }),
        ]);

      const conflictMap = new Map<number, string[]>();

      const addConflict = (taxId: number | null, label: string) => {
        if (!taxId) return;
        if (!conflictMap.has(taxId)) conflictMap.set(taxId, []);
        conflictMap.get(taxId)!.push(label);
      };

      products.forEach((p) => addConflict(p.taxId, `${p._count} product(s)`));
      purchases.forEach((p) => addConflict(p.taxId, `${p._count} purchase(s)`));
      sales.forEach((s) => addConflict(s.taxId, `${s._count} sale(s)`));
      purchaseProducts.forEach((pp) =>
        addConflict(pp.taxId, `${pp._count} purchase product(s)`),
      );
      saleProducts.forEach((sp) =>
        addConflict(sp.taxId, `${sp._count} sale product(s)`),
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
          message: 'No taxes could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.tax.deleteMany({
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
