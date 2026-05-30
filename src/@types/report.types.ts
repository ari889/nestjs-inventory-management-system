type DailySummary = {
  totalDiscount: number;
  orderDiscount: number;
  totalTax: number;
  orderTax: number;
  shippingCost: number;
  grandTotal: number;
};

export type DailyMap = Record<string, DailySummary>;

export type MonthlySummary = {
  totalDiscount: number;
  orderDiscount: number;
  totalTax: number;
  orderTax: number;
  shippingCost: number;
  grandTotal: number;
};

export type MonthlyMap = Record<number, MonthlySummary>;
