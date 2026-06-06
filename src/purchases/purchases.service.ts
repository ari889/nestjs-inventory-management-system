import {
  ConflictException,
  Injectable,
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
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { PurchaseQueryDto } from './schemas/purchase-query.schema';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All Purchases
   * @param param0
   * @returns Purchase[]
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    status = undefined,
    createdBy = undefined,
    supplierId = undefined,
    warehouseId = undefined,
  }: PurchaseQueryDto): Promise<{
    items: Array<
      Omit<
        Purchase,
        | 'createdBy'
        | 'updatedBy'
        | 'updatedAt'
        | 'supplierId'
        | 'warehouseId'
        | 'note'
      >
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        purchaseNo: { contains: search },
      }),
      ...(status !== undefined && { status }),
      ...(createdBy !== undefined && { createdBy }),
      ...(supplierId !== undefined && { supplierId }),
      ...(warehouseId !== undefined && { warehouseId }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          purchaseNo: true,
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
          item: true,
          totalQty: true,
          totalDiscount: true,
          totalTax: true,
          totalCost: true,
          orderTaxRate: true,
          orderTax: true,
          orderDiscount: true,
          shippingCost: true,
          grandTotal: true,
          paidAmount: true,
          taxId: true,
          purchaseStatus: true,
          paymentStatus: true,
          document: true,
          status: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
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
  ): Promise<
    Omit<
      Purchase,
      'createdBy' | 'updatedBy' | 'updatedAt' | 'supplierId' | 'warehouseId'
    >
  > {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        purchaseNo: true,
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
        item: true,
        totalQty: true,
        totalDiscount: true,
        totalTax: true,
        totalCost: true,
        orderTaxRate: true,
        orderTax: true,
        orderDiscount: true,
        shippingCost: true,
        grandTotal: true,
        paidAmount: true,
        taxId: true,
        purchaseStatus: true,
        paymentStatus: true,
        document: true,
        note: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
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
  ): Promise<
    Omit<
      Purchase,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'supplierId'
      | 'warehouseId'
      | 'note'
    >
  > {
    const [supplier, warehouse, creator] = await Promise.all([
      this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
        select: { id: true },
      }),
      this.prisma.warehouse.findUnique({
        where: { id: dto.warehouseId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      }),
    ]);

    if (!creator) throw new NotFoundException('Creator user not found!');
    if (!supplier) throw new NotFoundException('Supplier not found!');
    if (!warehouse) throw new NotFoundException('Warehouse not found!');

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

        select: {
          id: true,
          purchaseNo: true,
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
          item: true,
          totalQty: true,
          totalDiscount: true,
          totalTax: true,
          totalCost: true,
          orderTaxRate: true,
          orderTax: true,
          orderDiscount: true,
          shippingCost: true,
          grandTotal: true,
          paidAmount: true,
          taxId: true,
          purchaseStatus: true,
          paymentStatus: true,
          document: true,
          status: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
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
  }

  async update(
    id: number,
    dto: UpdatePurchaseDto,
    updatorEmail: string,
    document?: MemoryStorageFile,
  ): Promise<
    Omit<
      Purchase,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'supplierId'
      | 'warehouseId'
      | 'note'
    >
  > {
    const [purchase, updator, supplier, warehouse] = await Promise.all([
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
      this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
        select: { id: true },
      }),
      this.prisma.warehouse.findUnique({
        where: { id: dto.warehouseId },
        select: { id: true },
      }),
    ]);

    if (!updator) throw new NotFoundException('User not found!');
    if (!purchase) throw new NotFoundException('Purchase not found!');
    if (!supplier) throw new NotFoundException('Supplier not found!');
    if (!warehouse) throw new NotFoundException('Warehouse not found!');

    let documentUrl: string | null = purchase.document ?? null;

    if (document) {
      documentUrl = await replaceFile(document, 'purchases', purchase.document);
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
            throw new NotFoundException(`Unit ${oldProduct.unitId} not found!`);

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

        select: {
          id: true,
          purchaseNo: true,
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
          item: true,
          totalQty: true,
          totalDiscount: true,
          totalTax: true,
          totalCost: true,
          orderTaxRate: true,
          orderTax: true,
          orderDiscount: true,
          shippingCost: true,
          grandTotal: true,
          paidAmount: true,
          taxId: true,
          purchaseStatus: true,
          paymentStatus: true,
          document: true,
          status: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
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
  }

  /**
   * Remove purchase from table
   * @param id
   * @returns Purchase
   */
  async remove(
    id: number,
  ): Promise<
    Omit<
      Purchase,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'supplierId'
      | 'warehouseId'
      | 'note'
    >
  > {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        purchaseNo: true,
        supplier: { select: { id: true, name: true } },
        warehouseId: true,
        warehouse: { select: { id: true, name: true } },
        item: true,
        totalQty: true,
        totalDiscount: true,
        totalTax: true,
        totalCost: true,
        orderTaxRate: true,
        orderTax: true,
        orderDiscount: true,
        shippingCost: true,
        grandTotal: true,
        paidAmount: true,
        taxId: true,
        purchaseStatus: true,
        paymentStatus: true,
        document: true,
        status: true,
        creator: { select: { id: true, name: true } },
        createdAt: true,
        purchaseProducts: {
          include: {
            productTax: { select: { id: true, name: true, rate: true } },
            unit: { select: { id: true, unitName: true } },
            product: {
              select: { id: true, name: true, code: true, price: true },
            },
          },
        },
      },
    });

    if (!purchase) throw new NotFoundException('Purchase not found.');

    const paymentCount = await this.prisma.payment.count({
      where: { purchaseId: id },
    });

    if (paymentCount > 0)
      throw new ConflictException(
        `Cannot delete purchase. It has ${paymentCount} payment(s) associated.`,
      );

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
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    const purchases = await this.prisma.purchase.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        document: true,
        warehouseId: true,
        purchaseProducts: {
          select: { productId: true, received: true, unitId: true },
        },
      },
    });

    const foundIds = purchases.map((p) => p.id);
    const notFoundIds = ids.filter((id) => !foundIds.includes(id));

    if (foundIds.length === 0)
      throw new NotFoundException('No purchases found for the given IDs.');

    const payments = await this.prisma.payment.groupBy({
      by: ['purchaseId'],
      where: { purchaseId: { in: foundIds } },
      _count: true,
    });

    const conflictMap = new Map<number, string[]>();
    payments.forEach((p) =>
      conflictMap.set(p.purchaseId!, [`${p._count} payment(s)`]),
    );

    const deletableIds = foundIds.filter((id) => !conflictMap.has(id));
    const deletablePurchases = purchases.filter((p) =>
      deletableIds.includes(p.id),
    );

    const skippedIds = [
      ...notFoundIds.map((id) => ({ id, reasons: ['Not found'] })),
      ...Array.from(conflictMap.entries()).map(([id, reasons]) => ({
        id,
        reasons,
      })),
    ];

    if (deletableIds.length === 0)
      throw new ConflictException({
        message: 'No purchases could be deleted.',
        skipped: skippedIds,
      });

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        deletablePurchases.flatMap((purchase) =>
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
        where: { purchaseId: { in: deletableIds } },
      });

      await tx.purchase.deleteMany({ where: { id: { in: deletableIds } } });
    });

    await Promise.all(
      deletablePurchases.map((p) => deleteOldFile(p.document ?? null)),
    );

    return {
      count: deletableIds.length,
      deletedIds: deletableIds,
      skippedIds,
    };
  }
}
