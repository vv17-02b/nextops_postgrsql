# NextOps — Мультитенантна B2B SaaS-платформа (CRM, ERP, Storefront API та AI-асистент)

**NextOps** — сучасна корпоративна платформа для автоматизації продажів, складського обліку, білінгу підписок, клієнтських вітрин та корпоративного RAG AI-асистента з багаторівневою ізоляцією даних на рівні PostgreSQL Row-Level Security (RLS).

---

## 1. Ключові можливості та архітектура

- **Трирівнева мультитенантність (Data Isolation):**
  1. Контекст поточного орендаря (`TenantContext` на базі `AsyncLocalStorage`).
  2. Проксі-обгортка над Prisma (`PrismaService`), яка автоматично передає `app.current_company_id` у транзакцію БД.
  3. Примусові політики **PostgreSQL Row-Level Security (RLS)** та складені зовнішні ключі `[id, companyId]` у базі даних.
- **Безпека корпоративного рівня:**
  - Хешування паролів за алгоритмом **Argon2id** (`@node-rs/argon2`).
  - `HttpOnly` сесійні cookie + миттєвий відклик JWT та керування епохами сесій (`sessionEpoch`) у **Redis**.
  - Захист від CSRF (`Double Submit Cookie`), Rate Limiting у Redis та ідемпотентність мутуючих запитів (`Idempotency-Key` на атомарних Lua-скриптах).
  - Гранулярні API-ключі (`nx_live_...`) із SHA-256 хешуванням та контролем дозволів (`scopes`).
- **Керування SaaS-платформою (Super Admin):**
  - Панель власника платформи (`/api/platform/companies`) з моніторингом усіх робочих просторів, ручною активацією/подарунком тарифів, миттєвим призупиненням (`SUSPENDED`) та автоматичним очищенням прострочених і порожніх акаунтів.
- **Електронна комерція, AI та інтеграції:**
  - Публічний Storefront & AI Gateway (`/api/public/v1/*`) з інтерактивною документацією OpenAPI 3.1 (`/api/docs`).
  - Корпоративний RAG AI-асистент із пошуком по базі знань і каталогу товарів та атомарним списанням бюджету `UserAiBudget`.
  - Вихідні вебхуки зі стандартизованим криптографічним підписом `HMAC-SHA256` (`t=...,v1=...`) та захистом від SSRF-атак.
  - Двостороння інтеграція з Telegram (миттєві чеки замовлень із кнопками підтвердження/скасування та вхідний фідбек у реальному часі).

---

## 2. Технологічний стек

- **Backend:** Node.js, NestJS, TypeScript (сувора типізація без `any`), Prisma ORM, BullMQ.
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS.
- **Бази даних та черги:** PostgreSQL 17 (RLS, `pg_stat_statements`), Redis 7.
- **Інфраструктура:** Docker, Docker Compose, зашифровані резервні копії (`AES-256-GCM`).
---

## 3. Структура модулів та маршрутів

### Сторінки фронтенду (`nextops-frontend/src/app`)
- **Головна та аналітика:** `/` (живий дашборд керівника з KPI, статусами замовлень та динамікою виручки)
- **Комерція та склад:** `/product`, `/category`, `/warehouse`, `/order`, `/orderitem`, `/payment`, `/review`
- **Білінг та інтеграції:** `/billing`, `/webhookconfig`
- **Безпека та аудит:** `/audit`, `/apihistory`, `/account`, `/user`, `/session`, `/verificationtoken`
- **AI та проєкти:** `/project`, `/agentknowledgebase`, `/useraibudget`
- **Авторизація:** `/login`, `/invite`, `/forgot-password`, `/reset-password`

