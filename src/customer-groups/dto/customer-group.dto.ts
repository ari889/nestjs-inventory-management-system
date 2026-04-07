import { ApiProperty } from '@nestjs/swagger';

export class CustomerGroupDto {
  @ApiProperty({
    description: 'Enter a valid customer group name!',
    default: 'Customer Group 1',
    type: String,
  })
  groupName!: string;

  @ApiProperty({
    description: 'Enter a valid customer group percentage!',
    default: 10,
    type: Number,
  })
  percentage!: number;

  @ApiProperty({
    description: 'Select a customer group status!',
    default: true,
    type: Boolean,
  })
  status!: boolean;
}

export class BlukDeleteCustomerGroupDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of customer group ids',
    default: [1, 2, 3, 4],
    required: true,
  })
  ids!: number[];
}
