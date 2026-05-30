type DailySaleSummary = {
  totalDiscount: number;
  orderDiscount: number;
  totalTax: number;
  orderTax: number;
  shippingCost: number;
  grandTotal: number;
};

export type DailySaleMap = Record<string, DailySaleSummary>;

export type MonthlySaleSummary = {
  totalDiscount: number;
  orderDiscount: number;
  totalTax: number;
  orderTax: number;
  shippingCost: number;
  grandTotal: number;
};

export type MonthlySaleMap = Record<number, MonthlySaleSummary>;
