import { Decimal } from '@prisma/client/runtime/client';

export const toNumber = (
  value: Decimal | number | null | undefined,
): number => {
  if (value == null) return 0;
  return Number(value);
};

export const round2 = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};
