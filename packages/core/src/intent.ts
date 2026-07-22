import type { Intent } from './types.js';

type KeywordRule = {
  intent: Exclude<Intent, 'unknown'>;
  keywords: readonly string[];
};

/**
 * Keyword rules for Spanish (es-MX) and Portuguese (pt-BR).
 * First matching intent wins by score (count of keyword hits).
 */
const RULES: readonly KeywordRule[] = [
  {
    intent: 'product',
    keywords: [
      'stock',
      'inventario',
      'estoque',
      'precio',
      'preço',
      'preco',
      'producto',
      'productos',
      'produto',
      'produtos',
      'catalogo',
      'quantidade',
      'cantidad',
      'sku',
      'cuanto',
      'quanto',
      'tienes',
      'tem',
      'vende',
      'vender',
    ],
  },
  {
    intent: 'payment',
    keywords: [
      'cobrar',
      'cobro',
      'pagar',
      'pago',
      'pagamento',
      'pix',
      'spei',
      'codi',
      'clabe',
      'transferencia',
      'efectivo',
      'dinheiro',
      'cobranca',
    ],
  },
  {
    intent: 'fiscal',
    keywords: [
      'factura',
      'facturar',
      'facturacion',
      'ticket',
      'cfdi',
      'sat',
      'nf-e',
      'nfe',
      'nota fiscal',
      'sefaz',
      'timbrado',
      'timbrar',
      'rfc',
      'cnpj',
      'xml',
    ],
  },
  {
    intent: 'support',
    keywords: [
      'ayuda',
      'ajuda',
      'help',
      'soporte',
      'suporte',
      'error',
      'problema',
      'humano',
      'agente',
      'asistencia',
      'atendimento',
    ],
  },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Classify a user utterance into a domain intent using
 * Spanish/Portuguese keyword heuristics (no ML).
 */
export function classifyIntent(text: string): Intent {
  if (!text.trim()) {
    return 'unknown';
  }

  const normalized = normalize(text);
  let best: Intent = 'unknown';
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      const needle = normalize(keyword);
      if (needle && normalized.includes(needle)) {
        score += needle.includes(' ') ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.intent;
    }
  }

  return bestScore > 0 ? best : 'unknown';
}

export const IntentClassifier = {
  classifyIntent,
} as const;
