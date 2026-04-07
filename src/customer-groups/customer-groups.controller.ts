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
import { CustomerGroupsService } from './customer-groups.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CustomerGroupSchema } from './schemas/customer-group.schema';
import {
  BlukDeleteCustomerGroupDto,
  CustomerGroupDto,
} from './dto/customer-group.dto';
import type { FastifyRequest } from 'fastify';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('customer-groups')
export class CustomerGroupsController {
  constructor(private readonly customerGroupService: CustomerGroupsService) {}

  /**
   * Find All Warehouses
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns Warehouses
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
  @ApiOkResponse({
    description: 'Warehouses fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Warehouses fetched successfully!',
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
                  groupName: { type: 'string', example: 'Customer Group 1' },
                  percentage: { type: 'number', example: 10 },
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
  @Permission('customer-group-access')
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
  ) {
    const data = await this.customerGroupService.findAll({
      page,
      limit,
      order,
      direction,
    });
    return {
      success: true,
      message: 'Customer groups fetched successfully!',
      data,
    };
  }

  /**
   * Customer Group Details by Id
   * @param id
   * @returns CustomerGroup
   */
  @ApiOkResponse({
    description: 'Customer group fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer group fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            groupName: { type: 'string', example: 'Customer Group 1' },
            percentage: { type: 'number', example: 10 },
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
  @Permission('customer-group-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const customerGroup = await this.customerGroupService.findOne(id);
    return {
      success: true,
      message: 'Customer group fetched successfully!',
      data: customerGroup,
    };
  }

  /**
   * Create a Customer Group
   * @param createCustomerGroupDto
   * @param req
   * @returns CustomerGroup
   */
  @ApiOkResponse({
    description: 'Customer group created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer group created successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            groupName: { type: 'string', example: 'Customer Group 1' },
            percentage: { type: 'number', example: 10 },
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
      required: ['groupName', 'percentage', 'status'],
      properties: {
        groupName: { type: 'string', example: 'Customer Group 1' },
        percentage: { type: 'number', example: 10 },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('customer-group-create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(CustomerGroupSchema))
    customerGroupDto: CustomerGroupDto,
    @Req() req: FastifyRequest,
  ) {
    const customerGroup = await this.customerGroupService.create(
      customerGroupDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Customer group created successfully!',
      data: customerGroup,
    };
  }

  /**
   * Customer Group update by id
   * @param id
   * @param customerGroupDto
   * @param req
   * @returns CustomerGroup
   */
  @ApiOkResponse({
    description: 'Customer group update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            groupName: { type: 'string', example: 'Customer Group 1' },
            percentage: { type: 'number', example: 10 },
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
      required: ['groupName', 'percentage', 'status'],
      properties: {
        groupName: { type: 'string', example: 'Customer Group 1' },
        percentage: { type: 'number', example: 10 },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('customer-group-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(CustomerGroupSchema))
    customerGroupDto: CustomerGroupDto,
    @Req() req: FastifyRequest,
  ) {
    const updatorEmail = req.user?.email;
    if (!updatorEmail) {
      throw new BadRequestException('Invalid user data!');
    }
    const customerGroup = await this.customerGroupService.update(
      id,
      updatorEmail,
      customerGroupDto,
    );
    return {
      success: true,
      message: 'Customer group updated successfully',
      data: customerGroup,
    };
  }

  /**
   * Delete Customer Group by Id
   * @param id
   * @returns CustomerGroup
   */
  @ApiOkResponse({
    description: 'Customer group deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer groups deleted successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            groupName: { type: 'string', example: 'Customer Group 1' },
            percentage: { type: 'number', example: 10 },
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
  @Permission('customer-group-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const customerGroup = await this.customerGroupService.findOne(id);
    await this.customerGroupService.remove(id);
    return {
      success: true,
      message: 'Customer group deleted successfully!.',
      data: customerGroup,
    };
  }

  /**
   * Bulk delete customer groups
   * @param body
   * @returns CustomerGroups
   */
  @ApiOkResponse({
    description: 'Customer groups bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Users deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('customer-group-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@Body() body: BlukDeleteCustomerGroupDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const customerGroups = await this.customerGroupService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Customer groups deleted successfully!',
      data: customerGroups,
    };
  }
}
