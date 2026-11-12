# NextOps

NextOps is a multi-tenant business-operations monorepo platform featuring integrated workspaces, AI usage budgets, audit logs, and security controls. 

## System Architecture

The platform is structured around a Next.js App Router frontend, a security proxy gateway, a NestJS backend API, and a PostgreSQL/Redis persistence layer. 

## Key Implemented Features

- **Multi-Tenant Data Model & Isolation:** PostgreSQL 17 models with Prisma, enforced tenant binding (`companyId`), and PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`).
- **Authentication & Access Control:** Argon2id hashing, `HttpOnly` JWT cookies, CSRF protection, Redis token blacklists, rate limiting, and RBAC (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
- **Billing & FinOps (`/billing`):** `FREE`, `PRO`, and `ENTERPRISE` subscription tiers with HMAC webhook verification, atomic price snapshots, and AI budget tracking.
- **Compliance & Security (`/audit`):** Immutable RLS-protected audit logs, AES-256-GCM encrypted off-site backups, and an automated integration test suite.

## Frontend Modules

The interface provides navigation across core routes including `/`, `/billing`, `/audit`, `/account`, `/agentknowledgebase`, `/apihistory`, `/category`, `/order`, `/payment`, `/orderitem`, `/product`, `/project`, `/review`, `/session`, `/user`, `/useraibudget`, `/verificationtoken`, `/warehouse`, `/webhookconfig`, as well as auth flows (`/invite`, `/forgot-password`, `/reset-password`).
## Backend API

NestJS API працює під префіксом `/api`, а фронтенд проксує запити через Next.

### Автентифікація та білінг

Основні маршрути включають:
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/csrf`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/logout-all`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- **Запрошення та білінг:** `POST /api/invitation`, `POST /api/invitation/accept`, `GET /api/billing/status`, `POST /api/billing/checkout`, `POST /api/billing/webhook`, а також `GET /api/audit`.

Стандартні ресурси підтримують CRUD-операції (`account`, `order`, `product`, `project`, `warehouse`, тощо). Колекції повертають пагінацію у форматі `{"data": [], "meta": {"page": 1, "limit": 20, "total": 0, "totalPages": 0}}` (максимальний `limit` — 100). Запити з телом потребують заголовка `Idempotency-Key` для операцій на кшталт `POST /api/order`.

## Безпека та тенантна ізоляція

- **Сесії та токени:** Використовуються `HttpOnly` JWT-куки на 7 днів, захист від CSRF та Redis-чорний список токенів (з можливістю глобального скидання через `logout-all`).
- **Ролі:** `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` із розмежуванням прав на рівні контролерів.
- **Ізоляція даних:** На рівні застосунку `TenantInterceptor` автоматично визначає `companyId` через `AsyncLocalStorage`. На рівні БД (PostgreSQL) застосовується механізм `FORCE ROW LEVEL SECURITY` для ролі `nextops_app` та композитні зовнішні ключі `(id, companyId)`.

## Використання застосунку

1. Запустіть стек (Docker або локально) та відкрийте `http://localhost:3000`.
2. Зареєструйте компанію через `/login` (створюється workspace на плані `FREE` із початковим AI-бюджетом $10.00).
3. Керуйте підпискою в розділі `/billing`, аудитом у `/audit` (доступно для `OWNER`/`ADMIN`), або запрошуйте колег через `POST /api/invitation`.

## Запуск із Docker Compose

1. Скопіюйте `.env.example` у `.env` та змініть паролі й `JWT_SECRET`.
2. Виконайте в корені репозиторію:
   ```powershell
   docker compose up --build
   ```
3. Фронтенд буде доступний на `http://localhost:3000`, а API — на `http://localhost:3001/api`.
4. Для запуску фонового бекап-воркера:
   ```powershell
   docker compose --profile backups up -d backup
   ```

## Запуск без Docker

1. Встановіть залежності:
   ```powershell
   corepack enable
   yarn install --immutable
   ```
2. Запустіть PostgreSQL та Redis, налаштуйте змінні середовища.
3. Провалідуйте схему та згенеруйте клієнт Prisma:
   ```powershell
   yarn db:validate
   yarn db:generate
   yarn db:migrate
   yarn --cwd nextops-backend seed
   ```
4. Запустіть сервіси:
   ```powershell
   yarn start:dev
   ```
   ## Environment variables & Configuration

Усі необхідні змінні оточення (PostgreSQL, Redis, JWT, Stripe, S3 бекапи, SMTP тощо) описані в прикладі конфігурації проєкту (`.env.example`). Керуйте секретами безпечно та не допускайте їхнього потрапляння у системи контролю версій чи логи.

## Prisma schema and database migrations

Схема та міграції знаходяться у `nextops-backend/src/prisma/`. Основні команди управління базою даних включають перевірку, генерацію клієнта, розгортання міграцій та сидинг. Перед оновленням бази обов'язково робіть зашифровані бекапи.

## Backups, CI/CD & Troubleshooting

* **Бекапи:** Використовуйте вбудовані утиліти в `nextops-backend/src/scripts/` для створення та відновлення зашифрованих бекапів (AES-256-GCM) в S3/Cloudflare R2 або через PowerShell.
* **CI/CD:** Кореневі скрипти (`yarn typecheck`, `yarn build`, `yarn lint:frontend`) та автоматизація в GitHub Actions забезпечують перевірку збірки й тестів.
* **Troubleshooting:** У разі проблем із навігацією, помилок авторизації/CSRF чи Prisma — перевіряйте змінні середовища, права ролей та стан сервісів PostgreSQL/Redis.

## Remaining Recommendations Before Live Production Launch

Перед запуском у production переконайтеся, що замінили тестові секрети на безпечні, увімкнули `NODE_ENV=production` та `CSRF_ENABLED=true`, підключили бойові платіжні ключі Stripe, налаштували SMTP та резервне копіювання, а також розгорнули реверс-проксі з TLS-сертифікатами.
## Environment variables

Документація містить таблицю змінних середовища для Compose, Backend, Frontend та скриптів бекапів (`POSTGRES_USER`, `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `BACKUP_ENCRYPTION_KEY` тощо). Секрети не повинні зберігатися у контролі версій.

## Prisma schema and database migrations

- **Schema та міграції:** розміщені у `nextops-backend/src/prisma/schema.prisma` та `nextops-backend/src/prisma/migrations/`.
- **Основні команди:** `yarn db:validate`, `yarn db:generate`, `yarn db:migrate`, а також `yarn --cwd nextops-backend seed`.
- Перед оновленням бази даних необхідно створити зашифрований бекап та протестувати міграції.

## Backups and restore

### Encrypted Off-Site Backups
Створення та відновлення зашифрованих дампів бази даних (`pg_dump` з AES-256-GCM та вивантаженням в S3/R2 або локальну паку `backups/`) виконується через скрипт `cloud-backup.mjs`.

## Development and CI checks

Основні команди збірки, тестування та перевірки типізації задіяні через конвеєр GitHub Actions (`.github/workflows/ci.yml`).

## Troubleshooting

Типові проблеми та методи їх усунення охоплюють помилки авторизації, збої валідації CSRF, помилки підключення до PostgreSQL через Prisma та проблеми конфігурації Next.js.

## Remaining Recommendations Before Live Production Launch

Перед запуском у продакшен необхідно замінити тестові секрети на бойові, встановити `NODE_ENV=production`, налаштувати SSL/TLS та активувати щоденні автоматичні бекапи.
