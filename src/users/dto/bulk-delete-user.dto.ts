import { ApiProperty } from '@nestjs/swagger';

export class BlukDeleteUserDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of menu ids',
    default: [1, 2, 3, 4],
    required: true,
  })
  ids!: number[];
}
