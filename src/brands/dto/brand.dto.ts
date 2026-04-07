import { ApiProperty } from '@nestjs/swagger';

export class BlukDeleteBrandDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of brand ids',
    default: [1, 2, 3, 4],
    required: true,
  })
  ids!: number[];
}
