import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductDto } from './schemas/product.schema';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import {
  deleteOldFile,
  replaceFile,
  saveFile,
} from 'src/common/fileUpload/fileHelper';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Find All products
   * @param param0
   * @returns Product[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search = '',
    status = undefined,
    createdBy = undefined,
    brandId = undefined,
    categoryId = undefined,
    unitId = undefined,
    purchaseUnitId = undefined,
    saleUnitId = undefined,
    taxId = undefined,
    taxMethod = undefined,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
    status?: boolean;
    createdBy?: number;
    brandId?: number;
    categoryId?: number;
    unitId?: number;
    purchaseUnitId?: number;
    saleUnitId?: number;
    taxId?: number;
    taxMethod?: boolean;
  }): Promise<{
    items: Array<
      Omit<
        Product,
        | 'createdBy'
        | 'updatedBy'
        | 'updatedAt'
        | 'brandId'
        | 'categoryId'
        | 'unitId'
        | 'purchaseUnitId'
        | 'saleUnitId'
        | 'taxId'
        | 'description'
      >
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          {
            code: { contains: search },
          },
          { barcodeSymbology: { contains: search } },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(createdBy !== undefined && { createdBy }),
      ...(brandId !== undefined && { brandId }),
      ...(categoryId !== undefined && { categoryId }),
      ...(unitId !== undefined && { unitId }),
      ...(purchaseUnitId !== undefined && { purchaseUnitId }),
      ...(saleUnitId !== undefined && { saleUnitId }),
      ...(taxMethod !== undefined && { taxMethod }),
      ...(taxId !== undefined && { taxId }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
          code: true,
          barcodeSymbology: true,
          image: true,
          brand: {
            select: {
              id: true,
              title: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              unitName: true,
            },
          },
          purchaseUnit: {
            select: {
              id: true,
              unitName: true,
            },
          },
          saleUnit: {
            select: {
              id: true,
              unitName: true,
            },
          },
          cost: true,
          price: true,
          qty: true,
          alertQty: true,
          tax: {
            select: {
              id: true,
              name: true,
            },
          },
          taxMethod: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Product find by id
   * @param id
   * @returns Product
   */
  async findOne(
    id: number,
  ): Promise<
    Omit<
      Product,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'brandId'
      | 'categoryId'
      | 'unitId'
      | 'purchaseUnitId'
      | 'saleUnitId'
      | 'taxId'
      | 'description'
    >
  > {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        barcodeSymbology: true,
        image: true,
        brand: {
          select: {
            id: true,
            title: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        purchaseUnit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        saleUnit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        cost: true,
        price: true,
        qty: true,
        alertQty: true,
        tax: {
          select: {
            id: true,
            name: true,
          },
        },
        taxMethod: true,
        status: true,
        createdAt: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  /**
   * Create or update product
   * @param dto
   * @param image
   * @returns Product
   */
  async create(
    dto: ProductDto,
    creatorEmail: string,
    image?: MemoryStorageFile,
  ): Promise<
    Omit<
      Product,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'brandId'
      | 'categoryId'
      | 'unitId'
      | 'purchaseUnitId'
      | 'saleUnitId'
      | 'taxId'
      | 'description'
    >
  > {
    const [creator, existingCode] = await Promise.all([
      this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      }),
      this.prisma.product.findUnique({
        where: { code: dto.code },
      }),
    ]);

    if (!creator) throw new NotFoundException('Creator user not found!');

    if (existingCode) throw new BadRequestException('Code already exists!');

    const payload: Omit<Product, 'createdAt' | 'updatedAt' | 'id'> = {
      ...dto,
      cost: new Decimal(dto.cost),
      price: new Decimal(dto.price),
      image: null,
      brandId: dto.brandId ?? null,
      qty: dto.qty ?? null,
      alertQty: dto.alertQty ?? null,
      taxId: dto.taxId ?? null,
      description: dto.description ?? null,
      createdBy: creator.id,
      updatedBy: creator.id,
    };

    if (image) {
      const imageUrl = await saveFile(image, 'products');
      payload.image = imageUrl;
    }

    return this.prisma.product.create({
      data: payload,
      select: {
        id: true,
        name: true,
        code: true,
        barcodeSymbology: true,
        image: true,
        brand: {
          select: {
            id: true,
            title: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        purchaseUnit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        saleUnit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        cost: true,
        price: true,
        qty: true,
        alertQty: true,
        tax: {
          select: {
            id: true,
            name: true,
          },
        },
        taxMethod: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: number,
    dto: ProductDto,
    updatorEmail: string,
    image?: MemoryStorageFile,
  ): Promise<
    Omit<
      Product,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'brandId'
      | 'categoryId'
      | 'unitId'
      | 'purchaseUnitId'
      | 'saleUnitId'
      | 'taxId'
      | 'description'
    >
  > {
    const [existingCode, product, updator] = await Promise.all([
      this.prisma.product.findUnique({
        where: {
          code: dto?.code,
          NOT: { id },
        },
      }),
      this.prisma.product.findUnique({
        where: { id },
        select: { id: true, name: true, image: true, status: true },
      }),
      this.prisma.user.findUnique({
        where: { email: updatorEmail },
        select: { id: true },
      }),
    ]);

    if (!updator) throw new NotFoundException('Creator user not found!');

    if (!product) throw new NotFoundException('Product not found!');

    if (existingCode) throw new BadRequestException('Code already exists!');

    let imageUrl: string | null = product?.image ?? null;

    if (image) {
      imageUrl = await replaceFile(image, 'products', product?.image ?? null);
    }

    const payload: Omit<
      Product,
      'createdAt' | 'updatedAt' | 'createdBy' | 'id'
    > = {
      ...dto,
      cost: new Decimal(dto.cost),
      price: new Decimal(dto.price),
      image: imageUrl,
      brandId: dto.brandId ?? null,
      qty: dto.qty ?? null,
      alertQty: dto.alertQty ?? null,
      taxId: dto.taxId ?? null,
      description: dto.description ?? null,
      updatedBy: updator.id,
    };

    return this.prisma.product.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        name: true,
        code: true,
        barcodeSymbology: true,
        image: true,
        brand: {
          select: {
            id: true,
            title: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        purchaseUnit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        saleUnit: {
          select: {
            id: true,
            unitName: true,
          },
        },
        cost: true,
        price: true,
        qty: true,
        alertQty: true,
        tax: {
          select: {
            id: true,
            name: true,
          },
        },
        taxMethod: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Delete product by Id
   * @param id
   * @returns Product
   */
  async remove(
    id: number,
  ): Promise<
    Omit<
      Product,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'brandId'
      | 'categoryId'
      | 'unitId'
      | 'purchaseUnitId'
      | 'saleUnitId'
      | 'taxId'
      | 'description'
    >
  > {
    return this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.findUnique({
        where: { id },
        select: { id: true, image: true },
      });

      if (!product) throw new NotFoundException('Product not found.');

      const [warehouseProductCount, purchaseProductCount, saleProductCount] =
        await Promise.all([
          prisma.warehouseProduct.count({ where: { productId: id } }),
          prisma.purchaseProduct.count({ where: { productId: id } }),
          prisma.saleProduct.count({ where: { productId: id } }),
        ]);

      const conflicts: string[] = [];
      if (warehouseProductCount > 0)
        conflicts.push(`${warehouseProductCount} warehouse(s)`);
      if (purchaseProductCount > 0)
        conflicts.push(`${purchaseProductCount} purchase(s)`);
      if (saleProductCount > 0) conflicts.push(`${saleProductCount} sale(s)`);

      if (conflicts.length > 0)
        throw new ConflictException(
          `Cannot delete product. It is assigned to: ${conflicts.join(', ')}.`,
        );

      await deleteOldFile(product.image ?? null);

      return prisma.product.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          code: true,
          barcodeSymbology: true,
          image: true,
          brand: { select: { id: true, title: true } },
          category: { select: { id: true, name: true } },
          unit: { select: { id: true, unitName: true } },
          purchaseUnit: { select: { id: true, unitName: true } },
          saleUnit: { select: { id: true, unitName: true } },
          cost: true,
          price: true,
          qty: true,
          alertQty: true,
          tax: { select: { id: true, name: true } },
          taxMethod: true,
          status: true,
          createdAt: true,
        },
      });
    });
  }

  /**
   * Bulk delete product by ids
   * @param ids
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, image: true },
      });

      const foundIds = products.map((p) => p.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No products found for the given IDs.');

      const [warehouseProducts, purchaseProducts, saleProducts] =
        await Promise.all([
          prisma.warehouseProduct.groupBy({
            by: ['productId'],
            where: { productId: { in: foundIds } },
            _count: true,
          }),
          prisma.purchaseProduct.groupBy({
            by: ['productId'],
            where: { productId: { in: foundIds } },
            _count: true,
          }),
          prisma.saleProduct.groupBy({
            by: ['productId'],
            where: { productId: { in: foundIds } },
            _count: true,
          }),
        ]);

      const conflictMap = new Map<number, string[]>();

      const addConflict = (productId: number | null, label: string) => {
        if (!productId) return;
        if (!conflictMap.has(productId)) conflictMap.set(productId, []);
        conflictMap.get(productId)!.push(label);
      };

      warehouseProducts.forEach((wp) =>
        addConflict(wp.productId, `${wp._count} warehouse(s)`),
      );
      purchaseProducts.forEach((pp) =>
        addConflict(pp.productId, `${pp._count} purchase(s)`),
      );
      saleProducts.forEach((sp) =>
        addConflict(sp.productId, `${sp._count} sale(s)`),
      );

      const deletableIds = foundIds.filter((id) => !conflictMap.has(id));
      const deletableProducts = products.filter((p) =>
        deletableIds.includes(p.id),
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
          message: 'No products could be deleted.',
          skipped: skippedIds,
        });

      await Promise.all(
        deletableProducts.map((p) => deleteOldFile(p.image ?? null)),
      );

      const result = await prisma.product.deleteMany({
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
