import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permission } from 'src/common/decorators/permission.decorator';
import { HrmSettingsService } from './hrm-settings.service';
import {
  type HRMSettingDto,
  HRMSettingSchema,
} from './schemas/hrm-setting.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { FastifyRequest } from 'fastify';
import { FormBody } from 'src/common/decorators/form-body.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('hrm-settings')
export class HrmSettingsController {
  constructor(private readonly hrmSettingsService: HrmSettingsService) {}
  /**
   * Find hrm setting
   * @param id
   * @returns HRMSetting
   */
  @ApiOkResponse({
    description: 'HRM Setting fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'HRM Setting fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            checkIn: { type: 'string', example: '2021-01-01T00:00:00.000Z' },
            checkOut: { type: 'string', example: '2021-01-01T00:00:00.000Z' },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John' },
              },
            },
            updator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John' },
              },
            },
            createdAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Permission('hrm-setting-view')
  @Get()
  async find() {
    const hrmsetting = await this.hrmSettingsService.findOne();
    return {
      success: true,
      message: 'HRM Setting fetched successfully!',
      data: hrmsetting,
    };
  }

  /**
   * Create or update hrm setting
   * @param hrmSettingDto
   * @param req
   * @returns HRMSetting
   */
  @ApiOkResponse({
    description: 'Menus created successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Menus created successfully!' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            menuName: { type: 'string', example: 'Menu 1' },
            deletable: { type: 'boolean', example: true },
            createdAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Permission('hrm-setting-create')
  @Post()
  async createMenu(
    @FormBody(new ZodValidationPipe(HRMSettingSchema))
    hrmSettingDto: HRMSettingDto,
    @Req() req: FastifyRequest,
  ) {
    const creatorEmail = req?.user?.email;
    const hrmsetting = await this.hrmSettingsService.create(
      hrmSettingDto,
      creatorEmail,
    );
    return {
      success: true,
      message: 'HRM Setting created successfully!',
      data: hrmsetting,
    };
  }
}
