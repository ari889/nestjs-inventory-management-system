import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({
    description: 'Type a role name first!',
    minimum: 1,
    default: 'Role 1',
    type: String,
  })
  roleName: string;

  @ApiProperty({
    description: 'Select a role to be deleted!',
    minimum: 1,
    default: true,
    type: Boolean,
  })
  deletable: boolean;
}
