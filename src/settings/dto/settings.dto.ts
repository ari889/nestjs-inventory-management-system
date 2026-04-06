import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Enter a valid site title!',
    default: 'Inventory Management System',
    type: String,
  })
  title!: string;

  @ApiProperty({
    description: 'Enter a valid site address!',
    default: '123 Main Street',
    type: String,
    nullable: true,
    required: false,
  })
  address!: string | null;

  @ApiProperty({
    description: 'Enter a valid currency code!',
    default: 'USD',
    type: String,
  })
  currency_code!: string;

  @ApiProperty({
    description: 'Enter a valid currency symbol!',
    default: '$',
    type: String,
  })
  currency_symbol!: string;

  @ApiProperty({
    description: 'Enter a valid currency position!',
    default: 'postfix',
    enum: ['prefix', 'postfix'],
  })
  currency_position!: 'prefix' | 'postfix';

  @ApiProperty({
    description: 'Enter a valid timezone!',
    default: 'America/New_York',
    type: String,
  })
  timezone!: string;

  @ApiProperty({
    description: 'Enter a valid date format!',
    default: 'MM/DD/YYYY',
    type: String,
  })
  date_format!: string;

  @ApiProperty({
    description: 'Enter a valid invoice prefix!',
    default: 'INV-',
    type: String,
  })
  invoice_suffix!: string;

  @ApiProperty({
    description: 'Enter a valid invoice number!',
    default: '1',
    type: String,
  })
  invoice_number!: string;
}
