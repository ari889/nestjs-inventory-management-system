type DailySaleSummary = {
  totalDiscount: number;
  orderDiscount: number;
  totalTax: number;
  orderTax: number;
  shippingCost: number;
  grandTotal: number;
};

export type DailySaleMap = Record<string, DailySaleSummary>;
