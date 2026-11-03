import { BadRequestException } from '@nestjs/common';

export const MAX_MINOR_UNITS = 2_147_483_647;

export function toMinorUnits(amount: number): number {
  const minorUnits = Math.round(amount * 100);
  if (
    !Number.isFinite(amount)
    || !Number.isSafeInteger(minorUnits)
    || minorUnits > MAX_MINOR_UNITS
    || amount < 0
    || Math.abs(amount * 100 - minorUnits) > 1e-7
  ) {
    throw new BadRequestException('Money amounts must be non-negative and have at most two decimal places.');
  }
  return minorUnits;
}
