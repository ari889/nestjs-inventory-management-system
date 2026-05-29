import { Decimal } from '@prisma/client/runtime/client';

export const toNumber = (value: Decimal | string | number): number => {
  return new Decimal(value).toNumber();
};

export const round2 = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};
