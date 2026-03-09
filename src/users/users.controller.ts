import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User fetched generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @Get()
  async getUsers() {
    const users = await this.usersService.user();
    return {
      success: true,
      message: 'Users fetched successfully',
      data: users,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User fetched generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                roleName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @Get(':email')
  async getUser(@Param('email') email: string) {
    const user = await this.usersService.findOne(email);

    if (!user) throw new NotFoundException('User not found!');

    return {
      success: true,
      message: 'User fetched successfully',
      data: user,
    };
  }
}
