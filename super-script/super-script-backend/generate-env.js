import fs from 'fs/promises';
import path from 'path';

// Шлях до файлу .env та .gitignore у корені бекенду
const ENV_PATH = path.join(process.cwd(), 'nextops-backend', '.env');
const GITIGNORE_PATH = path.join(process.cwd(), 'nextops-backend', '.gitignore');

async function createEnvFile() {
  console.log(' Створення файлу конфігурації оточення .env...');

  // Готовий контент із твоїми реальними даними під MongoDB Atlas та JWT
  const envContent = `# Рядок підключення до твоєї MongoDB Atlas
DATABASE_URL="mongodb+srv://db_780217:e6c7Ez3MVm1H7ucq@cluster0.7hdwv2d.mongodb.net/nextops_db?retryWrites=true&w=majority&appName=Cluster0"

# Секретний ключ для шифрування токенів JWT авторизації
JWT_SECRET="super-secret-key-nextops-2026"
`;

  // 1. Записуємо готовий файл конфігурації .env
  await fs.writeFile(ENV_PATH, envContent);
  console.log(`\n✔ СУПЕР! Файл .env успішно створено у папці бекенду!`);

  // 2.  БЕЗПЕКА: Автоматично створюємо .gitignore, щоб пароль бази не витік на GitHub
  try {
    const gitignoreContent = `.env\nnode_modules/\ndist/\n.nestjs/\n`;
    await fs.writeFile(GITIGNORE_PATH, gitignoreContent);
    console.log(`✔ Файл .gitignore успішно створено (безпека паролів активована).`);
  } catch (e) {
    // Якщо виникне помилка доступу, просто ігноруємо
  }

  console.log(`\n🔒 Перевір результат за шляхом: nextops-backend\\.env`);
}

createEnvFile().catch(console.error);
