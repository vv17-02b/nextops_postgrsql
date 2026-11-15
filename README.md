## 4. Структура модулів та маршрутів

### Сторінки фронтенду (`nextops-frontend/src/app`)
- **Головна та аналітика:** `/` (живий дашборд керівника з KPI, статусами замовлень та динамікою виручки)
- **Комерція та склад:** `/product`, `/category`, `/warehouse`, `/order`, `/orderitem`, `/payment`, `/review`
- **Білінг та інтеграції:** `/billing`, `/webhookconfig`
- **Безпека та аудит:** `/audit`, `/apihistory`, `/account`, `/user`, `/session`, `/verificationtoken`
- **AI та проєкти:** `/project`, `/agentknowledgebase`, `/useraibudget`
- **Авторизація:** `/login`, `/invite`, `/forgot-password`, `/reset-password`

### Основні ендпоінти Backend API (`/api`)
- **Автентифікація:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/csrf`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/logout-all`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- **Команда та аудит:** `POST /api/invitation`, `POST /api/invitation/accept`, `GET /api/audit`, `DELETE /api/audit/telegram-logs`
- **Білінг, API-ключі та Telegram:** `GET /api/billing/status`, `POST /api/billing/checkout`, `POST /api/billing/webhook`, `GET/POST /api/billing/api-keys`, `DELETE /api/billing/api-keys/:id`, `POST /api/billing/telegram`, `POST /api/billing/telegram/connect-env`, `GET /api/billing/notifications`, `GET /api/billing/sounds`
- **Публічний Storefront & AI Gateway (`X-Api-Key`):** `GET /api/public/v1/products`, `POST /api/public/v1/orders`, `POST /api/public/v1/reviews`, `POST /api/public/v1/ask`, `GET /api/docs`, `GET /api/openapi.json`
- **AI-база знань та глобальний пошук:** `POST /api/agentknowledgebase/ask`, `GET /api/search`
- **Товари, склад та замовлення:** `GET/POST /api/product`, `POST /api/product/import-csv`, `GET /api/product/export-csv`, `GET/POST /api/order`, `GET/POST /api/category`, `GET/POST /api/warehouse`, `GET/POST /api/review`

---

## 5. Керівництво із запуску та роботи з проєктом

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
4. Для запуску фонового сервісу автоматичних зашифрованих бекапів:
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

## 6. Довідник основних команд

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
## 7. Налаштування змінних середовища (`.env`)

| Змінна | Опис | Приклад |
| :--- | :--- | :--- |
| `DATABASE_URL` | Підключення адміністратора міграцій PostgreSQL | `postgresql://postgres:change_me_pg_pass@localhost:5432/nextops_db?schema=public` |
| `APP_DATABASE_URL` | Підключення застосунку під роллю `nextops_app` (із примусовим RLS) | `postgresql://nextops_app:change_me_app_pass@localhost:5432/nextops_db?schema=public` |
| `REDIS_URL` | Підключення до сервера Redis 7 | `redis://:change_me_redis_pass@localhost:6379` |
| `JWT_SECRET` | Секретний ключ підпису токенів (мінімум 32 символи) | `replace-with-random-32-character-secret-key` |
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
| `BACKUP_ENCRYPTION_KEY` | Ключ шифрування резервних копій AES-256-GCM | 64 hex-символи |

---

## 8. Рекомендації та подальший розвиток (Roadmap)

### Обов'язковий чекліст перед виходом у Production (в інтернет)
1. **Заміна секретів:** Згенеруйте нові криптографічно стійкі паролі для PostgreSQL, Redis, `JWT_SECRET` та `BACKUP_ENCRYPTION_KEY`.
2. **HTTPS та безпека сесій:** Встановіть `NODE_ENV="production"`, `CSRF_ENABLED="true"` та `AUTH_COOKIE_SECURE="true"`, розмістивши платформу за реверс-проксі (`Caddyfile` / Nginx / Cloudflare) із дійсним SSL-сертифікатом.
3. **Транзакційна пошта:** Підключіть поштовий API-провайдер (**Resend**, **Postmark** або **Amazon SES**) для автоматичної відправки листів підтвердження реєстрації, запрошень у команду (`/invite`) та відновлення пароля.
4. **Хмарне сховище медіа (S3 / R2 + CDN):** Перенесіть папку `uploads/` у приватний бакет **AWS S3** або **Cloudflare R2** за CDN із збереженням заголовків `Cache-Control` та підписаних URL для приватних документів компаній.
5. **Автоматичні бекапи:** Налаштуйте щоденний запуск сервісу `backup` (`docker compose --profile backups up -d backup`) або утиліти `nextops-backend/src/scripts/cloud-backup.mjs`.

### Реалізовані функціональні етапи (Roadmap — 7/7 виконано)
1. **✅ Живий дашборд керівника (`/`):** Головна панель аналітики з картками KPI (виручка, середній чек, конверсія, AI-бюджет, квоти тарифу), статусами замовлень, топ-5 товарами, контролем складських залишків та динамікою виручки за 7 днів.
2. **✅ Фільтрація та очищення в журналі аудиту (`/audit`):** Вкладки-фільтри (*«Усі події»*, *«Безпека та замовлення»*, *«Повідомлення Telegram»*) та безпечне очищення старих повідомлень Telegram в 1 клік зі збереженням Read-Only політики безпеки.
3. **✅ Enterprise API-платформа (`CompanyApiKey` + `X-Api-Key`):** Генерація API-ключів із SHA-256 хешуванням, кешуванням у Redis (`TTL 60с`), лімітами за тарифами та ротацією терміну дії.
4. **✅ Публічний Storefront & AI Gateway (`/api/public/v1/*`):** Ізольовані ендпоінти для зовнішніх вітрин (каталог, замовлення, відгуки, AI-консультант) та інтерактивна документація OpenAPI 3.1 (`/api/docs`).
5. **✅ Повноцінний RAG AI-асистент (`/agentknowledgebase`):** Пошук по документах і товарах компанії (OpenAI LLM + Local RAG Engine) із атомарним списанням бюджету `UserAiBudget`.
6. **✅ Захищені вихідні вебхуки (`WebhookConfig`):** Криптографічний підпис `HMAC-SHA256`, черги BullMQ та захист від SSRF-атак.
7. **✅ Мультитенантний глобальний пошук (`GET /api/search`):** Миттєвий пошук по товарах, замовленнях, користувачах та базі знань поточної компанії із кешем у Redis та переходом до AI-консультанта.

6. **Безпечні міграції без простоїв (Zero-Downtime DDL):** Для змін схеми на живій базі використовуйте патерн *Expand & Contract* (додавання нових колонок як `nullable` перед видаленням старих) та встановлюйте `SET lock_timeout = '3s';` перед `ALTER TABLE`, щоб уникнути блокування `ACCESS EXCLUSIVE` під трафіком.
