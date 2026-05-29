import { Injectable } from '@nestjs/common';
import { toNumber } from 'src/common/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
