import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({
    description: 'Type a role name first!',
    minimum: 1,
    default: 'Role 1',
    type: String,
  })
  roleName!: string;

  @ApiProperty({
    description: 'Select a role to be deleted!',
    minimum: 1,
    default: true,
    type: Boolean,
  })
  deletable!: boolean;
}

export class UpdateRoleDto extends RoleDto {
  @ApiProperty({
    description: 'Select module first!',
    minimum: 1,
    default: [1, 2, 3],
    type: Array,
  })
  moduleIds!: number[];

  @ApiProperty({
    description: 'Select permission first!',
    minimum: 1,
    default: [4, 5, 6],
    type: Array,
  })
  permissionIds!: number[];
}
