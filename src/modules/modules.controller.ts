import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @ApiBearerAuth()
  @ApiOkResponse()
  @Get()
  async getModules() {
    return this.modulesService.getModules();
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Get modules by role',
  })
  @Get('/role')
  async getModuleByRole(@Req() req: FastifyRequest) {
    const user = req.user;
    const modules = await this.modulesService.getModuleByRole(user.email);
    return {
      success: true,
      message: 'Get modules by role successfully!',
      data: modules,
    };
  }
}
