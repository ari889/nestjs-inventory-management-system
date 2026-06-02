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
import { CustomersService } from './customers.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { type CustomerDto, CustomerSchema } from './schemas/customer.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { FastifyRequest } from 'fastify';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';

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
   * @returns Customer
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
                properties: {
                  id: { type: 'number', example: 1 },
                  customerGroupId: { type: 'number', example: 1 },
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
  @Permission('customer-access')
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
    const customers = await this.customersService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
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
          properties: {
            id: { type: 'number', example: 1 },
            customerGroupId: { type: 'number', example: 1 },
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
          properties: {
            id: { type: 'number', example: 1 },
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
          properties: {
            id: { type: 'number', example: 1 },
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
          properties: {
            id: { type: 'number', example: 1 },
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
  @Permission('customer-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BlukDeleteIdsDto) {
    const data = await this.customersService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Customers deleted successfully!',
      data: data,
    };
  }
}
