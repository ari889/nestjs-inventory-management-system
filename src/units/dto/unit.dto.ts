import { ApiProperty } from '@nestjs/swagger';

export class UnitDto {
  @ApiProperty({
    description: 'Enter a valid unit Code!',
    default: 'unit1',
    type: String,
  })
  unitCode!: string;

  @ApiProperty({
    description: 'Enter a valid unit name!',
    default: 'Unit 1',
    type: String,
  })
  unitName!: string;

  @ApiProperty({
    description: 'Select a base unit!',
    default: 1,
    type: Number,
  })
  baseUnitId?: number;

  @ApiProperty({
    description: 'Enter a operator!',
    default: '*',
    type: String,
  })
  operator!: string;

  @ApiProperty({
    description: 'Enter a operation value!',
    default: '1',
    type: Number,
  })
  operationValue!: number;

  @ApiProperty({
    description: 'Select a unit status!',
    default: true,
    type: Boolean,
  })
  status!: boolean;
}

export class BlukDeleteUnitDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of units ids',
    default: [1, 2, 3, 4],
    required: true,
  })
  ids!: number[];
}
