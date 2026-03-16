import { ApiProperty } from '@nestjs/swagger';
import { PermissionItemDto } from './permission-item.dto';

export class CreatePermissionDto {
  @ApiProperty({
    example: 1,
    description: 'Module ID',
  })
  moduleId: number;

  @ApiProperty({
    type: [PermissionItemDto],
    description: 'List of permissions for the selected module',
  })
  permissions: PermissionItemDto[];
}
