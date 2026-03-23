import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModuleItemDto {
  @ApiProperty({ description: 'Menu item id', type: Number })
  id: number;

  @ApiProperty({ description: 'Menu id', type: Number })
  menuId: number;

  @ApiProperty({ description: 'Is divider?', type: Boolean })
  type: boolean;

  @ApiPropertyOptional({ description: 'Module name', type: String })
  moduleName?: string;

  @ApiPropertyOptional({ description: 'Divider title', type: String })
  dividerTitle?: string;

  @ApiPropertyOptional({ description: 'Icon class', type: String })
  iconClass?: string;

  @ApiPropertyOptional({ description: 'URL', type: String })
  url?: string;

  @ApiProperty({ description: 'Order', type: Number })
  order: number;

  @ApiPropertyOptional({ description: 'Parent module id', type: Number })
  parentId?: number;

  @ApiProperty({ description: 'Target', enum: ['_self', '_blank'] })
  target: '_self' | '_blank';

  @ApiProperty({ description: 'Is deletable?', type: Boolean })
  deletable: boolean;

  @ApiProperty({
    description: 'Children module items',
    type: () => [ModuleItemDto],
  })
  children: ModuleItemDto[];
}
