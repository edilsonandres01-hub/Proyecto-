export type TaxObligation = {
  code: string;
  title: string;
  dueDate: Date;
  daysUntil: number;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Next occurrence of `dayOfMonth` on or after `asOf` (date-only). */
function nextDayOfMonth(asOf: Date, dayOfMonth: number): Date {
  const base = startOfDay(asOf);
  let candidate = new Date(base.getFullYear(), base.getMonth(), dayOfMonth);
  if (candidate < base) {
    candidate = new Date(base.getFullYear(), base.getMonth() + 1, dayOfMonth);
  }
  return candidate;
}

function diffDays(asOf: Date, due: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(due).getTime() - startOfDay(asOf).getTime()) / msPerDay);
}

/**
 * Upcoming tax filing obligations for MX (IVA + ISR provisional on day 17)
 * or BR (DAS Simples on day 20), relative to `asOf`.
 */
export function getUpcomingObligations(
  country: 'MX' | 'BR',
  asOf: Date,
): TaxObligation[] {
  if (country === 'BR') {
    const dueDate = nextDayOfMonth(asOf, 20);
    return [
      {
        code: 'BR_DAS_SIMPLES',
        title: 'DAS Simples Nacional',
        dueDate,
        daysUntil: diffDays(asOf, dueDate),
      },
    ];
  }

  const dueDate = nextDayOfMonth(asOf, 17);
  const days = diffDays(asOf, dueDate);
  return [
    {
      code: 'MX_IVA_MENSUAL',
      title: 'IVA declaración mensual',
      dueDate,
      daysUntil: days,
    },
    {
      code: 'MX_ISR_PROVISIONAL',
      title: 'ISR provisional',
      dueDate,
      daysUntil: days,
    },
  ];
}
