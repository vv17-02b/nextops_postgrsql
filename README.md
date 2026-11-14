## 4. Структура модулів та маршрутів

### Сторінки фронтенду (`nextops-frontend/src/app`)
- **Головна та аналітика:** `/`
- **Комерція та склад:** `/product`, `/category`, `/warehouse`, `/order`, `/orderitem`, `/payment`, `/review`
- **Білінг та інтеграції:** `/billing`, `/webhookconfig`
- **Безпека та аудит:** `/audit`, `/apihistory`, `/account`, `/user`, `/session`, `/verificationtoken`
- **AI та проєкти:** `/project`, `/agentknowledgebase`, `/useraibudget`
- **Авторизація:** `/login`, `/invite`, `/forgot-password`, `/reset-password`

### Основні ендпоінти Backend API (`/api`)
- **Автентифікація:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/csrf`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/logout-all`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- **Команда та аудит:** `POST /api/invitation`, `POST /api/invitation/accept`, `GET /api/audit`
- **Білінг та Telegram:** `GET /api/billing/status`, `POST /api/billing/checkout`, `POST /api/billing/webhook`, `POST /api/billing/telegram`, `POST /api/billing/telegram/connect-env`, `GET /api/billing/notifications`, `GET /api/billing/sounds`
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
   docker compose up --build
   ```
3. Відкрийте у браузері:
   - **Frontend:** `http://localhost:3000`
   - **Backend API:** `http://localhost:3001/api`
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
2. **Запустіть бази даних (PostgreSQL 17 та Redis):**
   ```powershell
   docker compose up -d postgres redis
   ```
3. **Налаштуйте змінні середовища:**
   ```powershell
   Copy-Item .\nextops-backend\.env.example .\nextops-backend\.env
   Copy-Item .\nextops-frontend\.env.example .\nextops-frontend\.env.local
   ```
4. **Підготуйте базу даних (валідація, генерація клієнта Prisma, міграції та початкові дані):**
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
1. Перейдіть на `http://localhost:3000/login` і створіть власну компанію (робочий простір) або увійдіть під тестовим адміністратором.
2. Відкрийте розділ **`/billing`** та натисніть **«Підключити через Telegram (в 1 клік)»** або **«Швидко підключити системний бот (із .env)»**.
3. Перейдіть у **`/product`**, додайте товари вручну або завантажте прайс-лист через **CSV-імпорт**.
4. Оформіть замовлення у **`/order`** — у Telegram миттєво прийде чек із кнопками підтвердження, а будь-яка відповідь у чаті бота викличе спливаюче сповіщення зі звуком на сайті та запис у **`/audit`**.

---

## 6. Довідник основних команд

| Команда | Призначення |
| :--- | :--- |
| `yarn start:dev` | Одночасний запуск Backend (`:3001`) та Frontend (`:3000`) у режимі розробки |
| `yarn build` | Повна продакшен-збірка Backend та Frontend |
| `yarn typecheck` | Перевірка суворої типізації TypeScript у всьому монорепозиторії |
| `yarn lint:frontend` | Перевірка якості коду фронтенду (ESLint) |
| `yarn db:validate` | Перевірка коректності схеми `schema.prisma` |
| `yarn db:generate` | Генерація типізованого клієнта Prisma |
| `yarn db:migrate` | Застосування міграцій та політик PostgreSQL RLS |
| `yarn --cwd nextops-backend seed` | Заповнення бази базовими тарифами (`FREE`, `PRO`, `ENTERPRISE`) та системними даними |

---

## 7. Налаштування змінних середовища (`.env`)

