import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
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
import { SortDirection } from 'src/@types/default.types';
import { BlukDeleteUnitDto, UnitDto } from './dto/unit.dto';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { UnitSchema } from './schemas/units.schemas';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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
                properties: {
                  id: { type: 'number', example: 1 },
                  unitCode: { type: 'string', example: 'tax1' },
                  unitName: { type: 'string', example: 'Tax 1' },
                  baseUnitId: { type: 'number', example: 1 },
                  operator: { type: 'string', example: '*' },
                  operationValue: { type: 'number', example: 1 },
                  status: { type: 'boolean', example: true },
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
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('unit-access')
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
    @Query('search') search?: string,
  ) {
    const data = await this.unitsService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
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
          properties: {
            id: { type: 'number', example: 1 },
            unitCode: { type: 'string', example: 'Tax 1' },
            unitName: { type: 'string', example: 'Tax 1' },
            baseUnitId: { type: 'number', example: 1 },
            operator: { type: 'string', example: '*' },
            operationValue: { type: 'number', example: 1 },
            status: { type: 'boolean', example: true },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John Doe' },
              },
            },
            updator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John Doe' },
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
          properties: {
            id: { type: 'number', example: 1 },
            unitCode: { type: 'string', example: 'UNIT-001' },
            unitName: { type: 'string', example: 'Unit 1' },
            baseUnitId: { type: 'number', example: 1 },
            operator: { type: 'string', example: '*' },
            operationValue: { type: 'number', example: 10 },
            status: { type: 'boolean', example: true },
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
    @Body(new ZodValidationPipe(UnitSchema))
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
          properties: {
            id: { type: 'number', example: 1 },
            unitName: { type: 'string', example: 'Unit 1' },
            unitCode: { type: 'string', example: 'UNIT-001' },
            baseUnitId: { type: 'number', example: 1 },
            operator: { type: 'string', example: '*' },
            operationValue: { type: 'number', example: 10 },
            status: { type: 'boolean', example: true },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John Doe' },
              },
            },
            createdAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
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
    @Body(new ZodValidationPipe(UnitSchema))
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
          properties: {
            id: { type: 'number', example: 1 },
            unitName: { type: 'string', example: 'Unit 1' },
            unitCode: { type: 'string', example: 'UNIT-001' },
            baseUnitId: { type: 'number', example: 1 },
            operator: { type: 'string', example: '*' },
            operationValue: { type: 'number', example: 10 },
            status: { type: 'boolean', example: true },
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
  @Permission('unit-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@Body() body: BlukDeleteUnitDto) {
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
