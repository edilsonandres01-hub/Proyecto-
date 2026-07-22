import type { FiscalCountry } from '../types.js';
import type { FiscalAdapter } from './FiscalAdapter.js';
import { MockCfdiAdapter } from './MockCfdiAdapter.js';
import { MockNfeAdapter } from './MockNfeAdapter.js';

export function createFiscalAdapter(country: FiscalCountry): FiscalAdapter {
  switch (country) {
    case 'MX':
      return new MockCfdiAdapter();
    case 'BR':
      return new MockNfeAdapter();
    default: {
      const _exhaustive: never = country;
      throw new Error(`Unsupported fiscal country: ${String(_exhaustive)}`);
    }
  }
}