### Основні ендпоінти Backend API (`/api`)
- **Автентифікація:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/csrf`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/logout-all`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- **Керування платформою (Super Admin):** `GET /api/platform/companies`, `POST /api/platform/companies/:id/activate`, `POST /api/platform/companies/:id/suspend`, `POST /api/platform/companies/cleanup-empty`, `DELETE /api/platform/companies/:id`
- **Команда та аудит:** `POST /api/invitation`, `POST /api/invitation/accept`, `GET /api/audit`, `DELETE /api/audit/telegram-logs`
- **Білінг, API-ключі та Telegram:** `GET /api/billing/status`, `POST /api/billing/checkout`, `POST /api/billing/webhook`, `GET/POST /api/api-keys`, `DELETE /api/api-keys/:id`, `POST /api/billing/telegram`, `POST /api/billing/telegram/connect-env`, `GET /api/billing/notifications`, `GET /api/billing/sounds`
- **Публічний Storefront & AI Gateway (`X-Api-Key`):** `GET /api/public/v1/products`, `POST /api/public/v1/orders`, `POST /api/public/v1/reviews`, `POST /api/public/v1/ask`, `GET /api/docs`, `GET /api/openapi.json`
- **AI-база знань та глобальний пошук:** `POST /api/agentknowledgebase/ask`, `GET /api/search`
- **Товари, склад та замовлення:** `GET/POST /api/product`, `POST /api/product/import-csv`, `GET /api/product/export-csv`, `GET/POST /api/order`, `GET/POST /api/category`, `GET/POST /api/warehouse`, `GET/POST /api/review`

---

## 4. Керівництво із запуску та роботи з проєктом

### Варіант А: Швидкий запуск через Docker Compose
1. Скопіюйте файл прикладу змінних середовища та задайте власні паролі:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Запустіть усі контейнери з кореня репозиторію:
   ```powershell
   docker compose up -d --build
   ```
3. Відкрийте у браузері:
   - **Frontend:** `http://localhost:3000`
   - **Backend API:** `http://localhost:3001/api`
   - **Інтерактивна документація OpenAPI 3.1:** `http://localhost:3001/api/docs`
4. Для запуску фонового сервісу автоматичних бекапів:
   ```powershell
   docker compose --profile backups up -d backup
   ```

### Варіант Б: Локальний запуск для розробки (без Docker для Node.js)
1. **Встановіть залежності в корені монорепозиторію:**
   ```powershell
   corepack enable
   yarn install --immutable
   ```
2. **Запустіть бази даних (PostgreSQL 17 та Redis 7):**
   ```powershell
   docker compose up -d postgres redis
   ```
3. **Налаштуйте змінні середовища:**
   ```powershell
   Copy-Item .\nextops-backend\.env.example .\nextops-backend\.env
   Copy-Item .\nextops-frontend\.env.example .\nextops-frontend\.env.local
   ```
4. **Підготуйте базу даних (валідація, генерація клієнта Prisma, міграції та стартові дані):**
   ```powershell
   yarn db:validate
   yarn db:generate
   yarn db:migrate
   yarn --cwd nextops-backend seed
   ```
5. **Запустіть одночасно Backend (`:3001`) та Frontend (`:3000`):**
   ```powershell
   yarn start:dev
   ```

### Як працювати з системою після запуску
1. Перейдіть на `http://localhost:3000/login` і увійдіть під тестовим адміністратором (`admin@nextops.local` / `nextops123456789`) або створіть власну компанію.
2. Відкрийте розділ **`/billing`**, перевірте підключення Telegram-бота та згенеруйте API-ключ **`nx_live_...`** для зовнішньої вітрини.
3. Використовуйте **живий пошук у лівому меню** для миттєвого пошуку товарів, замовлень, клієнтів та переходу до **RAG AI-консультанта** (`/agentknowledgebase`).
4. Оформіть замовлення у **`/order`** — у Telegram миттєво прийде чек із кнопками підтвердження, а будь-яка відповідь у чаті бота викличе спливаюче сповіщення зі звуком на сайті та запис у **`/audit`**.
---

## 5. Довідник основних команд

| Команда | Призначення |
| :--- | :--- |
| `yarn start:dev` | Одночасний запуск Backend (`:3001`) та Frontend (`:3000`) у режимі розробки |
| `yarn build` | Повна продакшен-збірка Backend та Frontend |
| `yarn typecheck` | Перевірка суворої типізації TypeScript у всьому монорепозиторії |
| `yarn lint:frontend` | Перевірка якості коду фронтенду (ESLint) |
| `yarn --cwd nextops-backend test` | Запуск інтеграційних тестів безпеки PostgreSQL RLS, білінгу та вебхуків |
| `node scan_audit.js` | Аудит кодової бази на відсутність `any` та перевірка `UserAiBudget` |
| `yarn db:validate` | Перевірка коректності схеми `schema.prisma` |
| `yarn db:generate` | Генерація типізованого клієнта Prisma |
| `yarn db:migrate` | Застосування міграцій та політик PostgreSQL RLS |
| `yarn --cwd nextops-backend seed` | Заповнення бази тарифами, каталогом, замовленнями, відгуками та базою знань AI |

