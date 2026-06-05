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
import { TaxesService } from './taxes.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type TaxDto, TaxSchema } from './schemas/taxes.schema';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import { type TaxQueryDto, TaxQuerySchema } from './schemas/tax-query.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

const taxProperties = {
  id: { type: 'number', example: 1 },
  name: { type: 'string', example: 'Tax 1' },
  rate: { type: 'number', example: 10 },
  status: { type: 'boolean', example: true },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
  creator: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'John Doe' },
    },
  },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}
  /**
   * Find All Taxes with pagination and sorting
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns Tax[]
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
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
  })
  @ApiOkResponse({
    description: 'Taxes fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Taxes fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: taxProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('tax-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(TaxQuerySchema))
    query: TaxQueryDto,
  ) {
    const data = await this.taxesService.findAll(query);
    return {
      success: true,
      message: 'Taxes fetched successfully!',
      data,
    };
  }

  /**
   * Tax Details by Id
   * @param id
   * @returns Tax
   */
  @ApiOkResponse({
    description: 'Tax fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Tax fetched successfully!',
        },
        data: {
          type: 'object',
          properties: taxProperties,
        },
      },
    },
  })
  @Permission('tax-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const tax = await this.taxesService.findOne(id);
    return {
      success: true,
      message: 'Tax fetched successfully!',
      data: tax,
    };
  }

  /**
   * Create a Tax
   * @param createTaxDto
   * @param req
   * @returns Tax
   */
  @ApiOkResponse({
    description: 'Tax created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Tax created successfully!',
        },
        data: {
          type: 'object',
          properties: taxProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'rate', 'status'],
      properties: {
        name: { type: 'string', example: 'Tax 1' },
        rate: { type: 'number', example: 10 },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('tax-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(TaxSchema))
    taxDto: TaxDto,
    @Req() req: FastifyRequest,
  ) {
    const tax = await this.taxesService.create(taxDto, req?.user?.email);
    return {
      success: true,
      message: 'Tax created successfully!',
      data: tax,
    };
  }

  /**
   * Tax update by id
   * @param id
   * @param taxDto
   * @param req
   * @returns Tax
   */
  @ApiOkResponse({
    description: 'Tax update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: taxProperties,
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
  @Permission('tax-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(TaxSchema))
    taxDto: TaxDto,
    @Req() req: FastifyRequest,
  ) {
    const updatorEmail = req.user?.email;
    if (!updatorEmail) {
      throw new BadRequestException('Invalid user data!');
    }
    const tax = await this.taxesService.update(id, updatorEmail, taxDto);
    return {
      success: true,
      message: 'Tax updated successfully',
      data: tax,
    };
  }

  /**
   * Delete Tax by Id
   * @param id
   * @returns Tax
   */
  @ApiOkResponse({
    description: 'Tax deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Taxes deleted successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Tax 1' },
            rate: { type: 'number', example: 10 },
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
  @Permission('tax-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const tax = await this.taxesService.findOne(id);
    await this.taxesService.remove(id);
    return {
      success: true,
      message: 'Tax deleted successfully!.',
      data: tax,
    };
  }

  /**
   * Bulk delete taxes
   * @param body
   * @returns Taxes
   */
  @ApiOkResponse({
    description: 'Taxes bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Taxes deleted successfully!' },
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
  @Permission('tax-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const taxes = await this.taxesService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Taxes deleted successfully!',
      data: taxes,
    };
  }
}
