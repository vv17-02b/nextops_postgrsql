import fs from 'fs/promises';
import path from 'path';

// Абсолютно правильний шлях до вашої папки nextops-backend
const PRISMA_PATH = path.join(process.cwd(), 'nextops-backend', 'src', 'prisma', 'schema.prisma');

async function generatePrismaSchema() {
  console.log('🔮 Починаємо генерацію СУВОРOЇ СХЕМИ PRISMA з реляційними звʼязками для nextops_db...');

  // 1. Базові системні налаштування провайдера хмари MongoDB Atlas
  let schemaContent = `datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}\n\n`;

  // 2. Вбудовуємо готові, суворо спроєктовані Enterprise-моделі зі зв'язками
  schemaContent += `model User {
  id               String            @id @default(auto()) @map("_id") @db.ObjectId
  name             String?
  email            String            @unique
  emailVerified    DateTime?
  image            String?
  passwordHash     String?
  role             String            @default("USER")
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  accounts         Account[]
  sessions         Session[]
  projects         Project[]
  reviews          Review[]
  userAiBudgets    UserAiBudget[]
}

model Account {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  userId            String   @db.ObjectId
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionToken String   @unique
  userId       String   @db.ObjectId
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Project {
  id                  String               @id @default(auto()) @map("_id") @db.ObjectId
  userId              String               @db.ObjectId
  name                String
  description         String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  user                User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  agentKnowledgeBases AgentKnowledgeBase[]
  webhookConfigs      WebhookConfig[]
}

model AgentKnowledgeBase {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  content   String
  projectId String   @db.ObjectId
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model UserAiBudget {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  totalBudget Float
  usedBudget  Float    @default(0)
  currency    String   @default("USD")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Category {
  id          String     @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  slug        String     @unique
  description String?
  parentId    String?    @db.ObjectId
  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children    Category[] @relation("CategoryToCategory")
  products    Product[]
}

model Product {
  id             String      @id @default(auto()) @map("_id") @db.ObjectId
  name           String
  slug           String      @unique
  description    String?
  price          Float
  compareAtPrice Float?
  images         String[]
  isActive       Boolean     @default(true)
  categoryId     String      @db.ObjectId
  category       Category    @relation(fields: [categoryId], references: [id])
  reviews        Review[]
  orderItems     OrderItem[]
  warehouseId    String?     @db.ObjectId
  warehouse      Warehouse?  @relation(fields: [warehouseId], references: [id])
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

model Warehouse {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  location    String
  description String?
  products    Product[]
}

model Review {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  productId String   @db.ObjectId
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Order {
  id                 String      @id @default(auto()) @map("_id") @db.ObjectId
  userId             String?     @db.ObjectId
  status             String      @default("PENDING")
  paymentStatus      String      @default("UNPAID")
  paymentMethod      String      @default("CARD")
  paymentId          String?
  paymentRawResponse String?
  totalAmount        Float
  currency           String      @default("UAH")
  shippingAddress    Json
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  items              OrderItem[]
}

model OrderItem {
  id        String  @id @default(auto()) @map("_id") @db.ObjectId
  orderId   String  @db.ObjectId
  productId String  @db.ObjectId
  quantity  Int
  price     Float
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
}

model WebhookConfig {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  projectId String   @db.ObjectId
  url       String
  secret    String?
  events    String[]
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

/// 🌟 НАЛАШТОВАНО ЯК СУВОРУ TIME-SERIES КОЛЕКЦІЮ MONGODB ДЛЯ СИСТЕМНИХ МЕТРИК
model ApiHistory {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  endpoint   String
  method     String
  statusCode Int
  durationMs Int
  createdAt  DateTime @default(now())
}
`;

  // Автоматично створюємо папку src/prisma, щоб уникнути помилок відсутності директорії
  await fs.mkdir(path.dirname(PRISMA_PATH), { recursive: true });

  // Записуємо готовий файл конфігурації схемы
  await fs.writeFile(PRISMA_PATH, schemaContent);
  console.log(`\n✔ СУПЕР! Оновлений файл конфігурації схеми успішно створено!`);
  console.log(` Перевір його за шляхом: nextops-backend\\src\\prisma\\schema.prisma`);
}

generatePrismaSchema().catch(console.error);
