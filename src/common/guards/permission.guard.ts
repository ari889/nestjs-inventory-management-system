import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { AuthRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get the required slug from the decorator
    const requiredSlug = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission decorator = publicly accessible
    if (!requiredSlug) return true;

    // 2. Extract JWT from Authorization header
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader: string = request.headers['authorization'] ?? '';

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed token');
    }

    const token = authHeader.split(' ')[1];

    let payload: { email: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 3. Load user with role → permissions from DB
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        status: true,
        role: {
          select: {
            permissionRole: {
              select: {
                permission: {
                  select: { slug: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found!');
    if (!user.status) throw new ForbiddenException('Account is inactive');

    // 4. Super admin bypass — user with id 1 has access to everything
    if (user.id === 1) {
      request.email = payload.email;
      return true;
    }

    // 5. Check if any permission slug matches
    const slugs = user.role.permissionRole.map((pr) => pr.permission.slug);

    if (!slugs.includes(requiredSlug)) {
      throw new ForbiddenException(
        `You have no enough permissions to do this! Required: ${requiredSlug}.`,
      );
    }

    // 6. Attach user email to request for downstream use
    request.email = payload.email;
    return true;
  }
}
