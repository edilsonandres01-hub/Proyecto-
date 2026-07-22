import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'PyMEBot Platform API',
    version: '1.0.0',
    description:
      'API pública de plataforma para productos, pedidos, pagos y facturas (sandbox). Autenticación vía header X-Api-Key.',
  },
  servers: [{ url: '/', description: 'App actual' }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Api-Key',
        description: 'Clave de API. Demo: pymebot_demo_key',
      },
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          sku: { type: 'string' },
          name: { type: 'string' },
          priceCents: { type: 'integer' },
          stockQty: { type: 'integer' },
          currency: { type: 'string', example: 'MXN' },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['sku', 'name', 'priceCents'],
        properties: {
          tenantId: { type: 'string', default: 'tenant_demo_mx' },
          sku: { type: 'string' },
          name: { type: 'string' },
          priceCents: { type: 'integer' },
          stockQty: { type: 'integer', default: 0 },
          currency: { type: 'string', default: 'MXN' },
        },
      },
      CreatePaymentRequest: {
        type: 'object',
        required: ['orderId'],
        properties: {
          tenantId: { type: 'string', default: 'tenant_demo_mx' },
          orderId: { type: 'string' },
          rail: {
            type: 'string',
            enum: ['spei', 'codi', 'pix', 'cash'],
            default: 'spei',
          },
        },
      },
      CreateInvoiceRequest: {
        type: 'object',
        required: ['orderId'],
        properties: {
          tenantId: { type: 'string', default: 'tenant_demo_mx' },
          orderId: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/api/v1/products': {
      get: {
        summary: 'Listar productos',
        operationId: 'listProducts',
        parameters: [
          {
            name: 'tenantId',
            in: 'query',
            schema: { type: 'string', default: 'tenant_demo_mx' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de productos del tenant',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tenantId: { type: 'string' },
                    products: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'API key inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear producto',
        operationId: 'createProduct',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProductRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Producto creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          '401': {
            description: 'API key inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/v1/orders': {
      get: {
        summary: 'Listar pedidos',
        operationId: 'listOrders',
        parameters: [
          {
            name: 'tenantId',
            in: 'query',
            schema: { type: 'string', default: 'tenant_demo_mx' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de pedidos del tenant',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tenantId: { type: 'string' },
                    orders: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          '401': {
            description: 'API key inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/v1/payments': {
      post: {
        summary: 'Crear intención de pago',
        operationId: 'createPayment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePaymentRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pago / intent creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    payment: { type: 'object' },
                    intent: { type: 'object' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'API key inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Pedido no encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/v1/invoices': {
      post: {
        summary: 'Emitir borrador de factura',
        operationId: 'createInvoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateInvoiceRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Borrador fiscal emitido (sandbox)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invoice: { type: 'object' },
                    disclaimer: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'API key inválida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Pedido no encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function GET() {
  return NextResponse.json(openApiSpec);
}
