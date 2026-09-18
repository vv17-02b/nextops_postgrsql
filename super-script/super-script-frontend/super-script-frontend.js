import fs from 'fs/promises';
import path from 'path';

async function generateNextJsFrontend() {
  const frontendDir = process.cwd();
  const backendDir = path.join(frontendDir, '..', 'nextops-backend');

  console.log(`\n🤖 [NextOps CLI] Запуск інтелектуального генератора інтерфейсу під реальну схему...`);

  let activeModules = [];
  try {
    const backendSrcPath = path.join(backendDir, 'src');
    const allFiles = await fs.readdir(backendSrcPath, { withFileTypes: true });
    const systemFolders = ['auth', 'config', 'prisma'];
    
    activeModules = allFiles
      .filter(dirent => dirent.isDirectory() && !systemFolders.includes(dirent.name))
      .map(dirent => dirent.name);
  } catch (err) {
    console.error(`❌ Не вдалося зчитати папки бекенду: ${backendDir}`);
    return;
  }

  await fs.mkdir(path.join(frontendDir, 'src', 'app'), { recursive: true });
  await fs.mkdir(path.join(frontendDir, 'src', 'components', 'ui'), { recursive: true });
  await fs.mkdir(path.join(frontendDir, 'src', 'hooks'), { recursive: true });
  for (const moduleName of activeModules) {
    let camelName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    if (moduleName === 'agentknowledgebase') camelName = 'AgentKnowledgeBase';
    if (moduleName === 'apihistory') camelName = 'ApiHistory';
    if (moduleName === 'orderitem') camelName = 'OrderItem';
    if (moduleName === 'useraibudget') camelName = 'UserAiBudget';
    if (moduleName === 'verificationtoken') camelName = 'VerificationToken';
    if (moduleName === 'webhookconfig') camelName = 'WebhookConfig';

    const pageDir = path.join(frontendDir, 'src', 'app', moduleName);
    const componentDir = path.join(frontendDir, 'src', 'components', moduleName);

    await fs.mkdir(pageDir, { recursive: true });
    await fs.mkdir(componentDir, { recursive: true });

    // Динамічне визначення полів форми на основі твоєї реальної схеми Prisma
    let fields = [{ name: 'name', label: 'Назва', type: 'text' }]; 
    
    if (moduleName === 'account') {
      fields = [
        { name: 'userId', label: 'User ID (MongoDB ObjectId)', type: 'text' },
        { name: 'type', label: 'Тип акаунта', type: 'text' },
        { name: 'provider', label: 'Провайдер', type: 'text' },
        { name: 'providerAccountId', label: 'ID провайдера', type: 'text' }
      ];
    } else if (moduleName === 'agentknowledgebase') {
      fields = [
        { name: 'projectId', label: 'Project ID (MongoDB ObjectId)', type: 'text' },
        { name: 'title', label: 'Заголовок бази знань', type: 'text' },
        { name: 'content', label: 'Вміст (Контент)', type: 'text' }
      ];
    } else if (moduleName === 'apihistory') {
      fields = [
        { name: 'endpoint', label: 'Ендпоінт (/api/...)', type: 'text' },
        { name: 'method', label: 'Метод (GET/POST)', type: 'text' },
        { name: 'statusCode', label: 'Статус код (200/400)', type: 'number' },
        { name: 'durationMs', label: 'Тривалість (мс)', type: 'number' }
      ];
    } else if (moduleName === 'category') {
      fields = [
        { name: 'name', label: 'Назва категорії', type: 'text' },
        { name: 'slug', label: 'Слаг (URL)', type: 'text' },
        { name: 'description', label: 'Опис', type: 'text' }
      ];
    } else if (moduleName === 'order') {
      fields = [
        { name: 'userId', label: 'User ID (MongoDB ObjectId)', type: 'text' },
        { name: 'status', label: 'Статус (PENDING/PAID)', type: 'text' },
        { name: 'totalAmount', label: 'Загальна сума', type: 'number' }
      ];
    } else if (moduleName === 'orderitem') {
      fields = [
        { name: 'orderId', label: 'Order ID', type: 'text' },
        { name: 'productId', label: 'Product ID', type: 'text' },
        { name: 'quantity', label: 'Кількість', type: 'number' },
        { name: 'price', label: 'Ціна за одиницю', type: 'number' }
      ];
    } else if (moduleName === 'product') {
      fields = [
        { name: 'name', label: 'Назва товару', type: 'text' },
        { name: 'slug', label: 'Слаг (slug)', type: 'text' },
        { name: 'price', label: 'Ціна', type: 'number' },
        { name: 'categoryId', label: 'Category ID', type: 'text' }
      ];
    } else if (moduleName === 'project') {
      fields = [
        { name: 'userId', label: 'User ID', type: 'text' },
        { name: 'name', label: 'Назва проекту', type: 'text' },
        { name: 'description', label: 'Опис проекту', type: 'text' }
      ];
    } else if (moduleName === 'review') {
      fields = [
        { name: 'rating', label: 'Рейтинг (1-5)', type: 'number' },
        { name: 'comment', label: 'Коментар', type: 'text' },
        { name: 'userId', label: 'User ID', type: 'text' },
        { name: 'productId', label: 'Product ID', type: 'text' }
      ];
    } else if (moduleName === 'session') {
      fields = [
        { name: 'sessionToken', label: 'Токен сесії', type: 'text' },
        { name: 'userId', label: 'User ID', type: 'text' }
      ];
    } else if (moduleName === 'user') {
      fields = [
        { name: 'name', label: 'Ім\'я користувача', type: 'text' },
        { name: 'email', label: 'Email', type: 'text' },
        { name: 'role', label: 'Роль (USER/ADMIN)', type: 'text' }
      ];
    } else if (moduleName === 'useraibudget') {
      fields = [
        { name: 'userId', label: 'User ID', type: 'text' },
        { name: 'monthlyLimit', label: 'Місячний ліміт ($)', type: 'number' }
      ];
    } else if (moduleName === 'verificationtoken') {
      fields = [
        { name: 'identifier', label: 'Ідентифікатор', type: 'text' },
        { name: 'token', label: 'Токен', type: 'text' }
      ];
    } else if (moduleName === 'warehouse') {
      fields = [
        { name: 'productId', label: 'Product ID', type: 'text' },
        { name: 'location', label: 'Локація складу', type: 'text' },
        { name: 'quantity', label: 'Кількість на складі', type: 'number' }
      ];
    } else if (moduleName === 'webhookconfig') {
      fields = [
        { name: 'projectId', label: 'Project ID', type: 'text' },
        { name: 'url', label: 'Webhook URL', type: 'text' },
        { name: 'secret', label: 'Секретний ключ', type: 'text' }
      ];
    }
    // --- а) Створення кастомного строгого хука (src/hooks/use[Module].ts) ---
    const hookContent = `import { useState, useEffect, useCallback } from 'react';

export interface ${camelName} {
  id: string;
  [key: string]: any;
}

export function use${camelName}() {
  const [data, setData] = useState<${camelName}[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/' + '${moduleName}');
      if (res.ok) {
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: any): Promise<void> => {
    try {
      const res = await fetch('http://localhost:3001/api/' + '${moduleName}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка створення:', err);
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      const res = await fetch('http://localhost:3001/api/' + '${moduleName}/' + id, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка видалення:', err);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
`;
    await fs.writeFile(path.join(frontendDir, 'src', 'hooks', `use${camelName}.ts`), hookContent);
    // --- б) Створення компонента інтерактивної форми (src/components/[module]/[module]-form.tsx) ---
    const inputStates = fields.map(f => `  const [${f.name}, set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}] = useState<string>('');`).join('\n');
    const stateClears = fields.map(f => `    set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}('');`).join('\n');
    const submitObject = fields.map(f => `      ${f.name}: ${f.type === 'number' ? `Number(${f.name})` : f.name}`).join(',\n');
    
    const inputElements = fields.map(f => `      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">${f.label}</label>
        <input 
          type="${f.type}" 
          value={${f.name}}
          onChange={(e) => set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}(e.target.value)}
          placeholder="Введіть ${f.label.toLowerCase()}..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>`).join('\n');

    const formContent = `import React, { useState } from 'react';

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
}

export default function ${camelName}Form({ onSubmit }: FormProps): React.JSX.Element {
${inputStates}
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
${submitObject}
    });
${stateClears}
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (${camelName})</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
${inputElements}
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Надсилання...' : 'Створити документ'}
      </button>
    </form>
  );
}
`;
    await fs.writeFile(path.join(componentDir, `${moduleName}-form.tsx`), formContent);

    // --- в) Створення сторінки Next.js App Router (src/app/[module]/page.tsx) ---
    const tableHeaders = fields.map(f => `<th className="px-4 py-3 text-left">${f.label}</th>`).join('\n            ');
    const tableCells = fields.map(f => `<td className="px-4 py-3 text-gray-700"> {String(item.${f.name} || '-')} </td>`).join('\n                ');

        // --- в) Створення сторінки Next.js App Router (src/app/[module]/page.tsx) ---
    // ВИПРАВЛЕНО: РЯДОК СУВОРO ЗАГОРНУТО В БЕКСТІКИ \` ДЛЯ СТОПІДСОТКОВОГО ЕКРАНУВАННЯ
    const pageContent = `"use client";

import React from 'react';
import { use${camelName} } from '@/hooks/use${camelName}';
import ${camelName}Form from '@/components/${moduleName}/${moduleName}-form';
import { Trash2 } from 'lucide-react';

export default function ${camelName}Page(): React.JSX.Element {
  const { data, loading, createItem, deleteItem } = use${camelName}();

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 border rounded-xl shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Next.js Сторінка: ${camelName}</h1>
        <p className="text-sm text-gray-500">Автоматичний зв'язок з роутом бекенду: <code className="text-blue-600 font-mono">/api/${moduleName}</code></p>
      </div>

      <${camelName}Form onSubmit={createItem} />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Список документів з бази даних (MongoDB Atlas)
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Виконується запит до сервера...</div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
                <tr>
                  <th className="px-4 py-3 text-left">ID Документа</th>
                  ${tableHeaders}
                  <th className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition text-[13px]">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600"> {item.id} </td>
                    ${tableCells}
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition inline-flex"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            Колекція порожня. Заповніть форму вище, щоб додати перший документ.
          </div>
        )}
      </div>
    </div>
  );
}
`;
    await fs.writeFile(path.join(pageDir, 'page.tsx'), pageContent);
  }

  // --- 5. ГЕНЕРАЦІЯ ГЛОБАЛЬНОЇ SIDEBAR ПАНЕЛІ (src/components/ui/sidebar.tsx) ---
  console.log(`\n📂 [Частина 5/5] Збірка динамічного компонента навігації та головного лейауту...`);

  const sidebarLinks = activeModules.map(mod => {
    let label = mod.charAt(0).toUpperCase() + mod.slice(1);
    if (mod === 'agentknowledgebase') label = 'AgentKnowledgeBase';
    if (mod === 'apihistory') label = 'ApiHistory';
    if (mod === 'orderitem') label = 'OrderItem';
    if (mod === 'useraibudget') label = 'UserAiBudget';
    if (mod === 'verificationtoken') label = 'VerificationToken';
    if (mod === 'webhookconfig') label = 'WebhookConfig';
    return `    { name: '${label}', href: '/${mod}' }`;
  }).join(',\n');

  const sidebarContent = `"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Folder } from 'lucide-react';

const links = [
${sidebarLinks}
];

export default function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 text-gray-400 flex flex-col h-screen fixed left-0 top-0 border-r border-gray-800 z-10 font-sans">
      <div className="p-5 border-b border-gray-800 flex items-center gap-3 text-white font-bold">
        <LayoutDashboard className="h-5 w-5 text-blue-500" />
        <span>NextOps Studio</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <span className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Згенеровані модулі</span>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={\`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition \${
                isActive ? 'bg-blue-600 text-white shadow-md font-semibold' : 'hover:bg-gray-800 hover:text-white'
              }\`}
            >
              <Folder className="h-4 w-4" />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
`;
  await fs.writeFile(path.join(frontendDir, 'src', 'components', 'ui', 'sidebar.tsx'), sidebarContent);

  // --- 6. ГЕНЕРАЦІЯ ROOT LAYOUT.TSX З ТЕГАМИ HTML/BODY ---
  const layoutContent = `import React from 'react';
import Sidebar from '@/components/ui/sidebar';
import './globals.css';

export const metadata = {
  title: 'NextOps Studio Control Panel',
  description: 'Автогенерований інтерфейс для управління MongoDB через NestJS',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="uk">
      <body className="bg-gray-50 text-gray-900 min-h-screen antialiased m-0 font-sans">
        <div className="min-h-screen flex">
          <Sidebar />
          <div className="pl-64 flex-1">
            <div className="p-8 max-w-5xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
`;
  await fs.writeFile(path.join(frontendDir, 'src', 'app', 'layout.tsx'), layoutContent);

  console.log(`\n✨ [УСПІХ] Усі 15 модулів Next.js повністю оновлені під реальну схему Prisma!`);
}

// Запуск нашого інтелектуального CLI-генератора фронтенду
generateNextJsFrontend().catch(console.error);
