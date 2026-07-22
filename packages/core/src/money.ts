import type { CurrencyCode } from './types.js';

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  MXN: 'es-MX',
  BRL: 'pt-BR',
};

/**
 * Format an amount in cents as a localized currency string.
 * Example: formatMoney(1999, 'MXN') → "$19.99"
 */
export function formatMoney(
  amountCents: number,
  currency: CurrencyCode,
): string {
  if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents)) {
    throw new Error('amountCents must be an integer');
  }
  if (currency !== 'MXN' && currency !== 'BRL') {
    throw new Error(`Unsupported currency: ${String(currency)}`);
  }

  const amount = amountCents / 100;
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    style: 'currency',
    currency,
  }).format(amount);
}
