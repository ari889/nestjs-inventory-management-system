import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { SettingsSchemaType } from './schemas/settings.schema';
import { Setting } from 'src/generated/prisma/client';
import { replaceFile } from 'src/common/fileUpload/fileHelper';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all settings as an array of { name, value } objects. Each setting is stored in the database as a separate record.
   * This allows for flexible retrieval and updating of individual settings without needing to manage a complex JSON structure.
   * The controller can transform this array into a more convenient format if needed, but the service focuses on direct database interactions.
   */
  async findAll(): Promise<Array<Omit<Setting, 'createdAt' | 'updatedAt'>>> {
    const settings = await this.prisma.setting.findMany({
      select: {
        id: true,
        name: true,
        value: true,
      },
    });
    return settings;
  }

  /**
   * Create or update settings with optional logo and favicon uploads. The service handles saving the files and updating the settings in the database.
   * It first checks for existing logo and favicon settings to determine if old files need to be deleted when replaced. Then it constructs a payload of all settings fields and performs upsert operations in a transaction to ensure atomicity.
   * @param dto
   * @param logo
   * @param favicon
   * @returns All settings
   */
  async create(
    dto: SettingsSchemaType,
    logo?: MemoryStorageFile,
    favicon?: MemoryStorageFile,
  ): Promise<Array<Omit<Setting, 'createdAt' | 'updatedAt'>>> {
    try {
      const [existingLogo, existingFavicon] = await Promise.all([
        this.prisma.setting.findUnique({ where: { name: 'logo' } }),
        this.prisma.setting.findUnique({ where: { name: 'favicon' } }),
      ]);

      const [logoUrl, faviconUrl] = await Promise.all([
        logo
          ? replaceFile(logo, 'logos', existingLogo?.value ?? null)
          : (existingLogo?.value ?? null),

        favicon
          ? replaceFile(favicon, 'favicons', existingFavicon?.value ?? null)
          : (existingFavicon?.value ?? null),
      ]);

      const payload: Record<string, string> = {
        title: dto.title,
        address: dto.address ?? '',
        currency_code: dto.currency_code,
        currency_symbol: dto.currency_symbol,
        currency_position: dto.currency_position,
        timezone: dto.timezone,
        date_format: dto.date_format,
        invoice_suffix: dto.invoice_suffix,
        invoice_number: String(dto.invoice_number),
      };

      if (logoUrl) payload.logo = logoUrl;
      if (faviconUrl) payload.favicon = faviconUrl;

      const results = await this.prisma.$transaction(
        Object.entries(payload).map(([name, value]) =>
          this.prisma.setting.upsert({
            where: { name },
            update: { value },
            create: { name, value },
            select: {
              id: true,
              name: true,
              value: true,
            },
          }),
        ),
      );

      return results;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save settings');
    }
  }
}
