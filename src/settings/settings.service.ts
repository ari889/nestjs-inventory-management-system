import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { SettingsSchemaType } from './schemas/settings.schema';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { Setting } from 'src/generated/prisma/client';

const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all settings as an array of { name, value } objects. Each setting is stored in the database as a separate record.
   * This allows for flexible retrieval and updating of individual settings without needing to manage a complex JSON structure.
   * The controller can transform this array into a more convenient format if needed, but the service focuses on direct database interactions.
   */
  async findAll(): Promise<Setting[]> {
    const settings = await this.prisma.setting.findMany();
    return settings;
  }

  // ── Delete old file from disk if it exists ───────────────────────────────────
  private async deleteOldFile(relativePath: string | null): Promise<void> {
    if (!relativePath) return;

    try {
      const absolutePath = join(process.cwd(), relativePath);
      await unlink(absolutePath);
    } catch {
      // File may have already been deleted or never existed — safe to ignore
    }
  }

  // ── Save new file to disk ────────────────────────────────────────────────────
  private async saveFile(
    file: MemoryStorageFile,
    folder: string,
  ): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });

    const ext = MIME_EXT_MAP[file.mimetype] ?? '';
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, file.buffer);
    return `/uploads/${folder}/${filename}`;
  }

  // ── Replace file: delete old → save new → return new URL ────────────────────
  private async replaceFile(
    file: MemoryStorageFile,
    folder: string,
    oldRelativePath: string | null,
  ): Promise<string> {
    // Delete the old file first — don't await separately to keep it sequential
    await this.deleteOldFile(oldRelativePath);
    return this.saveFile(file, folder);
  }

  async create(
    dto: SettingsSchemaType,
    logo?: MemoryStorageFile,
    favicon?: MemoryStorageFile,
  ) {
    try {
      const [existingLogo, existingFavicon] = await Promise.all([
        this.prisma.setting.findUnique({ where: { name: 'logo' } }),
        this.prisma.setting.findUnique({ where: { name: 'favicon' } }),
      ]);

      const [logoUrl, faviconUrl] = await Promise.all([
        logo
          ? this.replaceFile(logo, 'logos', existingLogo?.value ?? null)
          : (existingLogo?.value ?? null),

        favicon
          ? this.replaceFile(
              favicon,
              'favicons',
              existingFavicon?.value ?? null,
            )
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
