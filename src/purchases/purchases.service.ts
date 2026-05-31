import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Purchase } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import {
  deleteOldFile,
  replaceFile,
  saveFile,
} from 'src/common/fileUpload/fileHelper';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto/purchase.dto';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All Purchases
   * @param param0
   * @returns Purchase[]
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
  }): Promise<{ items: Purchase[]; totalItems: number }> {
    const where = search
      ? {
          purchaseNo: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.purchase.findMany({
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
          supplier: {
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
      this.prisma.purchase.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Purchase find by id
   * @param id
   * @returns Purchase
   */
  async findOne(
    id: number,
  ): Promise<Omit<Purchase, 'createdBy' | 'updatedBy'>> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
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
        purchaseProducts: {
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
    if (!purchase) throw new NotFoundException('Purchase not found.');
    return purchase;
  }

  /**
   * Create or update purchase
   * @param dto
   * @param document
   * @returns Purchase
   */
  async create(
    dto: CreatePurchaseDto,
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
        documentUrl = await saveFile(document, 'purchases');
      }

      const totalDiscount = dto.products.reduce(
        (sum, p) => sum + Number(p.discount || 0),
        0,
      );

      const totalTax = dto.products.reduce(
        (sum, p) => sum + Number(p.tax || 0),
        0,
      );

      const totalCost = dto.products.reduce(
        (sum, p) => sum + Number(p.netUnitCost || 0) * Number(p.qty || 0),
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
        totalCost -
        totalDiscount +
        totalTax -
        orderDiscount +
        orderTax +
        shippingCost;

      return await this.prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.create({
          data: {
            supplierId: dto.supplierId,
            warehouseId: dto.warehouseId,
            taxId: dto.taxId ?? null,
            purchaseStatus: dto.purchaseStatus,

            item,
            totalQty,

            totalDiscount: new Prisma.Decimal(totalDiscount),
            totalTax: new Prisma.Decimal(totalTax),
            totalCost: new Prisma.Decimal(totalCost),

            orderTaxRate: new Prisma.Decimal(orderTaxRate),
            orderTax: new Prisma.Decimal(orderTax),
            orderDiscount: new Prisma.Decimal(orderDiscount),

            shippingCost: new Prisma.Decimal(shippingCost),
            grandTotal: new Prisma.Decimal(grandTotal),
            paidAmount: new Prisma.Decimal(0),

            note: dto.note,

            purchaseNo: `PUR-${Date.now()}`,
            paymentStatus: false,
            status: true,

            document: documentUrl,
            createdBy: creator.id,
            updatedBy: creator.id,

            purchaseProducts: {
              create: dto.products.map((p) => ({
                productId: p.productId,
                unitId: p.unitId,
                taxId: p.taxId ?? null,

                qty: Number(p.qty || 0),
                received: Number(p.received || 0),

                netUnitCost: new Prisma.Decimal(p.netUnitCost || 0),
                discount: new Prisma.Decimal(p.discount || 0),
                taxRate: new Prisma.Decimal(p.taxRate || 0),
                tax: new Prisma.Decimal(p.tax || 0),
                total: new Prisma.Decimal(p.total || 0),
              })),
            },
          },

          include: {
            creator: { select: { id: true, name: true } },
            purchaseProducts: true,
          },
        });

        if (dto.purchaseStatus === 'PARTIAL') {
          await Promise.all(
            dto.products.map(async (p) => {
              const unit = await tx.unit.findUnique({
                where: { id: p.unitId },
                select: { operationValue: true },
              });

              if (!unit) {
                throw new NotFoundException(`Unit ${p.unitId} not found!`);
              }

              const receivedQty = new Prisma.Decimal(p.received || 0).div(
                new Prisma.Decimal(unit.operationValue),
              );

              const qtyValue = receivedQty.toNumber();

              await tx.product.update({
                where: { id: p.productId },
                data: {
                  qty: {
                    increment: qtyValue,
                  },
                },
              });

              const warehouseProduct = await tx.warehouseProduct.findFirst({
                where: {
                  warehouseId: dto.warehouseId,
                  productId: p.productId,
                },
                select: { id: true },
              });

              if (warehouseProduct) {
                await tx.warehouseProduct.update({
                  where: { id: warehouseProduct.id },
                  data: {
                    qty: {
                      increment: qtyValue,
                    },
                  },
                });
              } else {
                await tx.warehouseProduct.create({
                  data: {
                    warehouseId: dto.warehouseId,
                    productId: p.productId,
                    qty: qtyValue,
                  },
                });
              }
            }),
          );
        }

        return purchase;
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException('Failed to save Purchase!');
    }
  }

  async update(
    id: number,
    dto: UpdatePurchaseDto,
    updatorEmail: string,
    document?: MemoryStorageFile,
  ) {
    try {
      const [purchase, updator] = await Promise.all([
        this.prisma.purchase.findUnique({
          where: { id },
          select: {
            id: true,
            document: true,
            warehouseId: true,
            purchaseStatus: true,
            purchaseProducts: {
              select: {
                id: true,
                productId: true,
                received: true,
                unitId: true,
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
      if (!purchase) throw new NotFoundException('Purchase not found!');

      let documentUrl: string | null = purchase.document ?? null;

      if (document) {
        documentUrl = await replaceFile(
          document,
          'purchases',
          purchase.document,
        );
      }

      const totalDiscount = dto.products.reduce(
        (sum, p) => sum + Number(p.discount || 0),
        0,
      );

      const totalTax = dto.products.reduce(
        (sum, p) => sum + Number(p.tax || 0),
        0,
      );

      const totalCost = dto.products.reduce(
        (sum, p) => sum + Number(p.netUnitCost || 0) * Number(p.qty || 0),
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
        totalCost -
        totalDiscount +
        totalTax -
        orderDiscount +
        orderTax +
        shippingCost;

      return await this.prisma.$transaction(async (tx) => {
        await Promise.all(
          purchase.purchaseProducts.map(async (oldProduct) => {
            if (!oldProduct.productId) return;

            const unit = await tx.unit.findUnique({
              where: { id: oldProduct.unitId },
              select: { operator: true, operationValue: true },
            });

            if (!unit)
              throw new NotFoundException(
                `Unit ${oldProduct.unitId} not found!`,
              );

            const oldReceivedQty =
              unit.operator === '*'
                ? new Prisma.Decimal(oldProduct.received).mul(
                    new Prisma.Decimal(unit.operationValue),
                  )
                : new Prisma.Decimal(oldProduct.received).div(
                    new Prisma.Decimal(unit.operationValue),
                  );

            const oldQtyValue = Math.round(oldReceivedQty.toNumber());

            await tx.product.update({
              where: { id: oldProduct.productId },
              data: { qty: { decrement: oldQtyValue } },
            });

            const warehouseProduct = await tx.warehouseProduct.findFirst({
              where: {
                warehouseId: purchase.warehouseId,
                productId: oldProduct.productId,
              },
              select: { id: true },
            });

            if (warehouseProduct) {
              await tx.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { qty: { decrement: oldQtyValue } },
              });
            }
          }),
        );

        await tx.purchaseProduct.deleteMany({
          where: {
            purchaseId: id,
            id: {
              notIn:
                dto.products
                  .map((p) => p.id)
                  .filter(
                    (id): id is number => id !== null && id !== undefined,
                  ) ?? [],
            },
          },
        });

        const updated = await tx.purchase.update({
          where: { id },
          data: {
            supplierId: dto.supplierId,
            warehouseId: dto.warehouseId,
            taxId: dto.taxId ?? null,
            purchaseStatus: dto.purchaseStatus,

            item,
            totalQty,

            totalDiscount: new Prisma.Decimal(totalDiscount),
            totalTax: new Prisma.Decimal(totalTax),
            totalCost: new Prisma.Decimal(totalCost),

            orderTaxRate: new Prisma.Decimal(orderTaxRate),
            orderTax: new Prisma.Decimal(orderTax),
            orderDiscount: new Prisma.Decimal(orderDiscount),

            shippingCost: new Prisma.Decimal(shippingCost),
            grandTotal: new Prisma.Decimal(grandTotal),
            paidAmount: new Prisma.Decimal(0),

            note: dto.note,
            document: documentUrl,
            updatedBy: updator.id,

            purchaseProducts: {
              upsert: dto.products
                .filter((p) => p.id)
                .map((p) => {
                  const qty = Number(p.qty || 0);
                  const cost = Number(p.netUnitCost || 0);

                  return {
                    where: { id: p.id },
                    update: {
                      productId: p.productId,
                      unitId: p.unitId,
                      taxId: p.taxId ?? null,

                      qty,
                      received: Number(p.received || 0),

                      netUnitCost: new Prisma.Decimal(cost),
                      discount: new Prisma.Decimal(p.discount || 0),
                      taxRate: new Prisma.Decimal(p.taxRate || 0),
                      tax: new Prisma.Decimal(p.tax || 0),

                      total: new Prisma.Decimal(qty * cost),
                    },
                    create: {
                      productId: p.productId,
                      unitId: p.unitId,
                      taxId: p.taxId ?? null,

                      qty,
                      received: Number(p.received || 0),

                      netUnitCost: new Prisma.Decimal(cost),
                      discount: new Prisma.Decimal(p.discount || 0),
                      taxRate: new Prisma.Decimal(p.taxRate || 0),
                      tax: new Prisma.Decimal(p.tax || 0),

                      total: new Prisma.Decimal(qty * cost),
                    },
                  };
                }),
              create: dto.products
                .filter((p) => !p.id)
                .map((p) => {
                  const qty = Number(p.qty || 0);
                  const cost = Number(p.netUnitCost || 0);

                  return {
                    productId: p.productId,
                    unitId: p.unitId,
                    taxId: p.taxId ?? null,

                    qty,
                    received: Number(p.received || 0),

                    netUnitCost: new Prisma.Decimal(cost),
                    discount: new Prisma.Decimal(p.discount || 0),
                    taxRate: new Prisma.Decimal(p.taxRate || 0),
                    tax: new Prisma.Decimal(p.tax || 0),

                    total: new Prisma.Decimal(qty * cost),
                  };
                }),
            },
          },

          include: {
            creator: { select: { id: true, name: true } },
            purchaseProducts: true,
          },
        });

        if (dto.purchaseStatus === 'PARTIAL') {
          await Promise.all(
            dto.products.map(async (p) => {
              const unit = await tx.unit.findUnique({
                where: { id: p.unitId },
                select: { operator: true, operationValue: true },
              });

              if (!unit)
                throw new NotFoundException(`Unit ${p.unitId} not found!`);

              const newReceivedQty =
                unit.operator === '*'
                  ? new Prisma.Decimal(p.received).mul(
                      new Prisma.Decimal(unit.operationValue),
                    )
                  : new Prisma.Decimal(p.received).div(
                      new Prisma.Decimal(unit.operationValue),
                    );

              const newQtyValue = newReceivedQty.toNumber();

              await tx.product.update({
                where: { id: p.productId },
                data: { qty: { increment: newQtyValue } },
              });

              const warehouseProduct = await tx.warehouseProduct.findFirst({
                where: {
                  warehouseId: dto.warehouseId,
                  productId: p.productId,
                },
                select: { id: true },
              });

              if (warehouseProduct) {
                await tx.warehouseProduct.update({
                  where: { id: warehouseProduct.id },
                  data: { qty: { increment: newQtyValue } },
                });
              } else {
                await tx.warehouseProduct.create({
                  data: {
                    warehouseId: dto.warehouseId,
                    productId: p.productId,
                    qty: newQtyValue,
                  },
                });
              }
            }),
          );
        }

        return updated;
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to update Purchase!');
    }
  }

  /**
   * Remove purchase from table
   * @param id
   * @returns Purchase
   */
  async remove(id: number): Promise<Purchase> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        document: true,
        warehouseId: true,
        purchaseProducts: {
          select: {
            productId: true,
            received: true,
            unitId: true,
          },
        },
      },
    });

    if (!purchase) throw new NotFoundException('Purchase not found.');

    const deleted = await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        purchase.purchaseProducts.map(async (oldProduct) => {
          if (!oldProduct.productId) return;

          const unit = await tx.unit.findUnique({
            where: { id: oldProduct.unitId },
            select: { operator: true, operationValue: true },
          });

          if (!unit)
            throw new NotFoundException(`Unit ${oldProduct.unitId} not found!`);

          const oldReceivedQty =
            unit.operator === '*'
              ? new Prisma.Decimal(oldProduct.received).mul(
                  new Prisma.Decimal(unit.operationValue),
                )
              : new Prisma.Decimal(oldProduct.received).div(
                  new Prisma.Decimal(unit.operationValue),
                );

          const oldRoundedQty = Math.round(oldReceivedQty.toNumber());

          await tx.product.update({
            where: { id: oldProduct.productId },
            data: { qty: { decrement: oldRoundedQty } },
          });

          const warehouseProduct = await tx.warehouseProduct.findFirst({
            where: {
              warehouseId: purchase.warehouseId,
              productId: oldProduct.productId,
            },
            select: { id: true, qty: true },
          });

          if (warehouseProduct) {
            const newQty = warehouseProduct.qty - oldRoundedQty;

            if (newQty <= 0) {
              await tx.warehouseProduct.delete({
                where: { id: warehouseProduct.id },
              });
            } else {
              await tx.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { qty: { decrement: oldRoundedQty } },
              });
            }
          }
        }),
      );

      await tx.purchaseProduct.deleteMany({ where: { purchaseId: id } });

      return tx.purchase.delete({ where: { id } });
    });

    await deleteOldFile(purchase.document ?? null);

    return deleted;
  }

  /**
   * Bulk delete purchases
   * @param ids
   * @returns { count: number }
   */
  async bulkDelete(ids: BlukDeleteIdsDto['ids']): Promise<{ count: number }> {
    const purchases = await this.prisma.purchase.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        document: true,
        warehouseId: true,
        purchaseProducts: {
          select: {
            productId: true,
            received: true,
            unitId: true,
          },
        },
      },
    });

    if (!purchases.length) throw new NotFoundException('Purchases not found.');

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        purchases.flatMap((purchase) =>
          purchase.purchaseProducts.map(async (oldProduct) => {
            if (!oldProduct.productId) return;

            const unit = await tx.unit.findUnique({
              where: { id: oldProduct.unitId },
              select: { operator: true, operationValue: true },
            });

            if (!unit)
              throw new NotFoundException(
                `Unit ${oldProduct.unitId} not found!`,
              );

            const oldReceivedQty =
              unit.operator === '*'
                ? new Prisma.Decimal(oldProduct.received).mul(
                    new Prisma.Decimal(unit.operationValue),
                  )
                : new Prisma.Decimal(oldProduct.received).div(
                    new Prisma.Decimal(unit.operationValue),
                  );

            const oldRoundedQty = Math.round(oldReceivedQty.toNumber());

            await tx.product.update({
              where: { id: oldProduct.productId },
              data: { qty: { decrement: oldRoundedQty } },
            });

            const warehouseProduct = await tx.warehouseProduct.findFirst({
              where: {
                warehouseId: purchase.warehouseId,
                productId: oldProduct.productId,
              },
              select: { id: true, qty: true },
            });

            if (warehouseProduct) {
              const newQty = warehouseProduct.qty - oldRoundedQty;

              if (newQty <= 0) {
                await tx.warehouseProduct.delete({
                  where: { id: warehouseProduct.id },
                });
              } else {
                await tx.warehouseProduct.update({
                  where: { id: warehouseProduct.id },
                  data: { qty: { decrement: oldRoundedQty } },
                });
              }
            }
          }),
        ),
      );

      await tx.purchaseProduct.deleteMany({
        where: { purchaseId: { in: ids } },
      });

      await tx.purchase.deleteMany({ where: { id: { in: ids } } });
    });

    await Promise.all(purchases.map((p) => deleteOldFile(p.document ?? null)));

    return { count: purchases.length };
  }
}