---

## 6. Налаштування змінних середовища (`.env`)

| Змінна | Опис | Приклад |
| :--- | :--- | :--- |
| `DATABASE_URL` | Підключення адміністратора міграцій PostgreSQL | `postgresql://postgres:change_me_pg_pass@localhost:5432/nextops_db?schema=public` |
| `APP_DATABASE_URL` | Підключення застосунку під роллю `nextops_app` (із примусовим RLS) | `postgresql://nextops_app:change_me_app_pass@localhost:5432/nextops_db?schema=public` |
| `REDIS_URL` | Підключення до сервера Redis 7 | `redis://:change_me_redis_pass@localhost:6379` |
| `JWT_SECRET` | Секретний ключ підпису токенів (мінімум 32 символи) | `replace-with-random-32-character-secret-key` |
| `BOOTSTRAP_ADMIN_EMAIL` | Email власника SaaS-платформи для доступу до `/platform/companies` | `admin@nextops.local` |
| `FRONTEND_URL` | Точний origin фронтенду для CORS та платіжних посилань | `http://localhost:3000` |
| `CORS_ORIGINS` | Дозволені домени фронтенду через кому | `http://localhost:3000` |
| `CSRF_ENABLED` | Захист від CSRF-атак (`true` для production) | `true` |
| `AUTH_COOKIE_SAME_SITE` | Політика cookie (`lax` для одного домену, `none` для різних доменів по HTTPS) | `lax` |
| `AUTH_COOKIE_SECURE` | Обов'язковий HTTPS для cookie (`true` у production) | `false` |
| `STRIPE_SECRET_KEY` | Ключ Stripe API (якщо порожній — працює Sandbox Demo Checkout) | `sk_live_...` або порожньо |
| `BILLING_WEBHOOK_SECRET` | Секретний ключ перевірки підпису `X-Billing-Signature` | `whsec_...` |
| `TELEGRAM_BOT_TOKEN` | Токен платформного Telegram-бота для підключення в 1 клік | `123456789:AAH...` |
| `TELEGRAM_CHAT_ID` | Системний Chat ID за замовчуванням | `384920194` |
| `TELEGRAM_LOGS_RETENTION_DAYS` | Кількість днів зберігання вхідних повідомлень Telegram | `14` |
| `API_HISTORY_RETENTION_DAYS` | Кількість днів зберігання історії API-запитів | `30` |
| `AI_ENABLED` | Увімкнення AI-модуля та аналітики | `true` |
| `OPENAI_API_KEY` | Ключ OpenAI API (якщо порожній — працює вбудований Local RAG Engine) | `sk-proj-...` або порожньо |
| `BACKUP_ENCRYPTION_KEY` | Ключ шифрування резервних копій AES-256-GCM | `64 hex-символи` |
---

## 7. Рекомендації та подальший розвиток (Roadmap)

### Обов'язковий чекліст інфраструктури та безпеки перед Production
1. **Заміна секретів:** Згенеруйте нові криптографічно стійкі паролі для PostgreSQL, Redis, `JWT_SECRET` та `BACKUP_ENCRYPTION_KEY`.
2. **HTTPS та безпека сесій:** Встановіть `NODE_ENV="production"`, `CSRF_ENABLED="true"` та `AUTH_COOKIE_SECURE="true"`, розмістивши платформу за реверс-проксі (`Caddyfile` / Nginx / Cloudflare) із дійсним SSL-сертифікатом.
3. **Примусовий RLS у Docker (`APP_DATABASE_URL`):** Переконайтеся, що контейнер `backend` у `docker-compose.yml` підключається до бази через `APP_DATABASE_URL` під непривілейованою роллю `nextops_app` (без прав `SUPERUSER` / `BYPASSRLS`), щоб політики Row-Level Security працювали на рівні ядра PostgreSQL.
4. **Транзакційна пошта:** Підключіть поштовий API-провайдер (**Resend**, **Postmark** або **Amazon SES**) для автоматичної відправки листів підтвердження реєстрації, запрошень у команду (`/invite`) та відновлення пароля.
5. **Хмарне сховище медіа (S3 / R2 + CDN):** Перенесіть папку `uploads/` у приватний бакет **AWS S3** або **Cloudflare R2** за CDN із збереженням заголовків `Cache-Control` та підписаних URL для приватних документів компаній.
6. **Автоматичні бекапи:** Налаштуйте щоденний запуск сервісу `backup` (`docker compose --profile backups up -d backup`) або утиліти `nextops-backend/src/scripts/cloud-backup.mjs` із вивантаженням зашифрованих дампів за межі сервера.
7. **Безпечні міграції без простоїв (Zero-Downtime DDL):** Для змін схеми на живій базі використовуйте патерн *Expand & Contract* (додавання нових колонок як `nullable` перед видаленням старих) та встановлюйте `SET lock_timeout = '3s';` перед `ALTER TABLE`, щоб уникнути блокування `ACCESS EXCLUSIVE` під трафіком.

