import type { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty({
    example: 1,
    description: 'Product ID',
  })
  productId!: number;

  @ApiProperty({
    example: 1,
    description: 'Unit ID',
  })
  unitId!: number;

  @ApiPropertyOptional({ example: 1, description: 'Tax ID' })
  taxId?: number | null;

  @ApiProperty({
    example: 1,
    description: 'Quantity',
  })
  qty!: number;

  @ApiProperty({
    example: '1.00',
    description: 'Received',
  })
  received!: string;

  @ApiProperty({
    example: '1.00',
    description: 'Net unit cost',
  })
  netUnitCost!: string;

  @ApiProperty({
    example: '1.00',
    description: 'Discount',
  })
  discount!: string;

  @ApiProperty({
    example: '1.00',
    description: 'Tax Rate',
  })
  taxRate!: string;

  @ApiProperty({
    example: '1.00',
    description: 'Tax',
  })
  tax!: string;

  @ApiProperty({
    example: '1.00',
    description: 'Total',
  })
  total!: string;
}

export class UpdateProductDto extends ProductDto {
  @ApiProperty({
    example: 1,
    description: 'ID',
  })
  id!: number;
}

export class CreatePurchaseDto {
  @ApiProperty({
    example: 1,
    description: 'Supplier ID',
  })
  supplierId!: number;

  @ApiProperty({
    example: 1,
    description: 'Warehouse ID',
  })
  warehouseId!: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Tax ID',
  })
  taxId?: number;

  @ApiProperty({
    example: 'RECEIVED',
    description: 'Purchase Status',
  })
  purchaseStatus!: 'RECEIVED' | 'PARTIAL' | 'PENDING' | 'ORDERED';

  @ApiProperty({
    example: 1,
    description: 'Item count',
  })
  item!: number;

  @ApiProperty({
    example: 10,
    description: 'Total quantity',
  })
  totalQty!: number;

  @ApiProperty({ example: '10.00', description: 'Total discount' })
  totalDiscount!: string;

  @ApiProperty({ example: '5.00', description: 'Total tax' })
  totalTax!: string;

  @ApiProperty({ example: '100.00', description: 'Total Cost' })
  totalCost!: string;

  @ApiProperty({ example: '5', description: 'Order Tax Rate' })
  orderTaxRate!: string;

  @ApiProperty({ example: '5.00', description: 'Order Tax' })
  orderTax!: string;

  @ApiProperty({ example: '10.00', description: 'Order Discount' })
  orderDiscount!: string;

  @ApiProperty({ example: '20.00', description: 'Shipping Cost' })
  shippingCost!: string;

  @ApiProperty({ example: '115.00', description: 'Grand Total' })
  grandTotal!: string;

  @ApiProperty({ example: '50.00', description: 'Paid Amount' })
  paidAmount!: string;

  @ApiProperty({ example: 'Some note', description: 'Note' })
  note!: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Document file (jpg, jpeg, png, gif) max 2MB',
  })
  document?: MemoryStorageFile;

  @ApiProperty({
    type: [ProductDto],
    description: 'List of purchased products',
  })
  products!: ProductDto[];
}

export class UpdatePurchaseDto extends OmitType(CreatePurchaseDto, [
  'products',
]) {
  @ApiProperty({
    type: [UpdateProductDto],
    description: 'List of purchased products with optional row ID for updates',
  })
  products!: UpdateProductDto[];
}
