import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the user',
  })
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the user',
  })
  email: string;

  @ApiProperty({
    example: '+1234567890',
    required: false,
    description: 'Phone number of the user',
  })
  phoneNo?: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password for the user account',
  })
  password: string;

  @ApiProperty({
    example: 1,
    description: 'Role ID associated with the user',
  })
  roleId: number;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    required: false,
    description: 'URL of the user avatar',
  })
  avatar?: string;

  @ApiProperty({
    example: true,
    description: 'Gender of the user (true for male, false for  female)',
  })
  gender: boolean;

  @ApiProperty({
    example: true,
    description: 'Status of the user (true for active, false for inactive)',
  })
  status: boolean;
}
