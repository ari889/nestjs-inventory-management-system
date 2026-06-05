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
import { CustomersService } from './customers.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { type CustomerDto, CustomerSchema } from './schemas/customer.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type CustomerQueryDto,
  CustomerQuerySchema,
} from './schemas/customer-query.schema';

const customerProperties = {
  id: { type: 'number', example: 1 },
  customerGroup: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Customer Group 1' },
    },
  },
  name: { type: 'string', example: 'Customer 1' },
  companyName: { type: 'string', example: 'Company 1' },
  vatNumber: { type: 'string', example: '1234567890' },
  email: { type: 'string', example: 'supplier1@example.com' },
  phone: { type: 'string', example: '1234567890' },
  address: { type: 'string', example: '123 Main St' },
  city: { type: 'string', example: 'New York' },
  state: { type: 'string', example: 'NY' },
  postalCode: { type: 'string', example: '10001' },
  country: { type: 'string', example: 'USA' },
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
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Get all customers
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @param status
   * @param createdBy
   * @param customerGroupId
   * @returns Customer
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
  @ApiQuery({
    name: 'customerGroupId',
    required: false,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Customer fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Customers fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: customerProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('customer-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(CustomerQuerySchema))
    query: CustomerQueryDto,
  ) {
    const customers = await this.customersService.findAll(query);
    return {
      success: true,
      message: 'Customers fetched successfully!',
      data: customers,
    };
  }

  /**
   * Get customer by id
   * @param id
   * @returns Customer
   */
  @ApiOkResponse({
    description: 'Get single customer successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer fetched successfully!',
        },
        data: {
          type: 'object',
          properties: customerProperties,
        },
      },
    },
  })
  @Permission('customer-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.customersService.findOne(id);
    if (!customer) throw new NotFoundException('Customer not found.');
    return {
      success: true,
      message: 'Customer fetched successfully!',
      data: customer,
    };
  }

  /**
   * Create customer
   * @param CustomerDto
   * @returns Customer
   */

  @ApiOkResponse({
    description: 'Customer created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer created successfully!',
        },
        data: {
          type: 'array',
          properties: customerProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerGroupId', 'name', 'status'],
      properties: {
        customerGroupId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Supplier 1' },
        companyName: { type: 'string', example: 'Company 1' },
        vatNumber: { type: 'string', example: '1234567890' },
        email: { type: 'string', example: 'supplier1@example.com' },
        phone: { type: 'string', example: '1234567890' },
        address: { type: 'string', example: '123 Main St' },
        city: { type: 'string', example: 'New York' },
        state: { type: 'string', example: 'NY' },
        postalCode: { type: 'string', example: '10001' },
        country: { type: 'string', example: 'USA' },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('customer-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(CustomerSchema))
    customerDto: CustomerDto,
    @Req() req: FastifyRequest,
  ) {
    const customer = await this.customersService.create(
      customerDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Customer created successfully!',
      data: customer,
    };
  }

  /**
   * Update customer by id
   * @param id
   * @param customerDto
   * @returns Customer
   */
  @ApiOkResponse({
    description: 'Customer updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer updated successfully!',
        },
        data: {
          type: 'object ',
          properties: customerProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerGroupId', 'name', 'status'],
      properties: {
        customerGroupId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Customer 1' },
        companyName: { type: 'string', example: 'Company 1' },
        vatNumber: { type: 'string', example: '1234567890' },
        email: { type: 'string', example: 'customer1@example.com' },
        phone: { type: 'string', example: '1234567890' },
        address: { type: 'string', example: '123 Main St' },
        city: { type: 'string', example: 'New York' },
        state: { type: 'string', example: 'NY' },
        postalCode: { type: 'string', example: '10001' },
        country: { type: 'string', example: 'USA' },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('customer-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(CustomerSchema))
    customerDto: CustomerDto,
    @Req() req: FastifyRequest,
  ) {
    const customer = await this.customersService.update(
      id,
      customerDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Customer updated successfully!',
      data: customer,
    };
  }

  /**
   * Delete customer by id
   * @param id
   * @returns Customer
   */
  @ApiOkResponse({
    description: 'Customer deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer fetched successfully!',
        },
        data: {
          type: 'object',
          properties: customerProperties,
        },
      },
    },
  })
  @Permission('customer-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.customersService.remove(id);
    return {
      success: true,
      message: 'Customer deleted successfully!',
      data: customer,
    };
  }

  /**
   * Bulk Delete customers
   * @param body
   * @returns Customer
   */
  @ApiOkResponse({
    description: 'Customers bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Customers deleted successfully!' },
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
  @Permission('customer-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.customersService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Customers deleted successfully!',
      data: data,
    };
  }
}
