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
import { SuppliersService } from './suppliers.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type SupplierDto, SupplierSchema } from './schemas/supplier.schema';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * Get all suppliers
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @returns Supplier
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
    description: 'Supplier fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Suppliers fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
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
  @Permission('supplier-access')
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
    const suppliers = await this.suppliersService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
    return {
      success: true,
      message: 'Suppliers fetched successfully!',
      data: suppliers,
    };
  }

  /**
   * Get supplier by id
   * @param id
   * @returns Supplier
   */
  @ApiOkResponse({
    description: 'Get single supplier successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Supplier fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
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
  @Permission('supplier-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.suppliersService.findOne(id);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return {
      success: true,
      message: 'Supplier fetched successfully!',
      data: supplier,
    };
  }

  /**
   * Create Supplier
   * @param SupplierDto
   * @returns Supplier
   */

  @ApiOkResponse({
    description: 'Supplier created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Supplier created successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
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
  @Permission('supplier-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(SupplierSchema))
    supplierDto: SupplierDto,
    @Req() req: FastifyRequest,
  ) {
    const supplier = await this.suppliersService.create(
      supplierDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Supplier created successfully!',
      data: supplier,
    };
  }

  /**
   * Update permission by id
   * @param id
   * @param permissionDto
   * @returns Permission
   */
  @ApiOkResponse({
    description: 'Permission updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Permission updated successfully!',
        },
        data: {
          type: 'object ',
          properties: {
            id: { type: 'number', example: 1 },
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
  @Permission('supplier-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(SupplierSchema))
    supplierDto: SupplierDto,
    @Req() req: FastifyRequest,
  ) {
    const supplier = await this.suppliersService.update(
      id,
      supplierDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Supplier updated successfully!',
      data: supplier,
    };
  }

  /**
   * Delete supplier by id
   * @param id
   * @returns Supplier
   */
  @ApiOkResponse({
    description: 'Supplier deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Supplier fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
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
  @Permission('supplier-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.suppliersService.remove(id);
    return {
      success: true,
      message: 'Supplier deleted successfully!',
      data: supplier,
    };
  }

  /**
   * Bulk Delete suppliers
   * @param body
   * @returns Supplier
   */
  @ApiOkResponse({
    description: 'Suppliers bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Suppliers deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('supplier-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.suppliersService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Suppliers deleted successfully!',
      data: data,
    };
  }
}
