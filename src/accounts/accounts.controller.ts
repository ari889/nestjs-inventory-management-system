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
import { AccountsService } from './accounts.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type AccountDto, AccountSchema } from './schemas/account.schema';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type AccountQueryDto,
  AccountQuerySchema,
} from './schemas/account-query.schema';

const accountProperties = {
  id: { type: 'number', example: 1 },
  accountNo: { type: 'string', example: '123456' },
  name: { type: 'string', example: 'John Doe' },
  initialBalance: { type: 'number', example: 1000 },
  note: { type: 'string', example: 'Initial balance' },
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
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  /**
   * Get all accounts
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @param status
   * @param createdBy
   * @returns Account
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
    description: 'Account fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Accounts fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: accountProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('account-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(AccountQuerySchema)) query: AccountQueryDto,
  ) {
    const accounts = await this.accountsService.findAll(query);
    return {
      success: true,
      message: 'Accounts fetched successfully!',
      data: accounts,
    };
  }

  /**
   * Get account by id
   * @param id
   * @returns Account
   */
  @ApiOkResponse({
    description: 'Get single account successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Account fetched successfully!',
        },
        data: {
          type: 'object',
          properties: accountProperties,
        },
      },
    },
  })
  @Permission('account-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const account = await this.accountsService.findOne(id);
    if (!account) throw new NotFoundException('Account not found.');
    return {
      success: true,
      message: 'Account fetched successfully!',
      data: account,
    };
  }

  /**
   * Create account
   * @param accountDto
   * @returns Account
   */

  @ApiOkResponse({
    description: 'Account created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Account created successfully!',
        },
        data: {
          type: 'object',
          properties: accountProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accountNo', 'name', 'initialBalance', 'status'],
      properties: {
        accountNo: {
          type: 'string',
          example: '123456',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        initialBalance: {
          type: 'number',
          example: 1000,
        },
        note: {
          type: 'string',
          example: 'Initial balance',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('account-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(AccountSchema))
    accountDto: AccountDto,
    @Req() req: FastifyRequest,
  ) {
    const account = await this.accountsService.create(
      accountDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Account created successfully!',
      data: account,
    };
  }

  /**
   * Update account by id
   * @param id
   * @param accountDto
   * @returns Account
   */
  @ApiOkResponse({
    description: 'Account updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Account updated successfully!',
        },
        data: {
          type: 'object',
          properties: accountProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accountNo', 'name', 'initialBalance', 'status'],
      properties: {
        accountNo: {
          type: 'string',
          example: '123456',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        initialBalance: {
          type: 'number',
          example: 1000,
        },
        note: {
          type: 'string',
          example: 'Initial balance',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('account-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(AccountSchema))
    accountDto: AccountDto,
    @Req() req: FastifyRequest,
  ) {
    const account = await this.accountsService.update(
      id,
      accountDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Supplier updated successfully!',
      data: account,
    };
  }

  /**
   * Delete account by id
   * @param id
   * @returns Account
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
          properties: accountProperties,
        },
      },
    },
  })
  @Permission('account-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const account = await this.accountsService.remove(id);
    return {
      success: true,
      message: 'Account deleted successfully!',
      data: account,
    };
  }

  /**
   * Bulk Delete accounts
   * @param body
   * @returns Account
   */
  @ApiOkResponse({
    description: 'Account bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Accounts deleted successfully!' },
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
  @Permission('account-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.accountsService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Accounts deleted successfully!',
      data: data,
    };
  }
}
