import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Enter a valid email address!',
    minimum: 1,
    default: 'admin@gmail.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Password is required!',
    minimum: 6,
    default: 'asdfg1234',
    type: String,
  })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Login successful!' })
  message: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 1661504000 })
  expiresIn: number;
}

export class LoginValidateErrorDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Validation failed!' })
  message: string;

  @ApiProperty({
    example: {
      email: 'Email must be a valid email address',
      password: 'Password must be at least 6 characters',
    },
    description: 'Validation errors for each field',
  })
  errors: Record<string, string>;
}
