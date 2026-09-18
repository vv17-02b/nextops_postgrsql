import fs from 'fs/promises';
import path from 'path';

async function fixAppModule() {
  const backendDir = process.cwd();
  const srcPath = path.join(backendDir, 'src');
  
  console.log(`\n🪐 [NextOps CLI] Запуск глибокої синхронізації модулів NestJS...`);

  const allFiles = await fs.readdir(srcPath, { withFileTypes: true });
  // Очищаємо список від службових папок конфігів та бази даних
  const systemFolders = ['auth', 'config', 'prisma'];
  const activeModules = allFiles
    .filter(dirent => dirent.isDirectory() && !systemFolders.includes(dirent.name))
    .map(dirent => dirent.name);

  const finalImports = [];
  const finalModulesArray = [];

  for (const folderName of activeModules) {
    const moduleFileName = `${folderName}.module.ts`;
    const moduleFilePath = path.join(srcPath, folderName, moduleFileName);

    try {
      // 1. Зчитуємо вміст реального файлу модуля, щоб дізнатися точне ім'я класу
      const content = await fs.readFile(moduleFilePath, 'utf-8');
      
      // Шукаємо за допомогою регулярного виразу назву класу після "export class ..."
      const match = content.match(/export\s+class\s+(\w+Module)/);
      
      if (match && match[1]) {
        const className = match[1]; // Це буде, наприклад, "ApiHistoryModule" або "AccountModule"
        
        finalImports.push(`import { ${className} } from './${folderName}/${folderName}.module';`);
        finalModulesArray.push(className);
      } else {
        console.log(`⚠️ Попередження: Не знайдено назву класу в файлі ${moduleFilePath}`);
      }
    } catch {
      console.log(`❌ Файл не знайдено: ${moduleFilePath}`);
    }
  }

  // 2. Збираємо фінальний ідеальний app.module.ts з обов'язковим збереженням AuthModule
  const appModuleContent = `import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; 
${finalImports.join('\n')}

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ${finalModulesArray.join(',\n    ')}
  ],
})
export class AppModule {}
`;

  await fs.writeFile(path.join(srcPath, 'app.module.ts'), appModuleContent);
  console.log(`\n✨ [УСПІХ] Головний файл app.module.ts повністю синхронізовано з реальними класами та AuthModule!`);
}

fixAppModule().catch(console.error);
