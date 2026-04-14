import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HRMSettingDto } from './schemas/hrm-setting.schema';
import { HrmSetting } from 'src/generated/prisma/client';

@Injectable()
export class HrmSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find HRM Setting by id
   * @param id
   * @returns HrmSetting
   */
  async findOne(): Promise<Omit<HrmSetting, 'createdBy' | 'updatedBy'> | null> {
    const hrmsetting = await this.prisma.hrmSetting.findFirst({
      orderBy: { id: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return hrmsetting;
  }

  /**
   * Create or update hrm setting
   * @param dto
   * @returns HRMSetting
   */
  async create(dto: HRMSettingDto, creatorEmail: string) {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: { id: true },
    });

    if (!creator) {
      throw new NotFoundException('Creator user not found!');
    }

    const existing = await this.prisma.hrmSetting.findFirst({
      orderBy: { id: 'asc' },
    });

    if (existing) {
      return this.prisma.hrmSetting.update({
        where: { id: existing.id },
        data: {
          ...dto,
          updatedBy: creator.id,
        },
      });
    }

    return this.prisma.hrmSetting.create({
      data: {
        ...dto,
        createdBy: creator.id,
      },
    });
  }
}
