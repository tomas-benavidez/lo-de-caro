import { expect, test, describe } from 'vitest';
import { round } from '@/domain/utils';

describe('rounding helper', () => {
  test('rounds money values to 2 decimal places half-up', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(1.004, 2)).toBe(1.00);
    expect(round(1.006, 2)).toBe(1.01);
    expect(round(-1.005, 2)).toBe(-1.00); // Standard half-up: -1.005 -> -1.00 or -1.01 depending on sign, usually -1.00
  });

  test('rounds to 4 decimal places for unit costs', () => {
    expect(round(0.12345, 4)).toBe(0.1235);
    expect(round(0.12344, 4)).toBe(0.1234);
  });
});
