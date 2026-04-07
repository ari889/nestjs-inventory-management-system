import { ApiProperty } from '@nestjs/swagger';

export class WarehouseDto {
  @ApiProperty({
    description: 'Enter a valid warehouse name!',
    default: 'Warehouse 1',
    type: String,
  })
  name!: string;

  @ApiProperty({
    description: 'Enter a valid warehouse email!',
    default: 'warehouse1@example.com',
    type: String,
  })
  email?: string;

  @ApiProperty({
    description: 'Enter a valid warehouse phone!',
    default: '1234567890',
    type: String,
  })
  phone?: string;

  @ApiProperty({
    description: 'Select a warehouse status!',
    default: true,
    type: Boolean,
  })
  status!: boolean;
}

export class BlukDeleteWarehouseDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of warehouse ids',
    default: [1, 2, 3, 4],
    required: true,
  })
  ids!: number[];
}
