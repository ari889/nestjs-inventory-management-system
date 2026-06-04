import { Injectable, NotFoundException } from '@nestjs/common';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { ProductCategory } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductCategoryDto } from './schemas/product-category.schema';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all product categories
   * @param param0
   * @returns ProductCategory
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
  }): Promise<{ items: ProductCategory[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.productCategory.findMany({
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
  async findOne(id: number): Promise<ProductCategory | null> {
    return await this.prisma.productCategory.findUnique({
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
   * Create new product category
   * @param productCategoryDto
   * @returns ProductCategory
   */
  async create(
    productCategoryDto: ProductCategoryDto,
    creatorEmail: string,
  ): Promise<ProductCategory> {
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
   * Update product category by id
   * @param id
   * @param productCategoryDto
   * @returns ProductCategory
   */
  async update(
    id: number,
    productCategoryDto: ProductCategoryDto,
    updatorEmail: string,
  ): Promise<ProductCategory> {
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
   * Delete product category by ID
   * @param id ProductCategory ID
   * @returns ProductCategory
   */
  async remove(id: number): Promise<ProductCategory> {
    const productCategory = await this.prisma.productCategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!productCategory)
      throw new NotFoundException('Product category not found.');

    return this.prisma.productCategory.delete({ where: { id } });
  }

  /**
   * Bulk delete product categories
   * @param ids ProductCategory IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    return this.prisma.productCategory.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
