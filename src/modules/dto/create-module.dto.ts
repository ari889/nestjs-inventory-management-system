import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({
    description: 'Please provide the menu id!',
    default: 1,
    type: Number,
  })
  menuId: number;

  @ApiProperty({
    description: 'Please select module type!',
    default: false,
    type: Boolean,
  })
  type: boolean;

  @ApiPropertyOptional({
    description: 'Enter Module name! (required only when type = false)',
    default: 'Module 1',
    type: String,
  })
  moduleName?: string;

  @ApiPropertyOptional({
    description: 'Enter Divider title! (required only when type = true)',
    default: 'Divider 1',
    type: String,
  })
  dividerTitle?: string;

  @ApiPropertyOptional({
    description:
      'Provide a valid icon class! (required only when type = false)',
    default: 'camera',
    type: String,
  })
  iconClass?: string;

  @ApiPropertyOptional({
    description: 'Provide a valid URL! (required only when type = false)',
    default: '/menu',
    type: String,
  })
  url?: string;

  @ApiProperty({
    description: 'Enter module order!',
    default: 1,
    type: Number,
  })
  order: number;

  @ApiPropertyOptional({
    description:
      'Please select a parent module! (required only when type = false)',
    default: 1,
    type: Number,
  })
  parentId?: number;

  @ApiProperty({
    description: 'Please select a target!',
    default: '_self',
    enum: ['_self', '_blank'],
  })
  target: '_self' | '_blank';

  @ApiProperty({
    description: 'Is module deletable?',
    default: true,
    type: Boolean,
  })
  deletable: boolean;
}
