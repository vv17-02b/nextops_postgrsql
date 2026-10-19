#  NextOps Engine v2.0 // Unified SaaS Hub & AI Orchestrator

**NextOps Core Engine** — це масштабована, високопродуктивна Enterprise B2B SaaS-екосистема промислового рівня, спроєктована для управління автономними ШІ-агентами, автоматизованого тестування HTTP-запитів, логування Time-Series метрик та низькорівневої оркестрації багатомаршрутних Zapier-style вебхуків з інтегрованою FinOps-аналітикою бюджетів у реальному часі.

Проєкт реалізовано за принципом **Decoupled Architecture** (повне розділення фронтенду та бекенду) і базується на стандартах безпеки **Zero-Any Production Standard**.

---

##  1. Архитектурна Матрица (4-Віконний Хаб)

Платформа розгорнута як монолітний індустріальний SPA-інтерфейс за адресою `/admin`. Інтерфейс модернізовано за принципом симетричної матричної сітки 2х2 з використанням преміального стилю **Cyber-Glass (Glassmorphism)**:

1. **AI Agent Manager (Вікно №1):** Робочий кабінет для створення ШІ-роботів, прописування системних інструкцій контексту, фільтрації нод ядра та виділення фінансових токен-лімітів.
2. **Webhook Orchestrator (Вікно №2):** Автоматизований low-code шлюз для створення тригерів інтеграцій (Zapier-style) з підтримкою безпечного підпису SHA-256 та миттєвої передачі логів.
3. **Pure HTTP Postman (Вікно №3):** Вбудований куленепробивний емулятор інструменту Postman (`WorkspacePostman`) для виконання асинхронних API-запитів з повним обходом CORS обмежень браузера.
4. **Mongo Real-Time FinOps (Вікно №4):** Панель бізнес-моніторингу, яка за допомогою паралельних NoSQL-агрегацій (`Promise.all`) відображає фінансові показники, містить інтерактивний командний термінал та будує легкий динамічний SVG-графік спалювання лімітів.

---

##  2. Технологічний Стек (Tech Stack)

### Фронтенд-шар (NextOps Studio)
* **Framework:** Next.js 15.5+ (App Router, сувора серверна стабілізація роутів та динамічний рендеринг `force-dynamic`).
* **Compiler Engine:** Turbopack (`next dev --turbopack` — блискавичне гаряче перезавантаження модулів).
* **Runtime Core:** React 19.0 (Сучасна компонентна модель, чисті клієнтські ефекти).
* **State Management:** Zustand v5 + React Context API (Глобальна реактивна шина даних для миттєвої синхронізації 4-х вікон та стейт-менеджер локалізації `ua/en`).
* **Styling & UI Kit:** Tailwind CSS v4.0 (Адаптивний дизайн кібер-скла, відсутність блокувань `select-none` для збереження UX копіювання).

### Бекенд-шар & База Даних (Core Engine)
* **Backend Core:** NestJS (Node.js фреймворк) + Passport.js (JWT Auth) + Class-Validator.
* **Database Core:** Хмарний NoSQL кластер **MongoDB Atlas (Cluster0)**.
* **ORM Client:** Prisma v6 (Singleton-ініціювання клієнта у `lib/prisma.ts` для оптимізації пулу підключень).
* **Authentication:** Auth.js v5 (NextAuth) / JWT-стратегія з безпечним захистом приватних NoSQL роутів (`401 Unauthorized`).

---

##  3. Екосистема Генерації (Super-Script Engine)

Весь Full-Stack додаток (усі базові модулі, інтерфейси, форми та API-шлюзи) автоматично згенеровано за допомогою власної No-Code утиліти автоматизації **Super-Script Engine**:

*   **Бекенд-Генератор (`super-script-backend/generator.js`):** На основі матриці колекцій розгортає структуру NestJS: контролери з примусовою ін'єкцією (`@Inject()`), сервіси, DTO-класи та прописує глобальний `app.module.ts`.
*   **Фронтенд-Генератор (`super-script-frontend/super-script-frontend.js`):** Аналізує схему БД, створює адаптивні Next.js сторінки для кожного модуля, підключає React-хуки синхронізації та готові форми додавання (`SessionForm`, `ProductForm` тощо).

###  Структура Бази Даних `nextops_db` (16 колекцій в MongoDB Atlas):
*   **Ядро Автентифікації:** `User`, `Account`, `Session`, `VerificationToken` — автономне керування доступами та сесіями.
*   **AI & FinOps Оркестрація:** `Project`, `AgentKnowledgeBase`, `UserAiBudget` — контекст ШІ-агентів та ліміти фінансових токенів.
*   **E-commerce & Склад:** `Product`, `Category`, `Warehouse` — складська логіка, залишки та товарні матриці.
*   **Платіжні Транзакції:** `Order`, `OrderItem` — атомарні фінансові операції та Stripe Mock Checkout пайплайни.
*   **Інтеграції та Моніторинг:** `WebhookConfig` (оркестратор зовнішніх подій) та `ApiHistory` (высокошвидкісна Time-Series консоль моніторингу сервера на сирих NoSQL-командах `$runCommandRaw`).

---

##  4. Експлуатація та Запуск Проєкту

### Крок А: Налаштування середовища (`.env`)
Створіть файл `.env` у папці бекенду:
```env
DATABASE_URL="mongodb+srv://admin:<password>@cluster0.mongodb.net/nextops_db"
JWT_SECRET="super-secret-key-nextops-2026"
```

### Крок Б: Запуск у режимі розробки (Development)
```bash
# Запуск обох шарів однією командою через concurrently
yarn start:dev
```

### Крок В: Збірка Релізу (Production build)
```bash
# Компіляція серверного ядра NestJS
cd nextops-backend && yarn build

# Оптимізація та гідратація інтерфейсу Next.js
cd nextops-frontend && yarn build
```