| Змінна | Опис | Приклад |
| :--- | :--- | :--- |
| `DATABASE_URL` | Підключення адміністратора міграцій PostgreSQL | `postgresql://postgres:nextops123456@localhost:5432/nextops_db?schema=public` |
| `APP_DATABASE_URL` | Підключення застосунку під роллю `nextops_app` (із примусовим RLS) | `postgresql://nextops_app:password@localhost:5432/nextops_db?schema=public` |
| `REDIS_URL` | Підключення до сервера Redis | `redis://:nextops_redis_secure_pass_2026@localhost:6379` |
| `JWT_SECRET` | Секретний ключ підпису токенів (мінімум 32 символи) | `super-secret-key-nextops-2026-long-bytes-stable-32-characters` |
| `FRONTEND_URL` | Точний origin фронтенду для CORS та платіжних посилань | `http://localhost:3000` |
| `CORS_ORIGINS` | Дозволені домени фронтенду через кому | `http://localhost:3000` |
| `CSRF_ENABLED` | Захист від CSRF-атак (`true` для production) | `true` |
| `AUTH_COOKIE_SAME_SITE` | Політика cookie (`lax` для одного домену, `none` для різних доменів по HTTPS) | `lax` |
| `AUTH_COOKIE_SECURE` | Обов'язковий HTTPS для cookie (`true` у production) | `false` |
| `STRIPE_SECRET_KEY` | Ключ Stripe API (якщо порожній — працює Sandbox Demo Checkout) | `sk_live_...` або порожньо |
| `BILLING_WEBHOOK_SECRET` | Секретний ключ перевірки підпису `X-Billing-Signature` | `whsec_...` |
| `TELEGRAM_BOT_TOKEN` | Токен платформного Telegram-бота для підключення в 1 клік | `9167355387:AAH...` |
| `TELEGRAM_CHAT_ID` | Системний Chat ID за замовчуванням | `6084661679` |
| `TELEGRAM_LOGS_RETENTION_DAYS` | Кількість днів зберігання вхідних повідомлень Telegram | `14` |
| `API_HISTORY_RETENTION_DAYS` | Кількість днів зберігання історії API-запитів | `30` |
| `AI_ENABLED` | Увімкнення AI-модуля та аналітики | `true` |
| `BACKUP_ENCRYPTION_KEY` | Ключ шифрування резервних копій AES-256-GCM | 64 hex-символи |

---

## 8. Рекомендації та подальший розвиток (Roadmap)

### Обов'язковий чекліст перед виходом у Production (в інтернет)
1. **Заміна секретів:** Згенеруйте нові криптографічно стійкі паролі для PostgreSQL, Redis, `JWT_SECRET` та `BACKUP_ENCRYPTION_KEY`.
2. **HTTPS та безпека сесій:** Встановіть `NODE_ENV="production"`, `CSRF_ENABLED="true"` та `AUTH_COOKIE_SECURE="true"`, розмістивши платформу за реверс-проксі (Nginx / Caddy / Cloudflare) із дійсним SSL-сертифікатом.
3. **Транзакційна пошта:** Підключіть поштовий API-провайдер (**Resend**, **Postmark** або **Amazon SES**) для автоматичної відправки листів підтвердження реєстрації, запрошень у команду (`/invite`) та відновлення пароля.
4. **Хмарне сховище медіа (S3 / R2 + CDN):** Перенесіть папку `uploads/` у приватний бакет **AWS S3** або **Cloudflare R2** за CDN (CloudFront / Cloudflare Edge) із збереженням заголовків `Cache-Control` та підписаних URL для приватних документів компаній.
5. **Автоматичні бекапи:** Налаштуйте щоденний запуск утиліти `nextops-backend/src/scripts/cloud-backup.mjs` із вивантаженням зашифрованих бекапів `AES-256-GCM` у хмарне сховище.

### Рекомендовані функціональні покращення (Roadmap)
1. **Живий дашборд керівника (`/`):** Замінити стартову сторінку на інтерактивні графіки виручки за тиждень/місяць, топ товарів, конверсію замовлень та залишок AI-бюджету, щоб власник бачив стан бізнесу за 3 секунди після входу.
2. **Повноцінний RAG AI-асистент (`/agentknowledgebase`):** Підключити API **OpenAI** або **Anthropic** до `AgentKnowledgeBaseService`, щоб компанії завантажували власні прайси та інструкції (PDF/текст), а вбудований AI-агент відповідав клієнтам щодо товарів і замовлень зі списанням реальних токенів із `UserAiBudget`.
3. **Глобальний швидкий пошук (`Cmd+K` / `Ctrl+K`):** Додати швидкий пошук у шапці платформи для миттєвого пошуку замовлень за номером, товарів за назвою або клієнтів за поштою за допомогою повнотекстових індексів PostgreSQL (`tsvector` та `pg_trgm`).
4. **Фільтрація в журналі аудиту (`/audit`):** Додати швидкі вкладки-фільтри (*«Усі події»*, *«Критичні дії безпеки»*, *«Повідомлення з Telegram»*) для зручної роботи операторів та аудиторів.
