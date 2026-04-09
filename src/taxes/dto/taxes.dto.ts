import { ApiProperty } from '@nestjs/swagger';

export class TaxDto {
  @ApiProperty({
    description: 'Enter a valid tax name!',
    default: 'Tax 1',
    type: String,
  })
  name!: string;

  @ApiProperty({
    description: 'Enter a valid tax rate!',
    default: 10,
    type: Number,
  })
  rate!: number;

  @ApiProperty({
    description: 'Select a tax status!',
    default: true,
    type: Boolean,
  })
  status!: boolean;
}

export class BlukDeleteTaxDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of taxes ids',
    default: [1, 2, 3, 4],
    required: true,
  })
  ids!: number[];
}
