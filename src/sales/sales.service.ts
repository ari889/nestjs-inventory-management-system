import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, Sale } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import {
  deleteOldFile,
  replaceFile,
  saveFile,
} from 'src/common/fileUpload/fileHelper';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All Sales
   * @param param0
   * @returns Sale[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search = '',
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
  }): Promise<{ items: Sale[]; totalItems: number }> {
    const where = search
      ? {
          saleNo: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Sale find by id
   * @param id
   * @returns Sale
   */
  async findOne(id: number): Promise<Omit<Sale, 'createdBy' | 'updatedBy'>> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        tax: {
          select: {
            id: true,
            name: true,
          },
        },
        saleProducts: {
          include: {
            productTax: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
            unit: {
              select: {
                id: true,
                unitName: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
              },
            },
          },
        },
      },
    });
    if (!sale) throw new NotFoundException('Sale not found.');
    return sale;
  }

  /**
   * Create or update sale
   * @param dto
   * @param document
   * @returns Sale
   */
  async create(
    dto: CreateSaleDto,
    creatorEmail: string,
    document?: MemoryStorageFile,
  ) {
    try {
      const creator = await this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      });

      if (!creator) throw new NotFoundException('Creator user not found!');

      let documentUrl: string | null = null;
      if (document) {
        documentUrl = await saveFile(document, 'sales');
      }

      const totalDiscount = dto.products.reduce(
        (sum, p) => sum + Number(p.discount || 0),
        0,
      );
      const totalTax = dto.products.reduce(
        (sum, p) => sum + Number(p.tax || 0),
        0,
      );
      const totalPrice = dto.products.reduce(
        (sum, p) => sum + Number(p.netUnitPrice || 0) * Number(p.qty || 0),
        0,
      );
      const item = dto.products.length;
      const totalQty = dto.products.reduce(
        (sum, p) => sum + Number(p.qty || 0),
        0,
      );

      const orderTaxRate = Number(dto.orderTaxRate || 0);
      const orderTax = Number(dto.orderTax || 0);
      const orderDiscount = Number(dto.orderDiscount || 0);
      const shippingCost = Number(dto.shippingCost || 0);

      const grandTotal =
        totalPrice -
        totalDiscount +
        totalTax -
        orderDiscount +
        orderTax +
        shippingCost;

      const isCompleted = dto.saleStatus === true;
      const isDue = dto.paymentStatus === 'DUE';

      const paidAmount =
        isCompleted && !isDue ? Number(dto.paidAmount || 0) : 0;

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');

      const saleNo = `SINV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      return await this.prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            saleNo,
            customerId: dto.customerId,
            warehouseId: dto.warehouseId,

            item,
            totalQty,

            totalDiscount: new Prisma.Decimal(totalDiscount),
            totalTax: new Prisma.Decimal(totalTax),
            totalPrice: new Prisma.Decimal(totalPrice),

            orderTaxRate: new Prisma.Decimal(orderTaxRate),
            orderTax: new Prisma.Decimal(orderTax),
            orderDiscount: new Prisma.Decimal(orderDiscount),

            shippingCost: new Prisma.Decimal(shippingCost),
            grandTotal: new Prisma.Decimal(grandTotal),

            paidAmount: new Prisma.Decimal(paidAmount),
            taxId: dto.taxId,

            saleStatus: dto.saleStatus,
            paymentStatus: dto.paymentStatus || 'DUE',
            document: documentUrl,
            note: dto.note,
            status: true,
            createdBy: creator.id,
            updatedBy: creator.id,

            saleProducts: {
              create: dto.products.map((p) => ({
                productId: p.productId,
                unitId: p.unitId,
                qty: Number(p.qty || 0),
                taxId: p.taxId ?? null,
                taxRate: new Prisma.Decimal(p.taxRate || 0),
                tax: new Prisma.Decimal(p.tax || 0),
                netUnitPrice: new Prisma.Decimal(p.netUnitPrice || 0),
                discount: new Prisma.Decimal(p.discount || 0),
                total: new Prisma.Decimal(p.total || 0),
              })),
            },
          },
          include: {
            creator: { select: { id: true, name: true } },
            saleProducts: true,
          },
        });

        await Promise.all(
          dto.products.map(async (p) => {
            const unit = await tx.unit.findUnique({
              where: { id: p.unitId },
              select: { operator: true, operationValue: true },
            });

            if (!unit) {
              throw new NotFoundException(`Unit ${p.unitId} not found!`);
            }

            const qtyValue =
              unit.operator === '*'
                ? Number(p.qty) * Number(unit.operationValue)
                : Number(p.qty) / Number(unit.operationValue);

            await tx.product.update({
              where: { id: p.productId },
              data: { qty: { decrement: qtyValue } },
            });

            const warehouseProduct = await tx.warehouseProduct.findFirst({
              where: { warehouseId: dto.warehouseId, productId: p.productId },
              select: {
                id: true,
                qty: true,
                product: { select: { id: true, name: true, code: true } },
              },
            });

            if (warehouseProduct) {
              if (Number(warehouseProduct.qty) < qtyValue) {
                throw new BadRequestException(
                  `${warehouseProduct?.product?.name}(${warehouseProduct?.product?.code}) have ${warehouseProduct.qty} but you want ${qtyValue}.`,
                );
              }
              await tx.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { qty: { decrement: qtyValue } },
              });
            } else {
              const product = await tx.product.findUnique({
                where: { id: p.productId },
                select: { name: true, code: true },
              });
              throw new BadRequestException(
                `${product?.name ?? 'Product'}(${product?.code ?? 'N/A'}) is not available in the selected warehouse`,
              );
            }
          }),
        );

        if (isCompleted && !isDue && paidAmount > 0) {
          const account = await tx.account.findUnique({
            where: { id: dto.accountId as number },
          });

          if (!account) throw new NotFoundException('Account not found!');

          if (!account.status) {
            throw new UnprocessableEntityException('Account is inactive.');
          }

          const incomingAmount = new Prisma.Decimal(paidAmount);

          const lastPayment = await tx.payment.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
          });

          const nextId = (lastPayment?.id ?? 0) + 1;
          const paymentNo = `PAY-${String(nextId).padStart(6, '0')}`;

          await tx.payment.create({
            data: {
              accountId: dto.accountId as number,
              saleId: sale.id,
              amount: incomingAmount,
              change: new Prisma.Decimal(dto.change || 0),
              paymentMethod: dto.paymentMethod,
              paymentNo,
              createdBy: creator.id,
            },
          });
        }

        return sale;
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save Sale!');
    }
  }

  async update(
    id: number,
    dto: UpdateSaleDto,
    updatorEmail: string,
    document?: MemoryStorageFile,
  ) {
    try {
      const [sale, updator] = await Promise.all([
        this.prisma.sale.findUnique({
          where: { id },
          select: {
            id: true,
            document: true,
            warehouseId: true,
            paymentStatus: true,
            saleStatus: true,
            saleProducts: {
              select: {
                id: true,
                productId: true,
                unitId: true,
                qty: true,
              },
            },
            payments: {
              select: {
                id: true,
                accountId: true,
                amount: true,
              },
            },
          },
        }),
        this.prisma.user.findUnique({
          where: { email: updatorEmail },
          select: { id: true },
        }),
      ]);

      if (!updator) throw new NotFoundException('User not found!');
      if (!sale) throw new NotFoundException('Sale not found!');

      if (sale.saleStatus && sale.paymentStatus === 'PAID') {
        throw new ForbiddenException(
          'This sale has been fully paid and cannot be edited. Please delete it and create a new sale.',
        );
      }

      if (sale.saleStatus && sale.paymentStatus === 'PARTIAL') {
        const totalPaid = sale.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );

        const incomingTotalPrice = dto.products.reduce(
          (sum, p) => sum + Number(p.total || 0),
          0,
        );
        const incomingGrandTotal =
          incomingTotalPrice -
          Number(dto.orderDiscount || 0) +
          Number(dto.orderTax || 0) +
          Number(dto.shippingCost || 0);

        if (incomingGrandTotal < totalPaid) {
          throw new BadRequestException(
            `Grand total (${incomingGrandTotal.toFixed(2)}) cannot be less than the amount already paid (${totalPaid.toFixed(2)}).`,
          );
        }
      }

      let documentUrl: string | null = sale.document ?? null;
      if (document) {
        documentUrl = await replaceFile(document, 'sales', sale.document);
      }

      const totalDiscount = dto.products.reduce(
        (sum, p) => sum + Number(p.discount || 0),
        0,
      );
      const totalTax = dto.products.reduce(
        (sum, p) => sum + Number(p.tax || 0),
        0,
      );

      const totalPrice = dto.products.reduce(
        (sum, p) => sum + Number(p.total || 0),
        0,
      );

      const item = dto.products.length;
      const totalQty = dto.products.reduce(
        (sum, p) => sum + Number(p.qty || 0),
        0,
      );

      const orderTaxRate = Number(dto.orderTaxRate || 0);
      const orderTax = Number(dto.orderTax || 0);
      const orderDiscount = Number(dto.orderDiscount || 0);
      const shippingCost = Number(dto.shippingCost || 0);

      const grandTotal = totalPrice - orderDiscount + orderTax + shippingCost;

      return await this.prisma.$transaction(async (tx) => {
        await Promise.all(
          sale.saleProducts.map(async (oldProduct) => {
            if (!oldProduct.productId) return;

            const unit = await tx.unit.findUnique({
              where: { id: oldProduct.unitId },
              select: { operator: true, operationValue: true },
            });

            if (!unit) {
              throw new NotFoundException(
                `Unit ${oldProduct.unitId} not found!`,
              );
            }

            const oldQtyValue =
              unit.operator === '*'
                ? Number(oldProduct.qty) * Number(unit.operationValue)
                : Number(oldProduct.qty) / Number(unit.operationValue);

            await tx.product.update({
              where: { id: oldProduct.productId },
              data: { qty: { increment: oldQtyValue } },
            });

            const warehouseProduct = await tx.warehouseProduct.findFirst({
              where: {
                warehouseId: sale.warehouseId,
                productId: oldProduct.productId,
              },
              select: { id: true },
            });

            if (warehouseProduct) {
              await tx.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { qty: { increment: oldQtyValue } },
              });
            }
          }),
        );

        const keepIds = dto.products
          .map((p) => p.id)
          .filter((pid): pid is number => pid !== null && pid !== undefined);

        await tx.saleProduct.deleteMany({
          where: {
            saleId: id,
            ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
          },
        });

        const updated = await tx.sale.update({
          where: { id },
          data: {
            customerId: dto.customerId,
            warehouseId: dto.warehouseId,
            taxId: dto.taxId ?? null,
            saleStatus: dto.saleStatus,

            item,
            totalQty,

            totalDiscount: new Prisma.Decimal(totalDiscount),
            totalTax: new Prisma.Decimal(totalTax),
            totalPrice: new Prisma.Decimal(totalPrice),

            orderTaxRate: new Prisma.Decimal(orderTaxRate),
            orderTax: new Prisma.Decimal(orderTax),
            orderDiscount: new Prisma.Decimal(orderDiscount),

            shippingCost: new Prisma.Decimal(shippingCost),
            grandTotal: new Prisma.Decimal(grandTotal),

            note: dto.note,
            document: documentUrl,
            updatedBy: updator.id,

            saleProducts: {
              upsert: dto.products
                .filter((p) => p.id)
                .map((p) => ({
                  where: { id: p.id },
                  update: {
                    productId: p.productId,
                    unitId: p.unitId,
                    taxId: p.taxId ?? null,
                    qty: Number(p.qty || 0),
                    netUnitPrice: new Prisma.Decimal(p.netUnitPrice || 0),
                    discount: new Prisma.Decimal(p.discount || 0),
                    taxRate: new Prisma.Decimal(p.taxRate || 0),
                    tax: new Prisma.Decimal(p.tax || 0),
                    total: new Prisma.Decimal(p.total || 0),
                  },
                  create: {
                    productId: p.productId,
                    unitId: p.unitId,
                    taxId: p.taxId ?? null,
                    qty: Number(p.qty || 0),
                    netUnitPrice: new Prisma.Decimal(p.netUnitPrice || 0),
                    discount: new Prisma.Decimal(p.discount || 0),
                    taxRate: new Prisma.Decimal(p.taxRate || 0),
                    tax: new Prisma.Decimal(p.tax || 0),
                    total: new Prisma.Decimal(p.total || 0),
                  },
                })),
              create: dto.products
                .filter((p) => !p.id)
                .map((p) => ({
                  productId: p.productId,
                  unitId: p.unitId,
                  taxId: p.taxId ?? null,
                  qty: Number(p.qty || 0),
                  netUnitPrice: new Prisma.Decimal(p.netUnitPrice || 0),
                  discount: new Prisma.Decimal(p.discount || 0),
                  taxRate: new Prisma.Decimal(p.taxRate || 0),
                  tax: new Prisma.Decimal(p.tax || 0),
                  total: new Prisma.Decimal(p.total || 0),
                })),
            },
          },
          include: {
            creator: { select: { id: true, name: true } },
            saleProducts: true,
          },
        });

        await Promise.all(
          dto.products.map(async (p) => {
            const unit = await tx.unit.findUnique({
              where: { id: p.unitId },
              select: { operator: true, operationValue: true },
            });

            if (!unit) {
              throw new NotFoundException(`Unit ${p.unitId} not found!`);
            }

            const newQtyValue =
              unit.operator === '*'
                ? Number(p.qty) * Number(unit.operationValue)
                : Number(p.qty) / Number(unit.operationValue);

            await tx.product.update({
              where: { id: p.productId },
              data: { qty: { decrement: newQtyValue } },
            });

            const warehouseProduct = await tx.warehouseProduct.findFirst({
              where: {
                warehouseId: dto.warehouseId,
                productId: p.productId,
              },
              select: {
                id: true,
                qty: true,
                product: { select: { id: true, name: true, code: true } },
              },
            });

            if (warehouseProduct) {
              if (Number(warehouseProduct.qty) < newQtyValue) {
                throw new BadRequestException(
                  `${warehouseProduct?.product?.name}(${warehouseProduct?.product?.code}) have ${warehouseProduct.qty} but you want ${newQtyValue}.`,
                );
              }
              await tx.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { qty: { decrement: newQtyValue } },
              });
            } else {
              const product = await tx.product.findUnique({
                where: { id: p.productId },
                select: { name: true, code: true },
              });
              throw new BadRequestException(
                `${product?.name ?? 'Product'}(${product?.code ?? 'N/A'}) is not available in the selected warehouse`,
              );
            }
          }),
        );

        return updated;
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error instanceof ForbiddenException) throw error;
      if (error instanceof UnprocessableEntityException) throw error;

      const message =
        error instanceof Error ? error.message : 'Failed to update Sale!';
      throw new InternalServerErrorException(message);
    }
  }

  /**
   * Remove sale from table
   * @param id
   * @returns Sale
   */
  async remove(id: number): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      select: {
        id: true,
        document: true,
        warehouseId: true,
        saleProducts: {
          select: {
            productId: true,
            qty: true,
            unitId: true,
          },
        },
        payments: {
          select: {
            id: true,
            accountId: true,
            amount: true,
          },
        },
      },
    });

    if (!sale) throw new NotFoundException('Sale not found.');

    const deleted = await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        sale.payments.map(async (payment) => {
          await tx.payment.delete({ where: { id: payment.id } });
        }),
      );

      await Promise.all(
        sale.saleProducts.map(async (oldProduct) => {
          if (!oldProduct.productId) return;

          const unit = await tx.unit.findUnique({
            where: { id: oldProduct.unitId },
            select: { operator: true, operationValue: true },
          });

          if (!unit)
            throw new NotFoundException(`Unit ${oldProduct.unitId} not found!`);

          const oldQtyValue =
            unit.operator === '*'
              ? Number(oldProduct.qty) * Number(unit.operationValue)
              : Number(oldProduct.qty) / Number(unit.operationValue);

          await tx.product.update({
            where: { id: oldProduct.productId },
            data: { qty: { increment: oldQtyValue } },
          });

          const warehouseProduct = await tx.warehouseProduct.findFirst({
            where: {
              warehouseId: sale.warehouseId,
              productId: oldProduct.productId,
            },
            select: { id: true },
          });

          if (warehouseProduct) {
            await tx.warehouseProduct.update({
              where: { id: warehouseProduct.id },
              data: { qty: { increment: oldQtyValue } },
            });
          }
        }),
      );

      await tx.saleProduct.deleteMany({ where: { saleId: id } });

      return tx.sale.delete({ where: { id } });
    });

    await deleteOldFile(sale.document ?? null);

    return deleted;
  }

  async bulkDelete(ids: BlukDeleteIdsDto['ids']): Promise<{ count: number }> {
    const sales = await this.prisma.sale.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        document: true,
        warehouseId: true,
        saleProducts: {
          select: {
            productId: true,
            qty: true,
            unitId: true,
          },
        },
        payments: {
          select: {
            id: true,
            accountId: true,
            amount: true,
          },
        },
      },
    });

    if (!sales.length) throw new NotFoundException('Sales not found.');

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        sales.flatMap((sale) =>
          sale.payments.map(async (payment) => {
            await tx.payment.delete({ where: { id: payment.id } });
          }),
        ),
      );

      await Promise.all(
        sales.flatMap((sale) =>
          sale.saleProducts.map(async (oldProduct) => {
            if (!oldProduct.productId) return;

            const unit = await tx.unit.findUnique({
              where: { id: oldProduct.unitId },
              select: { operator: true, operationValue: true },
            });

            if (!unit)
              throw new NotFoundException(
                `Unit ${oldProduct.unitId} not found!`,
              );

            const oldQtyValue =
              unit.operator === '*'
                ? Number(oldProduct.qty) * Number(unit.operationValue)
                : Number(oldProduct.qty) / Number(unit.operationValue);

            await tx.product.update({
              where: { id: oldProduct.productId },
              data: { qty: { increment: oldQtyValue } },
            });

            const warehouseProduct = await tx.warehouseProduct.findFirst({
              where: {
                warehouseId: sale.warehouseId,
                productId: oldProduct.productId,
              },
              select: { id: true },
            });

            if (warehouseProduct) {
              await tx.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { qty: { increment: oldQtyValue } },
              });
            }
          }),
        ),
      );

      await tx.saleProduct.deleteMany({
        where: { saleId: { in: ids } },
      });

      await tx.sale.deleteMany({ where: { id: { in: ids } } });
    });

    await Promise.all(sales.map((p) => deleteOldFile(p.document ?? null)));

    return { count: sales.length };
  }
}
