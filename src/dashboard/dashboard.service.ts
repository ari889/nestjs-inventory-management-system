import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboaradQueryDto } from './schemas/dashboard.schema';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DashboaradQueryDto) {
    const [sectionCards, monthlyOverview, yearlyReport, cashFlow] =
      await Promise.all([
        this.getSectionCards(query),
        this.getMonthlyOverview(),
        this.getYearlyReport(),
        this.getCashFlow(),
      ]);

    return { sectionCards, monthlyOverview, yearlyReport, cashFlow };
  }

  private getDateRange(range: DashboaradQueryDto['range']): {
    current: { gte: Date; lte: Date };
    previous: { gte: Date; lte: Date };
  } {
    const now = new Date();

    switch (range) {
      case 'today': {
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
        );

        const prevStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
        );
        const prevEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          23,
          59,
          59,
        );

        return {
          current: { gte: start, lte: end },
          previous: { gte: prevStart, lte: prevEnd },
        };
      }

      case 'thisWeek': {
        const day = now.getDay(); // 0 = Sun
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - day,
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - day + 6,
          23,
          59,
          59,
        );

        const prevStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - day - 7,
        );
        const prevEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - day - 1,
          23,
          59,
          59,
        );

        return {
          current: { gte: start, lte: end },
          previous: { gte: prevStart, lte: prevEnd },
        };
      }

      case 'thisMonth': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
        );

        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
        );

        return {
          current: { gte: start, lte: end },
          previous: { gte: prevStart, lte: prevEnd },
        };
      }

      case 'thisYear':
      default: {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

        const prevStart = new Date(now.getFullYear() - 1, 0, 1);
        const prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

        return {
          current: { gte: start, lte: end },
          previous: { gte: prevStart, lte: prevEnd },
        };
      }
    }
  }

  // ─── Section Cards ────────────────────────────────────────────────────────

  private async getSectionCards({ range }: DashboaradQueryDto) {
    const { current, previous } = this.getDateRange(range);

    const [
      totalSale,
      totalPurchase,
      totalExpense,
      lastSale,
      lastPurchase,
      lastExpense,
      totalCustomers,
      totalSuppliers,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { status: true, createdAt: current },
        _sum: { grandTotal: true },
      }),
      this.prisma.purchase.aggregate({
        where: { status: true, createdAt: current },
        _sum: { grandTotal: true },
      }),
      this.prisma.expense.aggregate({
        where: { status: true, createdAt: current },
        _sum: { amount: true },
      }),
      this.prisma.sale.aggregate({
        where: { status: true, createdAt: previous },
        _sum: { grandTotal: true },
      }),
      this.prisma.purchase.aggregate({
        where: { status: true, createdAt: previous },
        _sum: { grandTotal: true },
      }),
      this.prisma.expense.aggregate({
        where: { status: true, createdAt: previous },
        _sum: { amount: true },
      }),
      this.prisma.customer.count({ where: { status: true } }),
      this.prisma.supplier.count({ where: { status: true } }),
    ]);

    const sale = Number(totalSale._sum?.grandTotal ?? 0);
    const purchase = Number(totalPurchase._sum?.grandTotal ?? 0);
    const expense = Number(totalExpense._sum?.amount ?? 0);
    const profit = sale - purchase - expense;

    const lSale = Number(lastSale._sum?.grandTotal ?? 0);
    const lPurchase = Number(lastPurchase._sum?.grandTotal ?? 0);
    const lExpense = Number(lastExpense._sum?.amount ?? 0);
    const lProfit = lSale - lPurchase - lExpense;

    const delta = (curr: number, prev: number) =>
      prev !== 0 ? Number((((curr - prev) / prev) * 100).toFixed(1)) : null;

    return {
      sale,
      purchase,
      expense,
      profit,
      totalCustomers,
      totalSuppliers,
      deltas: {
        sale: delta(sale, lSale),
        purchase: delta(purchase, lPurchase),
        expense: delta(expense, lExpense),
        profit: delta(profit, lProfit),
      },
    };
  }

  // ─── Monthly Overview (current month pie chart) ───────────────────────────

  private async getMonthlyOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [sale, purchase, expense] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { status: true, createdAt: { gte: startOfMonth } },
        _sum: { grandTotal: true },
      }),
      this.prisma.purchase.aggregate({
        where: { status: true, createdAt: { gte: startOfMonth } },
        _sum: { grandTotal: true },
      }),
      this.prisma.expense.aggregate({
        where: { status: true, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    return {
      sale: Number(sale._sum.grandTotal ?? 0),
      purchase: Number(purchase._sum.grandTotal ?? 0),
      expense: Number(expense._sum.amount ?? 0),
    };
  }

  // ─── Yearly Report (line chart — last 12 months) ──────────────────────────

  private async getYearlyReport() {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        label: d.toLocaleString('default', { month: 'long' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      };
    });

    const rows = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const [sale, purchase, expense] = await Promise.all([
          this.prisma.sale.aggregate({
            where: { status: true, createdAt: { gte: start, lte: end } },
            _sum: { grandTotal: true },
          }),
          this.prisma.purchase.aggregate({
            where: { status: true, createdAt: { gte: start, lte: end } },
            _sum: { grandTotal: true },
          }),
          this.prisma.expense.aggregate({
            where: { status: true, createdAt: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
        ]);

        return {
          month: label,
          totalSale: Number(sale._sum.grandTotal ?? 0),
          totalPurchase: Number(purchase._sum.grandTotal ?? 0),
          totalExpense: Number(expense._sum.amount ?? 0),
        };
      }),
    );

    return rows;
  }

  // ─── Cash Flow (payment received vs sent — last 12 months) ───────────────

  private async getCashFlow() {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        label: d.toLocaleString('default', { month: 'long' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      };
    });

    const rows = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const dateFilter = { createdAt: { gte: start, lte: end } };

        const [received, sent] = await Promise.all([
          // ✅ 'sales' not 'sale' — matches Payment model relation name
          this.prisma.payment.aggregate({
            where: { ...dateFilter, sales: { status: true } },
            _sum: { amount: true },
          }),
          // ✅ 'purchases' not 'purchase' — matches Payment model relation name
          this.prisma.payment.aggregate({
            where: { ...dateFilter, purchases: { status: true } },
            _sum: { amount: true },
          }),
        ]);

        return {
          month: label,
          // ✅ optional chain _sum?. to handle possibly undefined
          received: Number(received._sum?.amount ?? 0),
          sent: Number(sent._sum?.amount ?? 0),
        };
      }),
    );

    return rows;
  }
}
