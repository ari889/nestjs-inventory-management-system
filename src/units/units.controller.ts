import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type UnitDto, UnitSchema } from './schemas/units.schemas';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type UnitQueryDto,
  UnitQuerySchema,
} from './schemas/unit-query.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

const unitProperties = {
  id: { type: 'number', example: 1 },
  unitCode: { type: 'string', example: 'tax1' },
  unitName: { type: 'string', example: 'Tax 1' },
  baseUnit: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      unitCode: { type: 'string', example: 'tax1' },
      unitName: { type: 'string', example: 'Tax 1' },
    },
  },
  operator: { type: 'string', example: '*' },
  operationValue: { type: 'number', example: 1 },
  status: { type: 'boolean', example: true },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}
  /**
   * Find All Units with pagination and sorting
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @param status
   * @param unitId
   * @param createdBy
   * @returns Unit[]
   */
  @ApiQuery({
    name: 'order',
    required: false,
    example: 'id',
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'test',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'baseUnitId',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Units fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Units fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: unitProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('unit-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(UnitQuerySchema))
    query: UnitQueryDto,
  ) {
    const data = await this.unitsService.findAll(query);
    return {
      success: true,
      message: 'Taxes fetched successfully!',
      data,
    };
  }

  /**
   * Unit Details by Id
   * @param id
   * @returns Unit
   */
  @ApiOkResponse({
    description: 'Unit fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Unit fetched successfully!',
        },
        data: {
          type: 'object',
          properties: unitProperties,
        },
      },
    },
  })
  @Permission('unit-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const unit = await this.unitsService.findOne(id);
    return {
      success: true,
      message: 'Unit fetched successfully!',
      data: unit,
    };
  }

  /**
   * Create a Unit
   * @param createUnitDto
   * @param req
   * @returns Unit
   */
  @ApiOkResponse({
    description: 'Unit created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Unit created successfully!',
        },
        data: {
          type: 'object',
          properties: unitProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'unitCode',
        'unitName',
        'baseUnitId',
        'operator',
        'operationValue',
        'status',
      ],
      properties: {
        unitCode: { type: 'string', example: 'UNIT-001' },
        unitName: { type: 'string', example: 'Unit 1' },
        baseUnitId: { type: 'number', example: 1 },
        operator: { type: 'string', example: '*' },
        operationValue: { type: 'number', example: 10 },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('unit-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(UnitSchema))
    unitDto: UnitDto,
    @Req() req: FastifyRequest,
  ) {
    const unit = await this.unitsService.create(unitDto, req?.user?.email);
    return {
      success: true,
      message: 'Unit created successfully!',
      data: unit,
    };
  }

  /**
   * Unit update by id
   * @param id
   * @param unitDto
   * @param req
   * @returns Unit
   */
  @ApiOkResponse({
    description: 'Unit update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: unitProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'unitCode',
        'unitName',
        'baseUnitId',
        'operator',
        'operationValue',
        'status',
      ],
      properties: {
        unitCode: { type: 'string', example: 'UNIT-001' },
        unitName: { type: 'string', example: 'Unit 1' },
        baseUnitId: { type: 'number', example: 1 },
        operator: { type: 'string', example: '*' },
        operationValue: { type: 'number', example: 10 },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('unit-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(UnitSchema))
    unitDto: UnitDto,
    @Req() req: FastifyRequest,
  ) {
    const updatorEmail = req.user?.email;
    if (!updatorEmail) {
      throw new BadRequestException('Invalid user data!');
    }
    const unit = await this.unitsService.update(id, updatorEmail, unitDto);
    return {
      success: true,
      message: 'Unit updated successfully',
      data: unit,
    };
  }

  /**
   * Delete Unit by Id
   * @param id
   * @returns Unit
   */
  @ApiOkResponse({
    description: 'Unit deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Units deleted successfully!',
        },
        data: {
          type: 'object',
          properties: unitProperties,
        },
      },
    },
  })
  @Permission('unit-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const unit = await this.unitsService.findOne(id);
    await this.unitsService.remove(id);
    return {
      success: true,
      message: 'Unit deleted successfully!.',
      data: unit,
    };
  }

  /**
   * Bulk delete units
   * @param body
   * @returns Units
   */
  @ApiOkResponse({
    description: 'Units bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Units deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
        },
      },
    },
  })
  @Permission('unit-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const units = await this.unitsService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Units deleted successfully!',
      data: units,
    };
  }
}
