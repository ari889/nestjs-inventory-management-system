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
import { AttendancesService } from './attendances.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  type AttendanceDto,
  AttendanceSchema,
} from './schemas/attendance.schema';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type AttendanceQueryDto,
  AttendanceQuerySchema,
} from './schemas/attendance-query.schema';

const attendanceProperties = {
  id: { type: 'number', example: 1 },
  employee: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'John Doe' },
    },
  },
  checkIn: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
  checkOut: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
  date: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
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
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  /**
   * Get all attendance
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param employeeId
   * @param status
   * @param createdBy
   * @returns Attendance[]
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
    name: 'status',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Please enter date looks like this format yyyy-MM-dd',
  })
  @ApiOkResponse({
    description: 'Attendance fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Attendance fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: attendanceProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('attendance-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(AttendanceQuerySchema))
    query: AttendanceQueryDto,
  ) {
    const attendance = await this.attendancesService.findAll(query);
    return {
      success: true,
      message: 'Attendance fetched successfully!',
      data: attendance,
    };
  }

  /**
   * Get attendance by id
   * @param id
   * @returns Attendance
   */
  @ApiOkResponse({
    description: 'Get single attendance successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Attendance fetched successfully!',
        },
        data: {
          type: 'object',
          properties: attendanceProperties,
        },
      },
    },
  })
  @Permission('attendance-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const attendance = await this.attendancesService.findOne(id);
    if (!attendance) throw new NotFoundException('Attendance not found.');
    return {
      success: true,
      message: 'Attendance fetched successfully!',
      data: attendance,
    };
  }

  /**
   * Create attendance
   * @param attendanceDto
   * @returns Attendance
   */

  @ApiOkResponse({
    description: 'Attendance created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Attendance created successfully!',
        },
        data: {
          type: 'array',
          properties: attendanceProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['employeeId', 'date', 'checkIn', 'status'],
      properties: {
        employeeId: {
          type: 'number',
          example: 1,
        },
        date: {
          type: 'string',
          example: '2021-01-01T00:00:00.000Z',
        },
        checkIn: {
          type: 'string',
          example: '2021-01-01T00:00:00.000Z',
        },
        checkOut: {
          type: 'string',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('attendance-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(AttendanceSchema))
    attendanceDto: AttendanceDto,
    @Req() req: FastifyRequest,
  ) {
    const attendance = await this.attendancesService.create(
      attendanceDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Attendance created successfully!',
      data: attendance,
    };
  }

  /**
   * Update Attendance by id
   * @param id
   * @param departmedentDto
   * @returns Attendance
   */
  @ApiOkResponse({
    description: 'Attendance updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Attendance updated successfully!',
        },
        data: {
          type: 'object ',
          properties: attendanceProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['employeeId', 'date', 'checkIn', 'checkOut', 'status'],
      properties: {
        employeeId: {
          type: 'number',
          example: 1,
        },
        date: {
          type: 'string',
          example: '2021-01-01T00:00:00.000Z',
        },
        checkIn: {
          type: 'string',
          example: '2021-01-01T00:00:00.000Z',
        },
        checkOut: {
          type: 'string',
          example: '2021-01-01T00:00:00.000Z',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('attendance-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(AttendanceSchema))
    attendanceDto: AttendanceDto,
    @Req() req: FastifyRequest,
  ) {
    const attendance = await this.attendancesService.update(
      id,
      attendanceDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Attendance updated successfully!',
      data: attendance,
    };
  }

  /**
   * Delete attendance by id
   * @param id
   * @returns Attendance
   */
  @ApiOkResponse({
    description: 'Attendance deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Attendance fetched successfully!',
        },
        data: {
          type: 'object',
          properties: attendanceProperties,
        },
      },
    },
  })
  @Permission('attendance-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const attendance = await this.attendancesService.remove(id);
    return {
      success: true,
      message: 'Attendance deleted successfully!',
      data: attendance,
    };
  }

  /**
   * Bulk attendance categories
   * @param body
   * @returns { count: number }
   */
  @ApiOkResponse({
    description: 'Attendances bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Attendances deleted successfully!',
        },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('attendance-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.attendancesService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Attendances deleted successfully!',
      data: data,
    };
  }
}
