import { ApiProperty } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiProperty({
    description: 'Type a menu name first!',
    minimum: 1,
    default: 'Menu 1',
    type: String,
  })
  menuName: string;

  @ApiProperty({
    description: 'Select a menu to be deleted!',
    minimum: 1,
    default: true,
    type: Boolean,
  })
  deletable: boolean;
}