### Технічні доопрацювання в коді (за результатами аудиту)
1. **Виправлення URL зовнішніх сервісів перед ввімкненням бойових ключів:**
   - У `nextops-backend/src/billing/billing.service.ts`: виправити шаблон посилання Telegram на `https://t.me{botUsername}?start=connect_${activeCompanyId}` та змінити ендпоінт Stripe Checkout на `https://stripe.com`.
   - У `nextops-backend/src/agentknowledgebase/agentknowledgebase.service.ts`: змінити ендпоінт OpenAI на `https://openai.com`.
2. **Docker Healthcheck та `rawBody`:**
   - У `docker-compose.yml` вказати повний шлях готовності бекенду: `http://127.0.0`.
   - У `nextops-backend/src/main.ts` увімкнути `{ rawBody: true }` у `NestFactory.create`, щоб перевірка криптографічного підпису `X-Billing-Signature` у `BillingController` працювала з оригінальним буфером запиту.
3. **Атомарне резервування залишків складу при замовленні:**
   - У `nextops-backend/src/order/order.service.ts` додати перевірку та списання залишків `Warehouse` всередині транзакції створення замовлення (`updateMany` з умовою `quantity: { gte: item.quantity }`), а також повернення залишків при скасуванні замовлення (через CRM або Telegram-кнопку).
4. **Ізоляція `Idempotency-Key` між вкладками на фронтенді:**
   - У `nextops-frontend/src/lib/api.ts` включити змінну `tabIdempotencySalt` у формування рядка `raw` усередині `getOrCreateTabIdempotencyKey`, щоб ключі ідемпотентності не перетиналися між різними вкладками браузера.
5. **Точний захист шляху при видаленні директорії компанії:**
   - У `nextops-backend/src/platform/platform.service.ts` використовувати `companyUploadsDir.startsWith(uploadsRoot + sep)` під час каскадного видалення медіафайлів компанії.

---

### Реалізовані функціональні етапи (Roadmap — 7/7 виконано)
1. **✅ Живий дашборд керівника (`/`):** Головна панель аналітики з картками KPI (виручка, середній чек, конверсія, AI-бюджет, квоти тарифу), статусами замовлень, топ-5 товарами, контролем складських залишків та динамікою виручки за 7 днів.
2. **✅ Фільтрація та очищення в журналі аудиту (`/audit`):** Вкладки-фільтри (*«Усі події»*, *«Безпека та замовлення»*, *«Повідомлення Telegram»*) та безпечне очищення старих повідомлень Telegram в 1 клік зі збереженням Read-Only політики безпеки.
3. **✅ Enterprise API-платформа (`CompanyApiKey` + `X-Api-Key`):** Генерація API-ключів із SHA-256 хешуванням, кешуванням у Redis (`TTL 60с`), лімітами за тарифами та ротацією терміну дії.
4. **✅ Публічний Storefront & AI Gateway (`/api/public/v1/*`):** Ізольовані ендпоінти для зовнішніх вітрин (каталог, замовлення, відгуки, AI-консультант) та інтерактивна документація OpenAPI 3.1 (`/api/docs`).
5. **✅ Повноцінний RAG AI-асистент (`/agentknowledgebase`):** Пошук по документах і товарах компанії (OpenAI LLM + Local RAG Engine) із атомарним списанням бюджету `UserAiBudget`.
6. **✅ Захищені вихідні вебхуки (`WebhookConfig`):** Криптографічний підпис `HMAC-SHA256`, черги BullMQ та захист від SSRF-атак.
7. **✅ Мультитенантний глобальний пошук (`GET /api/search`):** Миттєвий пошук по товарах, замовленнях, користувачах та базі знань поточної компанії із кешем у Redis та переходом до AI-консультанта.
