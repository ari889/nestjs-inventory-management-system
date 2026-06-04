import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DepartmentsService } from './departments.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import {
  type DepartmentDto,
  DepartmentSchema,
} from './schemas/department.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Get all department
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @returns Department[]
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
    example: 'search',
  })
  @ApiOkResponse({
    description: 'Department fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Department fetched successfully!',
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
                  name: { type: 'string', example: 'John Doe' },
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
  @Permission('department-access')
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query('search') search?: string,
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
  ) {
    const departments = await this.departmentsService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
    return {
      success: true,
      message: 'Departments fetched successfully!',
      data: departments,
    };
  }

  /**
   * Get department by id
   * @param id
   * @returns Department
   */
  @ApiOkResponse({
    description: 'Get single department successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Department fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
  @Permission('department-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const department = await this.departmentsService.findOne(id);
    if (!department) throw new NotFoundException('Department not found.');
    return {
      success: true,
      message: 'Department fetched successfully!',
      data: department,
    };
  }

  /**
   * Create department
   * @param departmentDto
   * @returns Department
   */

  @ApiOkResponse({
    description: 'Department created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Department created successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
      required: ['name', 'status'],
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('department-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(DepartmentSchema))
    departmentDto: DepartmentDto,
    @Req() req: FastifyRequest,
  ) {
    const department = await this.departmentsService.create(
      departmentDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Department created successfully!',
      data: department,
    };
  }

  /**
   * Update department by id
   * @param id
   * @param departmedentDto
   * @returns Deepartment
   */
  @ApiOkResponse({
    description: 'Department updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Department updated successfully!',
        },
        data: {
          type: 'object ',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
      required: ['name', 'status'],
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('department-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(DepartmentSchema))
    departmentDto: DepartmentDto,
    @Req() req: FastifyRequest,
  ) {
    const department = await this.departmentsService.update(
      id,
      departmentDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Department updated successfully!',
      data: department,
    };
  }

  /**
   * Delete department by id
   * @param id
   * @returns Department
   */
  @ApiOkResponse({
    description: 'Department deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Department fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
  @Permission('department-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const department = await this.departmentsService.remove(id);
    return {
      success: true,
      message: 'Department deleted successfully!',
      data: department,
    };
  }

  /**
   * Bulk department categories
   * @param body
   * @returns { count: number }
   */
  @ApiOkResponse({
    description: 'Departments bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Departments deleted successfully!',
        },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('department-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.departmentsService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Departments deleted successfully!',
      data: data,
    };
  }
}
