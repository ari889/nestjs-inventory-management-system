import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Brand } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BrandDto } from './schemas/brand.schema';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import {
  deleteOldFile,
  replaceFile,
  saveFile,
} from 'src/common/fileUpload/fileHelper';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { BrandQueryDto } from './schemas/brand-query.schema';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All Brands
   * @param param0
   * @returns Brand[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search = '',
    status = undefined,
  }: BrandQueryDto): Promise<{
    items: Array<Omit<Brand, 'createdBy' | 'updatedBy' | 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        title: { contains: search },
      }),
      ...(status !== undefined && { status }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          title: true,
          image: true,
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
      this.prisma.brand.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Brand find by id
   * @param id
   * @returns Brand
   */
  async findOne(
    id: number,
  ): Promise<Omit<Brand, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        image: true,
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
    if (!brand) throw new NotFoundException('Brand not found.');
    return brand;
  }

  /**
   * Create or update brand
   * @param dto
   * @param image
   * @returns Brand
   */
  async create(
    dto: BrandDto,
    creatorEmail: string,
    image?: MemoryStorageFile,
  ): Promise<Omit<Brand, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    try {
      const creator = await this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      });

      if (!creator) throw new NotFoundException('Creator user not found!');
      const payload: Omit<Brand, 'createdAt' | 'updatedAt' | 'id'> = {
        title: dto.title,
        status: dto.status,
        image: null,
        createdBy: creator.id,
        updatedBy: creator.id,
      };

      if (image) {
        const imageUrl = await saveFile(image, 'brands');
        payload.image = imageUrl;
      }

      return this.prisma.brand.create({
        data: payload,
        select: {
          id: true,
          title: true,
          image: true,
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
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Brand!');
    }
  }

  async update(
    id: number,
    dto: BrandDto,
    updatorEmail: string,
    image?: MemoryStorageFile,
  ): Promise<Omit<Brand, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    try {
      const [brand, updator] = await Promise.all([
        this.prisma.brand.findUnique({
          where: { id },
          select: { id: true, title: true, image: true, status: true },
        }),
        this.prisma.user.findUnique({
          where: { email: updatorEmail },
          select: { id: true },
        }),
      ]);

      if (!updator) throw new NotFoundException('Creator user not found!');

      if (!brand) throw new NotFoundException('Brand not found!');

      let imageUrl: string | null = brand?.image ?? null;

      if (image) {
        imageUrl = await replaceFile(image, 'brands', brand?.image ?? null);
      }

      const payload: Omit<
        Brand,
        'createdAt' | 'updatedAt' | 'id' | 'createdBy'
      > = {
        title: dto.title,
        status: dto.status,
        image: imageUrl,
        updatedBy: updator.id,
      };

      return this.prisma.brand.update({
        where: { id },
        data: payload,
        select: {
          id: true,
          title: true,
          image: true,
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
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Brand!');
    }
  }

  /**
   * Delete brand by Id
   * @param id
   * @returns Brand
   */
  async remove(id: number): Promise<Brand> {
    return this.prisma.$transaction(async (prisma) => {
      const brand = await prisma.brand.findUnique({
        where: { id },
        select: { id: true, image: true },
      });

      if (!brand) throw new NotFoundException('Brand not found.');

      const productCount = await prisma.product.count({
        where: { brandId: id },
      });

      if (productCount > 0)
        throw new ConflictException(
          `Cannot delete brand. It is assigned to ${productCount} product(s).`,
        );

      await deleteOldFile(brand.image ?? null);

      return prisma.brand.delete({ where: { id } });
    });
  }

  /**
   * Bulk delete brand by ids
   * @param ids
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const brands = await prisma.brand.findMany({
        where: { id: { in: ids } },
        select: { id: true, image: true },
      });

      const foundIds = brands.map((b) => b.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No brands found for the given IDs.');

      const products = await prisma.product.groupBy({
        by: ['brandId'],
        where: { brandId: { in: foundIds } },
        _count: true,
      });

      const conflictMap = new Map<number, string[]>();
      products.forEach((p) =>
        conflictMap.set(p.brandId!, [`${p._count} product(s)`]),
      );

      const deletableIds = foundIds.filter((id) => !conflictMap.has(id));
      const deletableBrands = brands.filter((b) => deletableIds.includes(b.id));

      const skippedIds = [
        ...notFoundIds.map((id) => ({ id, reasons: ['Not found'] })),
        ...Array.from(conflictMap.entries()).map(([id, reasons]) => ({
          id,
          reasons,
        })),
      ];

      if (deletableIds.length === 0)
        throw new ConflictException({
          message: 'No brands could be deleted.',
          skipped: skippedIds,
        });

      await Promise.all(
        deletableBrands.map((b) => deleteOldFile(b.image ?? null)),
      );

      const result = await prisma.brand.deleteMany({
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
