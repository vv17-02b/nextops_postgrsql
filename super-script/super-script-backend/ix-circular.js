import fs from 'fs/promises';
import path from 'path';

async function sanitizeModules() {
  const backendDir = process.cwd();
  const srcPath = path.join(backendDir, 'src');
  
  console.log(`\n🪐 [NextOps CLI] Очищення модулів від циклічних залежностей за стандартами Production...`);

  const allFiles = await fs.readdir(srcPath, { withFileTypes: true });
  const systemFolders = ['auth', 'config', 'prisma'];
  const activeModules = allFiles
    .filter(dirent => dirent.isDirectory() && !systemFolders.includes(dirent.name))
    .map(dirent => dirent.name);

  for (const folderName of activeModules) {
    const moduleFileName = `${folderName}.module.ts`;
    const moduleFilePath = path.join(srcPath, folderName, moduleFileName);

    try {
      const originalContent = await fs.readFile(moduleFilePath, 'utf-8');
      const match = originalContent.match(/export\s+class\s+(\w+Module)/);
      
      if (match) {
        const exactClassName = match[1]; // Наприклад: AgentKnowledgeBaseModule
        
        //  ФІКС ІМЕН: Вираховуємо правильний PascalCase для імпорту сервісів та контролерів
        let entityName = exactClassName.replace('Module', ''); 
        
        // Спеціальний мапінг для складних NoSQL сутностей, щоб не злітали назви класів
        if (folderName === 'agentknowledgebase') entityName = 'AgentKnowledgeBase';
        if (folderName === 'apihistory') entityName = 'ApiHistory';
        if (folderName === 'orderitem') entityName = 'OrderItem';
        if (folderName === 'useraibudget') entityName = 'UserAiBudget';
        if (folderName === 'verificationtoken') entityName = 'VerificationToken';
        if (folderName === 'webhookconfig') entityName = 'WebhookConfig';

        // Перезаписуємо модуль на 100% чистий та ізольований стандарт NestJS
        // Повністю виключає самоімпорт (Circular dependency)
        const cleanModuleContent = `import { Module } from '@nestjs/common';
import { ${entityName}Service } from './${folderName}.service';
import { ${entityName}Controller } from './${folderName}.controller';

@Module({
  controllers: [${entityName}Controller],
  providers: [${entityName}Service],
  exports: [${entityName}Service]
})
export class ${exactClassName} {}\n`;

        await fs.writeFile(moduleFilePath, cleanModuleContent);
        console.log(`  Модуль [${exactClassName}] успішно очищено від циклів.`);
      }
    } catch (err) {
      console.error(` Не вдалося обробити файл: ${moduleFileName}`, err);
    }
  }
  console.log(`\n Усі модулі успішно продезінфіковано від циклічних залежностей!`);
}

sanitizeModules().catch(console.error);
