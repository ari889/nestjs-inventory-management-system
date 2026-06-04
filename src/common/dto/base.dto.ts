import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteIdsDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of ids',
    default: [1, 2, 3, 4],
    required: true,
  })
  ids!: number[];
}
