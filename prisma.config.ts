import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

// Примусово завантажуємо змінні з .env файлу перед ініціалізацією конфігу Prisma
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
});
