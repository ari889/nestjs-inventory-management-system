import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
  }): Promise<{ items: Product[]; totalItems: number }> {
    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
              },
            },
            {
              code: {
                contains: search,
              },
            },
          ],
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
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
          tax: {
            select: {
              id: true,
              name: true,
              rate: true,
            },
          },
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
  async findOne(id: number): Promise<Omit<Product, 'createdBy' | 'updatedBy'>> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
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
        tax: {
          select: {
            id: true,
            name: true,
          },
        },
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
  ) {
    try {
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
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
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
          tax: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Product!');
    }
  }

  async update(
    id: number,
    dto: ProductDto,
    updatorEmail: string,
    image?: MemoryStorageFile,
  ) {
    try {
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
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
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
          tax: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Product!');
    }
  }

  /**
   * Delete product by Id
   * @param id
   * @returns Product
   */
  async remove(id: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, image: true },
    });

    if (!product) throw new NotFoundException('Product not found.');

    await deleteOldFile(product?.image ?? null);

    return this.prisma.product.delete({ where: { id } });
  }

  /**
   * Bulk delete product by ids
   * @param ids
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, image: true },
    });

    if (!products.length) {
      throw new NotFoundException('Products not found.');
    }

    await Promise.all(products.map((b) => deleteOldFile(b.image ?? null)));

    const result = await this.prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    return result;
  }
}
