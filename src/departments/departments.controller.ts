import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
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
import {
  type DepartmentDto,
  DepartmentSchema,
} from './schemas/department.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type DepartmentQueryDto,
  DepartmentQuerySchema,
} from './schemas/department-query.schema';

const departmentProperties = {
  id: { type: 'number', example: 1 },
  name: { type: 'string', example: 'John Doe' },
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
    example: '2021-01-01T00:00:00.000Z',
  },
};

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
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['asc', 'desc'],
    schema: {
      default: 'desc',
      enum: ['asc', 'desc'],
    },
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
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: Number,
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
                properties: departmentProperties,
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
    @Query(new ZodValidationPipe(DepartmentQuerySchema))
    query: DepartmentQueryDto,
  ) {
    const departments = await this.departmentsService.findAll(query);
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
          properties: departmentProperties,
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
          properties: departmentProperties,
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
          properties: departmentProperties,
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
          properties: departmentProperties,
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
