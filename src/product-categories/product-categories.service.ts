import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { ProductCategory } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductCategoryDto } from './schemas/product-category.schema';
import { ProductCategoryQueryDto } from './schemas/product-category-query.schema';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all product categories
   * @param param0
   * @returns ProductCategory
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    status = undefined,
    createdBy = undefined,
  }: ProductCategoryQueryDto): Promise<{
    items: Array<
      Omit<ProductCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        name: { contains: search },
      }),
      ...(status !== undefined && { status }),
      ...(createdBy !== undefined && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.productCategory.findMany({
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
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.productCategory.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find expnese category by id
   * @param id
   * @returns ProductCategory
   */
  async findOne(
    id: number,
  ): Promise<Omit<
    ProductCategory,
    'createdBy' | 'updatedBy' | 'updatedAt'
  > | null> {
    const productCategory = await this.prisma.productCategory.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
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

    if (!productCategory)
      throw new NotFoundException('Product category not found.');

    return productCategory;
  }

  /**
   * Create new product category
   * @param productCategoryDto
   * @returns ProductCategory
   */
  async create(
    productCategoryDto: ProductCategoryDto,
    creatorEmail: string,
  ): Promise<Omit<ProductCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.productCategory.create({
      data: { ...productCategoryDto, createdBy: creator?.id },
      select: {
        id: true,
        name: true,
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
   * Update product category by id
   * @param id
   * @param productCategoryDto
   * @returns ProductCategory
   */
  async update(
    id: number,
    productCategoryDto: ProductCategoryDto,
    updatorEmail: string,
  ): Promise<Omit<ProductCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.productCategory.update({
      where: { id },
      data: { ...productCategoryDto, updatedBy: updator?.id },
      select: {
        id: true,
        name: true,
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
   * Delete product category by ID
   * @param id ProductCategory ID
   * @returns ProductCategory
   */
  async remove(
    id: number,
  ): Promise<Omit<ProductCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const productCategory = await prisma.productCategory.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!productCategory)
        throw new NotFoundException('Product category not found.');

      const productCount = await prisma.product.count({
        where: { categoryId: id },
      });

      if (productCount > 0)
        throw new ConflictException(
          `Cannot delete product category. It is assigned to ${productCount} product(s).`,
        );

      return prisma.productCategory.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          creator: { select: { id: true, name: true } },
        },
      });
    });
  }

  /**
   * Bulk delete product categories
   * @param ids ProductCategory IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const productCategories = await prisma.productCategory.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = productCategories.map((pc) => pc.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException(
          'No product categories found for the given IDs.',
        );

      const products = await prisma.product.groupBy({
        by: ['categoryId'],
        where: { categoryId: { in: foundIds } },
        _count: true,
      });

      const conflictMap = new Map<number, string[]>();
      products.forEach((p) =>
        conflictMap.set(p.categoryId, [`${p._count} product(s)`]),
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
          message: 'No product categories could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.productCategory.deleteMany({
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
