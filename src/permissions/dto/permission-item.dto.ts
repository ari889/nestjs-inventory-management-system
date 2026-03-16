import { ApiProperty } from '@nestjs/swagger';

export class PermissionItemDto {
  @ApiProperty({
    example: 'Create User',
    description: 'Permission name',
  })
  name: string;

  @ApiProperty({
    example: 'create-user',
    description: 'Unique permission slug',
  })
  slug: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether the permission can be deleted',
  })
  deletable?: boolean;
}
