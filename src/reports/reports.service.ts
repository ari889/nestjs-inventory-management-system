import { Injectable } from '@nestjs/common';
import { DailyMap, MonthlyMap } from 'src/@types/report.types';
import { toNumber } from 'src/common/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Symmary report
   * @param from
   * @param to
   * @returns any
   */
  async summaryReport(from?: Date, to?: Date) {
    const startDate =
      from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const endDate = to ?? new Date();

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [
      purchase,
      totalPurchase,

      sale,
      totalSale,

      expense,
      totalExpense,

      payroll,
      totalPayroll,

      totalItem,

      paymentReceivedNumber,
      paymentReceived,

      cashPaymentSale,
      chequePaymentSale,
      mobilePaymentSale,

      paymentPaidNumber,
      paymentPaid,

      cashPaymentPurchase,
      chequePaymentPurchase,
      mobilePaymentPurchase,

      warehouses,
    ] = await Promise.all([
      // Purchase Summary
      this.prisma.purchase.aggregate({
        where: dateFilter,
        _sum: {
          grandTotal: true,
          paidAmount: true,
          totalTax: true,
          orderTax: true,
        },
      }),

      this.prisma.purchase.count({
        where: dateFilter,
      }),

      // Sale Summary
      this.prisma.sale.aggregate({
        where: dateFilter,
        _sum: {
          grandTotal: true,
          paidAmount: true,
          totalTax: true,
          orderTax: true,
        },
      }),

      this.prisma.sale.count({
        where: dateFilter,
      }),

      // Expense
      this.prisma.expense.aggregate({
        where: dateFilter,
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.count({
        where: dateFilter,
      }),

      // Payroll
      this.prisma.payroll.aggregate({
        where: dateFilter,
        _sum: {
          amount: true,
        },
      }),

      this.prisma.payroll.count({
        where: dateFilter,
      }),

      // Inventory Count
      this.prisma.warehouseProduct.count({
        where: {
          qty: {
            gt: 0,
          },
          product: {
            status: true,
          },
        },
      }),

      // Payment Received Count
      this.prisma.payment.count({
        where: {
          saleId: {
            not: null,
          },
          ...dateFilter,
        },
      }),

      // Payment Received Amount
      this.prisma.payment.aggregate({
        where: {
          saleId: {
            not: null,
          },
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Cash Sale Payment
      this.prisma.payment.aggregate({
        where: {
          saleId: {
            not: null,
          },
          paymentMethod: 'CASH',
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Cheque Sale Payment
      this.prisma.payment.aggregate({
        where: {
          saleId: {
            not: null,
          },
          paymentMethod: 'CHEQUE',
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Mobile Sale Payment
      this.prisma.payment.aggregate({
        where: {
          saleId: {
            not: null,
          },
          paymentMethod: 'MOBILE',
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Payment Paid Count
      this.prisma.payment.count({
        where: {
          purchaseId: {
            not: null,
          },
          ...dateFilter,
        },
      }),

      // Payment Paid Amount
      this.prisma.payment.aggregate({
        where: {
          purchaseId: {
            not: null,
          },
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Cash Purchase Payment
      this.prisma.payment.aggregate({
        where: {
          purchaseId: {
            not: null,
          },
          paymentMethod: 'CASH',
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Cheque Purchase Payment
      this.prisma.payment.aggregate({
        where: {
          purchaseId: {
            not: null,
          },
          paymentMethod: 'CHEQUE',
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Mobile Purchase Payment
      this.prisma.payment.aggregate({
        where: {
          purchaseId: {
            not: null,
          },
          paymentMethod: 'MOBILE',
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Warehouses
      this.prisma.warehouse.findMany({
        where: {
          status: true,
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    const warehouseReports = await Promise.all(
      warehouses.map(async (warehouse) => {
        const [saleSummary, purchaseSummary, expenseSummary] =
          await Promise.all([
            this.prisma.sale.aggregate({
              where: {
                warehouseId: warehouse.id,
                ...dateFilter,
              },
              _sum: {
                grandTotal: true,
                paidAmount: true,
                totalTax: true,
                orderTax: true,
              },
            }),

            this.prisma.purchase.aggregate({
              where: {
                warehouseId: warehouse.id,
                ...dateFilter,
              },
              _sum: {
                grandTotal: true,
                paidAmount: true,
                totalTax: true,
                orderTax: true,
              },
            }),

            this.prisma.expense.aggregate({
              where: {
                warehouseId: warehouse.id,
                ...dateFilter,
              },
              _sum: {
                amount: true,
              },
            }),
          ]);

        return {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,

          sale: {
            grandTotal: toNumber(saleSummary._sum.grandTotal),
            paidAmount: toNumber(saleSummary._sum.paidAmount),
            tax:
              toNumber(saleSummary._sum.totalTax) +
              toNumber(saleSummary._sum.orderTax),
          },

          purchase: {
            grandTotal: toNumber(purchaseSummary._sum.grandTotal),
            paidAmount: toNumber(purchaseSummary._sum.paidAmount),
            tax:
              toNumber(purchaseSummary._sum.totalTax) +
              toNumber(purchaseSummary._sum.orderTax),
          },

          expense: toNumber(expenseSummary._sum.amount),
        };
      }),
    );

    return {
      purchase: {
        grandTotal: toNumber(purchase._sum.grandTotal),
        paidAmount: toNumber(purchase._sum.paidAmount),
        tax:
          toNumber(purchase._sum.totalTax) + toNumber(purchase._sum.orderTax),
        totalPurchase,
      },

      sale: {
        grandTotal: toNumber(sale._sum.grandTotal),
        paidAmount: toNumber(sale._sum.paidAmount),
        tax: toNumber(sale._sum.totalTax) + toNumber(sale._sum.orderTax),
        totalSale,
      },

      expense: {
        amount: toNumber(expense._sum.amount),
        totalExpense,
      },

      payroll: {
        amount: toNumber(payroll._sum.amount),
        totalPayroll,
      },

      totalItem,

      paymentReceived: {
        count: paymentReceivedNumber,
        amount: toNumber(paymentReceived._sum.amount),
        cash: toNumber(cashPaymentSale._sum.amount),
        cheque: toNumber(chequePaymentSale._sum.amount),
        mobile: toNumber(mobilePaymentSale._sum.amount),
      },

      paymentPaid: {
        count: paymentPaidNumber,
        amount: toNumber(paymentPaid._sum.amount),
        cash: toNumber(cashPaymentPurchase._sum.amount),
        cheque: toNumber(chequePaymentPurchase._sum.amount),
        mobile: toNumber(mobilePaymentPurchase._sum.amount),
      },

      warehouses: warehouseReports,
    };
  }

  /**
   * Daily sales report
   * @param warehouseId
   * @param from
   * @param to
   * @returns any
   */
  async dailySaleReport(
    warehouseId: number | undefined,
    from: Date | undefined,
    to: Date | undefined,
  ) {
    const startDate = new Date(
      from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
    const endDate = new Date(to ?? new Date());

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: {
        ...(warehouseId ? { warehouseId } : {}),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalDiscount: true,
        orderDiscount: true,
        totalTax: true,
        orderTax: true,
        shippingCost: true,
        grandTotal: true,
      },
    });

    const grouped = sales.reduce((acc, sale) => {
      // Use local date parts instead of ISO string to avoid UTC shift
      const d = sale.createdAt;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!acc[dateKey]) {
        acc[dateKey] = {
          totalDiscount: 0,
          orderDiscount: 0,
          totalTax: 0,
          orderTax: 0,
          shippingCost: 0,
          grandTotal: 0,
        };
      }

      acc[dateKey].totalDiscount += Number(sale.totalDiscount || 0);
      acc[dateKey].orderDiscount += Number(sale.orderDiscount || 0);
      acc[dateKey].totalTax += Number(sale.totalTax || 0);
      acc[dateKey].orderTax += Number(sale.orderTax || 0);
      acc[dateKey].shippingCost += Number(sale.shippingCost || 0);
      acc[dateKey].grandTotal += Number(sale.grandTotal || 0);

      return acc;
    }, {} as DailyMap);

    return grouped;
  }

  /**
   * Monthly sales report
   * @param warehouseId
   * @param year
   * @returns any
   */
  async monthlySaleReport(warehouseId: number | undefined, year: number) {
    const result: MonthlyMap = {};

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const aggregate = await this.prisma.sale.aggregate({
        where: {
          ...(warehouseId ? { warehouseId } : {}),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          totalDiscount: true,
          orderDiscount: true,
          totalTax: true,
          orderTax: true,
          shippingCost: true,
          grandTotal: true,
        },
      });

      result[month] = {
        totalDiscount: Number(aggregate._sum.totalDiscount || 0),
        orderDiscount: Number(aggregate._sum.orderDiscount || 0),
        totalTax: Number(aggregate._sum.totalTax || 0),
        orderTax: Number(aggregate._sum.orderTax || 0),
        shippingCost: Number(aggregate._sum.shippingCost || 0),
        grandTotal: Number(aggregate._sum.grandTotal || 0),
      };
    }

    return result;
  }

  /**
   * Daily purcshase report
   * @param warehouseId
   * @param from
   * @param to
   * @returns any
   */
  async dailyPurchaseReport(
    warehouseId: number | undefined,
    from: Date | undefined,
    to: Date | undefined,
  ) {
    const startDate = new Date(
      from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
    const endDate = new Date(to ?? new Date());

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const purchases = await this.prisma.purchase.findMany({
      where: {
        ...(warehouseId ? { warehouseId } : {}),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalDiscount: true,
        orderDiscount: true,
        totalTax: true,
        orderTax: true,
        shippingCost: true,
        grandTotal: true,
      },
    });

    const grouped = purchases.reduce((acc, purchase) => {
      // Use local date parts instead of ISO string to avoid UTC shift
      const d = purchase.createdAt;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!acc[dateKey]) {
        acc[dateKey] = {
          totalDiscount: 0,
          orderDiscount: 0,
          totalTax: 0,
          orderTax: 0,
          shippingCost: 0,
          grandTotal: 0,
        };
      }

      acc[dateKey].totalDiscount += Number(purchase.totalDiscount || 0);
      acc[dateKey].orderDiscount += Number(purchase.orderDiscount || 0);
      acc[dateKey].totalTax += Number(purchase.totalTax || 0);
      acc[dateKey].orderTax += Number(purchase.orderTax || 0);
      acc[dateKey].shippingCost += Number(purchase.shippingCost || 0);
      acc[dateKey].grandTotal += Number(purchase.grandTotal || 0);

      return acc;
    }, {} as DailyMap);

    return grouped;
  }

  /**
   * Monthly purchase report
   * @param warehouseId
   * @param year
   * @returns any
   */
  async monthlyPurchaseReport(warehouseId: number | undefined, year: number) {
    const result: MonthlyMap = {};

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const aggregate = await this.prisma.purchase.aggregate({
        where: {
          ...(warehouseId ? { warehouseId } : {}),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          totalDiscount: true,
          orderDiscount: true,
          totalTax: true,
          orderTax: true,
          shippingCost: true,
          grandTotal: true,
        },
      });

      result[month] = {
        totalDiscount: Number(aggregate._sum.totalDiscount || 0),
        orderDiscount: Number(aggregate._sum.orderDiscount || 0),
        totalTax: Number(aggregate._sum.totalTax || 0),
        orderTax: Number(aggregate._sum.orderTax || 0),
        shippingCost: Number(aggregate._sum.shippingCost || 0),
        grandTotal: Number(aggregate._sum.grandTotal || 0),
      };
    }

    return result;
  }
}
