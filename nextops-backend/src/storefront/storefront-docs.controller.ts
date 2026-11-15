import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'NextOps Storefront & AI Gateway API',
    version: '1.0.0',
    description:
      'Публічний B2B API для підключення інтернет-магазинів, мобільних застосунків та AI-консультантів. Усі запити ізольовані на рівні бази даних через PostgreSQL Row-Level Security (RLS).',
  },
  servers: [{ url: '/api', description: 'NextOps API Server' }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Api-Key',
        description: 'Секретний ключ компанії формату nx_live_... (генерується у розділі /billing)',
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/public/v1/products': {
      get: {
        summary: 'Отримати каталог активних товарів компанії',
        description: 'Вимагає дозвіл (scope): read:products. Ліміт: 120 запитів/хв.',
        responses: {
          '200': { description: 'Список активних товарів із цінами та доступним залишком' },
          '401': { description: 'Недійсний або відкликаний ключ X-Api-Key' },
        },
      },
    },
    '/public/v1/orders': {
      post: {
        summary: 'Створити замовлення з зовнішньої вітрини',
        description:
          'Вимагає дозвіл (scope): write:orders. Автоматично створює замовлення, відправляє чек у Telegram та запускає вихідні HMAC-SHA256 вебхуки.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  currency: { type: 'string', example: 'UAH' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'quantity'],
                      properties: {
                        productId: { type: 'string', format: 'uuid' },
                        quantity: { type: 'integer', minimum: 1, example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Замовлення успішно створено' },
          '403': { description: 'Недостатньо прав або неактивна підписка компанії' },
        },
      },
    },
    '/public/v1/reviews': {
      post: {
        summary: 'Додати або оновити відгук покупця на товар',
        description: 'Вимагає дозвіл (scope): write:reviews.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'rating'],
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                  rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  comment: { type: 'string', example: 'Швидка доставка та чудовий сервіс!' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Відгук збережено' },
        },
      },
    },
    '/public/v1/ask': {
      post: {
        summary: 'Запитати корпоративного RAG AI-консультанта компанії',
        description:
          'Вимагає дозвіл (scope): read:products та активний ліміт UserAiBudget. Шукає відповідь у документах бази знань та товарах компанії.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: {
                    type: 'string',
                    example: 'Які умови гарантії та яка ціна ноутбука NextOps Pro?',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Згенерована відповідь AI із посиланнями на джерела' },
          '403': { description: 'Вичерпано місячний ліміт UserAiBudget' },
        },
      },
    },
  },
} as const;

const DOCS_HTML = `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NextOps Storefront API Docs</title>
    <style>
      body { margin: 0; background: #090d16; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    </style>
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="https://jsdelivr.net"></script>
  </body>
</html>`;

@Controller()
@Public()
export class StorefrontDocsController {
  @Get('openapi.json')
  getOpenApiSpec(): typeof OPENAPI_SPEC {
    return OPENAPI_SPEC;
  }

  @Get('docs')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getDocsUi(): string {
    return DOCS_HTML;
  }
}
