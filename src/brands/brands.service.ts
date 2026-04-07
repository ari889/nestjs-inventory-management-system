import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Brand } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlukDeleteBrandDto } from './dto/brand.dto';
import { BrandSchemaType } from './schemas/brand.schema';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { replaceFile, saveFile } from 'src/common/fileUpload/fileHelper';

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
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
  }): Promise<{ items: Brand[]; totalItems: number }> {
    const [items, totalItems] = await Promise.all([
      this.prisma.brand.findMany({
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
      this.prisma.brand.count(),
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
  async findOne(id: number): Promise<Omit<Brand, 'createdBy' | 'updatedBy'>> {
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
    dto: BrandSchemaType,
    creatorEmail: string,
    image?: MemoryStorageFile,
  ) {
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
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Brand!');
    }
  }

  async update(
    id: number,
    dto: BrandSchemaType,
    updatorEmail: string,
    image?: MemoryStorageFile,
  ) {
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
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
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
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!brand) throw new NotFoundException('Customer Group not found.');

    return this.prisma.brand.delete({ where: { id } });
  }

  /**
   * Bulk delete brand by ids
   * @param ids
   * @returns brand
   */
  async bulkDelete(ids: BlukDeleteBrandDto['ids']): Promise<{ count: number }> {
    return this.prisma.brand.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
