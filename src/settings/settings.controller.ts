import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SettingsSchema, SettingsSchemaType } from './schemas/settings.schema';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { FormBody } from 'src/common/decorators/form-body.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get all settings as an array of { name, value } objects. Each setting is stored in the database as a separate record.
   * This allows for flexible retrieval and updating of individual settings without needing to manage a complex JSON structure.
   * The service returns the raw array of settings, and the controller can transform it into a more convenient format if needed.
   * @returns Setting
   */
  @ApiOkResponse({
    description: 'Settings retrieved successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Settings retrieved successfully!',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'title' },
              value: { type: 'string', example: 'Inventory Management System' },
            },
          },
        },
      },
    },
  })
  @Get()
  async findAll() {
    const settings = await this.settingsService.findAll();
    return {
      success: true,
      message: 'Settings retrieved successfully!',
      data: settings,
    };
  }

  /**
   * Update settings with optional logo and favicon uploads. The request should be multipart/form-data to allow file uploads.
   * The body contains all the settings fields, and the files are validated and processed separately. The service handles saving the files and updating the settings in the database.
   * @param body
   * @param files
   * @returns Settings updated successfully!
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'title',
        'currency_code',
        'currency_symbol',
        'currency_position',
        'timezone',
        'date_format',
        'invoice_suffix',
        'invoice_number',
        'logo',
        'favicon',
      ],
      properties: {
        title: { type: 'string', example: 'Inventory Management System' },
        address: { type: 'string', example: '123 Main Street', nullable: true },
        currency_code: { type: 'string', example: 'USD' },
        currency_symbol: { type: 'string', example: '$' },
        currency_position: { type: 'string', enum: ['prefix', 'postfix'] },
        timezone: { type: 'string', example: 'America/New_York' },
        date_format: { type: 'string', example: 'MM/DD/YYYY' },
        invoice_suffix: { type: 'string', example: 'INV-' },
        invoice_number: { type: 'string', example: '1' },
        logo: { type: 'string', format: 'binary' },
        favicon: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Settings updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Settings updated successfully!' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'title' },
              value: { type: 'string', example: 'Inventory Management System' },
            },
          },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permission('settings-create')
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'favicon', maxCount: 1 },
    ]),
  )
  async create(
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      logo?: MemoryStorageFile[];
      favicon?: MemoryStorageFile[];
    },
  ) {
    const validated = new ZodValidationPipe(SettingsSchema).transform({
      ...body,
      logo: files.logo?.[0],
      favicon: files.favicon?.[0],
    }) as SettingsSchemaType;

    const setting = await this.settingsService.create(
      validated,
      validated.logo,
      validated.favicon,
    );

    return {
      success: true,
      message: 'Settings updated successfully!',
      data: setting,
    };
  }
}
