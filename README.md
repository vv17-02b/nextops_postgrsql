# 🚀 NextOps Core Engine (v2.0-Production)

**NextOps Core Engine** — це масштабоване, високопродуктивне Enterprise-рішення для автоматизації NoSQL баз даних, логування Time-Series метрик та управління мікросервісною архітектурою. 

Проєкт спроєктований за принципом **Decoupled Architecture** (повне розділення фронтенду та бекенду) і базується на залізобетонних стандартах безпеки **Zero-Any Production Standard**.

---

## 🛠️ 1. Технологічний Стек (Tech Stack)

*   **Backend Core:** NestJS (Node.js фреймворк) + Passport.js (JWT Auth) + Class-Validator
*   **Database ORM:** Prisma v6 + Хмарний NoSQL кластер **MongoDB Atlas**
*   **Frontend Studio:** Next.js 15 (App Router) + Tailwind CSS + Lucide Icons
*   **Automation:** Вбудований низькорівневий шлюз `WorkspacePostman` (Емулятор API)

---

## 📐 2. Автоматизація та Екосистема Генерації (Super-Script Engine)

Цей проєкт не писався вручну. Весь Full-Stack додаток (усі 15 модулів, інтерфейси, форми та API-шлюзи) згенеровано за 1 секунду за допомогою власної No-Code утиліти автоматизації **Super-Script Engine**:

*   **Бекенд-Генератор (`super-script-backend/generator.js`):** На основі матриці колекцій автоматично розгортає структуру NestJS: контролери з примусовою ін'єкцією, сервіси, DTO-класи та прописує глобальний `app.module.ts`.
*   **Фронтенд-Генератор (`super-script-frontend/super-script-frontend.js`):** Автоматично аналізує схему бази даних, створює адаптивні Next.js сторінки App Router для кожного модуля, підключає React-хуки синхронізації та генерує готові форми додавання (`SessionForm`, `ProductForm` тощо).

### 📋 Список 15 Автоматизованих Модулів (MongoDB Atlas):
*   `User`, `Account`, `Session`, `VerificationToken` — Автономне ядро автентифікації.
*   `Project`, `AgentKnowledgeBase`, `UserAiBudget` — Контекст ШІ-агентів та FinOps лімітів.
*   `Product`, `Category`, `Warehouse` — Складська логіка та E-commerce ядро.
*   `Order`, `OrderItem` — Платіжні атомарні транзакції.
*   `WebhookConfig` — Оркестратор живих тригерів та зовнішніх подій.
*   `ApiHistory` — Високошвидкісна Time-Series консоль моніторингу навантаження сервера.


## 💎 3. Ключові Інженерні Особливості (Production-Ready)

*   **Валідація Даних на Вході (DTO Layer):** Кожен POST/PATCH запит проходить через жорсткі класи-валідатори (`class-validator`). Будь-який некоректний JSON відхиляється на рівні ядра, не навантажуючи MongoDB Atlas.
*   **Стабільність на Windows OS (DI Посилення):** Усі сервіси та контролери захищені від циклічних залежностей та багів компілятора `tsx watch` за допомогою примусових декораторів `@Inject()`.
*   **Куленепробивний Postman Інтерфейс:** Вбудована консоль тестування сутностей. Автоматично перехоплює JWT-токен при авторизації (`Auth: Login`) та непомітно підставляє його в заголовок `Authorization: Bearer <token>` для наступних запитів.
*   **Самолікування NoSQL Бази:** При старті `PrismaService` автоматично виявляє та знищує застарілі унікальні індекси (наприклад, `Order_stripeId_key`), блокуючи краші бази даних.
*   **Time-Series Пайплайн запису:** Модуль `ApiHistory` переведений на сирі NoSQL-команди (`$runCommandRaw`), що дозволяє логувати метрики сервера в обхід транзакційних обмежень Prisma.

---

## ⚙️ 4. Експлуатація та Запуск Проєкту (Deployment Guide)

### Крок А: Налаштування середовища (`.env`)
Створіть файл `.env` у папці бекенду та налаштуйте ключі доступу:
```env
# Хмарне підключення до MongoDB Atlas Cluster
DATABASE_URL="mongodb+srv://admin:<password>@cluster.mongodb.net/nextops_db"

# Секретний ключ для шифрування цифрових JWT-паспортів
JWT_SECRET="super-secret-key-nextops-2026"
```

### Крок Б: Запуск у режимі розробки (Development)
1.  **Запуск Бекенду (Порт 3001):**
    ```bash
    cd nextops-backend
    yarn install
    yarn prisma generate
    yarn start:dev
    ```
2.  **Запуск Фронтенду (Порт 3000):**
    ```bash
    cd nextops-frontend
    yarn install
    yarn dev
    ```

### Крок В: Компіляція та Збірка Релізу (Production build)
Для відключення важких вотчерів розробки та отримання максимальної швидкості (Node.js Native Speed), скомпілюйте TypeScript у чистий JavaScript:
```bash
# Компіляція серверного ядра NestJS
cd nextops-backend && yarn build

# Оптимізація та гідратація інтерфейсу Next.js
cd nextops-frontend && yarn build
```

---

## 🧩 5. Перенос Каркасу (Core Engine) на інший проєкт

Ця архітектура є ** Plug-and-Play компонентом**. Якщо вам потрібно створити нову CRM, ERP чи AI-систему:
1. Оновіть сутності у списку `COLLECTIONS` всередині `generator.js` та `generate-prisma.js`.
2. Запустіть скрипти — за 1 секунду ви отримаєте готову, суворо типізовану систему з JWT-авторизацією та CRUD шлюзами!
