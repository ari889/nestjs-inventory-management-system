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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EmployeesService } from './employees.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify';
import { EmployeeDto, EmployeeSchema } from './schemas/employee.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type EmployeeQueryDto,
  EmployeeQuerySchema,
} from './schemas/employee-query.schema';

const employeeProperties = {
  id: { type: 'number', example: 1 },
  name: { type: 'string', example: 'Employee 1' },
  image: { type: 'string', example: '/uploads/brand/1.jpg' },
  phone: { type: 'string', example: '1234567890' },
  address: { type: 'string', example: 'Address 1' },
  city: { type: 'string', example: 'City 1' },
  state: { type: 'string', example: 'State 1' },
  zip: { type: 'string', example: '12345' },
  postalCode: { type: 'string', example: '12345' },
  country: { type: 'string', example: 'Country 1' },
  department: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Department 1' },
    },
  },
  status: { type: 'boolean', example: true },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /**
   * Find All employees
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @param createdBy
   * @param departmentId
   * @returns Employee[]
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
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Employee fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Employee fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: employeeProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('employee-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(EmployeeQuerySchema))
    query: EmployeeQueryDto,
  ) {
    const data = await this.employeesService.findAll(query);
    return {
      success: true,
      message: 'Employees fetched successfully!',
      data,
    };
  }

  /**
   * Employee Details by Id
   * @param id
   * @returns Employee
   */
  @ApiOkResponse({
    description: 'Employee fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Employee fetched successfully!',
        },
        data: {
          type: 'object',
          properties: employeeProperties,
        },
      },
    },
  })
  @Permission('employee-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const employee = await this.employeesService.findOne(id);
    return {
      success: true,
      message: 'Employee fetched successfully!',
      data: employee,
    };
  }

  /**
   * Create a employee
   * @param employeeDto
   * @param req
   * @returns Employee
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'name',
        'phone',
        'address',
        'city',
        'state',
        'zip',
        'country',
        'departmentId',
        'status',
      ],
      properties: {
        name: { type: 'string', example: 'Employee 1' },
        image: { type: 'string', format: 'binary' },
        phone: { type: 'string', example: '1234567890' },
        address: { type: 'string', example: 'Address 1' },
        city: { type: 'string', example: 'City 1' },
        state: { type: 'string', example: 'State 1' },
        zip: { type: 'string', example: '12345' },
        postalCode: { type: 'string', example: '12345' },
        country: { type: 'string', example: 'Country 1' },
        departmentId: { type: 'number', example: 1 },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @ApiOkResponse({
    description: 'Employee created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Employee created successfully!',
        },
        data: {
          type: 'object',
          properties: employeeProperties,
        },
      },
    },
  })
  @Permission('employee-create')
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async create(
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      image?: MemoryStorageFile[];
    },
    @Req() req: FastifyRequest,
  ) {
    const creatorEmail = req?.user?.email;
    const validated = new ZodValidationPipe(EmployeeSchema).transform({
      ...body,
      status: body.status === 'true' || body.status === true,
      image: files.image?.[0],
    }) as EmployeeDto;

    const employee = await this.employeesService.create(
      validated,
      creatorEmail,
      validated.image,
    );

    return {
      success: true,
      message: 'Employee created successfully!',
      data: employee,
    };
  }

  /**
   * Employee update by id
   * @param id
   * @param employeeDto
   * @param req
   * @returns Employee
   */
  @ApiOkResponse({
    description: 'Employee update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: employeeProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'name',
        'phone',
        'address',
        'city',
        'state',
        'zip',
        'country',
        'departmentId',
        'status',
      ],
      properties: {
        name: { type: 'string', example: 'Employee 1' },
        image: { type: 'string', format: 'binary' },
        phone: { type: 'string', example: '1234567890' },
        address: { type: 'string', example: 'Address 1' },
        city: { type: 'string', example: 'City 1' },
        state: { type: 'string', example: 'State 1' },
        zip: { type: 'string', example: '12345' },
        postalCode: { type: 'string', example: '12345' },
        country: { type: 'string', example: 'Country 1' },
        departmentId: { type: 'number', example: 1 },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('employee-edit')
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      image?: MemoryStorageFile[];
    },
    @Req() req: FastifyRequest,
  ) {
    const validated = new ZodValidationPipe(EmployeeSchema).transform({
      ...body,
      status: body.status === 'true' || body.status === true,
      image: files.image?.[0],
    }) as EmployeeDto;
    const employee = await this.employeesService.update(
      id,
      validated,
      req?.user?.email,
      validated.image,
    );
    return {
      success: true,
      message: 'Employee updated successfully!',
      data: employee,
    };
  }

  /**
   * Delete employee by Id
   * @param id
   * @returns Employee
   */
  @ApiOkResponse({
    description: 'Employee deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Employees deleted successfully!',
        },
        data: {
          type: 'object',
          properties: employeeProperties,
        },
      },
    },
  })
  @Permission('employee-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const employee = await this.employeesService.findOne(id);
    await this.employeesService.remove(id);
    return {
      success: true,
      message: 'Employee deleted successfully!.',
      data: employee,
    };
  }

  /**
   * Bulk delete employees
   * @param body
   * @returns Employee
   */
  @ApiOkResponse({
    description: 'Employee bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Empoyee deleted successfully!' },
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
  @Permission('employee-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const empoyee = await this.employeesService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Empoyee deleted successfully!',
      data: empoyee,
    };
  }
}
