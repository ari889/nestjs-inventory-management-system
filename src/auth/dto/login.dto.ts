import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Enter a valid email address!',
    minimum: 1,
    default: 'admin@gmail.com',
    type: String,
  })
  email!: string;

  @ApiProperty({
    description: 'Password is required!',
    minimum: 6,
    default: 'asdfg1234',
    type: String,
  })
  password!: string;
}
