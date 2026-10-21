"use client";

import React, { useState, useEffect } from "react";
import { Webhook, Save, Key, Send, Database, Layers, ArrowRight } from "lucide-react";

// Інтерфейс для конфігурації модулів тестування API
interface TargetModule {
  name: string;
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  defaultPayload: Record<string, unknown>;
}

// Повна матриця модулів: тепер включає швидкі тести для авторизації
const AVAILABLE_MODULES: TargetModule[] = [
  {
    name: "Auth: Register",
    endpoint: "/api/auth/register",
    method: "POST",
    defaultPayload: { email: "admin2026@nextops.com", password: "super-secure-password" }
  },
  {
    name: "Auth: Login",
    endpoint: "/api/auth/login",
    method: "POST",
    defaultPayload: { email: "admin2026@nextops.com", password: "super-secure-password" }
  },
  {
    name: "User (Користувач)",
    endpoint: "/api/user",
    method: "POST",
    defaultPayload: { name: "Олександр", email: "alex2026@example.com", role: "USER" }
  },
  {
    name: "Product (Товар)",
    endpoint: "/api/product",
    method: "POST",
    defaultPayload: { name: "Кава Зернова", slug: "coffee-beans-1kg", price: 450, categoryId: "64b0f19c9d4e2a1b3c4d5e6f" }
  },
  {
    name: "Order (Замовлення)",
    endpoint: "/api/order",
    method: "POST",
    defaultPayload: { userId: "64b0f19c9d4e2a1b3c4d5e6f", totalAmount: 150, currency: "UAH", status: "PENDING" }
  },
  {
    name: "WebhookConfig (Вебхук)",
    endpoint: "/api/webhookconfig",
    method: "POST",
    defaultPayload: { url: "https://telegram.org...", secret: "my-sha256-key", events: ["PROJECT_COMPLETED"], projectId: "64b0f19c9d4e2a1b3c4d5e6f" }
  }
];

interface WorkspacePostmanProps {
  isOpen?: boolean;
  onCloseAction?: () => void;
}

export default function WorkspacePostman({ isOpen, onCloseAction }: WorkspacePostmanProps) {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  // Поля конфігурації HTTP запиту
  const [httpMethod, setHttpMethod] = useState<"GET" | "POST" | "PATCH" | "DELETE">("POST");
  const [customEndpoint, setCustomEndpoint] = useState(AVAILABLE_MODULES[0].endpoint);
  const [jsonPayload, setJsonPayload] = useState(JSON.stringify(AVAILABLE_MODULES[0].defaultPayload, null, 2));

  // Поля терміналу відповідей
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  // Синхронізуємо метод, роут та пейлоад при перемиканні табів
  useEffect(() => {
    const mod = AVAILABLE_MODULES[selectedModuleIndex];
    setHttpMethod(mod.method);
    setCustomEndpoint(mod.endpoint);
    setJsonPayload(JSON.stringify(mod.defaultPayload, null, 2));
    setUiError(null);
    setResponseStatus(null);
    setResponseBody("");
  }, [selectedModuleIndex]);
  // Головна функція інженерного тригера запитів (Емулятор Postman)
  const handleExecuteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEndpoint.trim()) return;

    setIsSubmitting(true);
    setUiError(null);
    setResponseStatus(null);
    setResponseBody("");

    const startTime = performance.now();

    try {
      //  1. Перевіряємо та зчитуємо збережений JWT токен з пам'яті браузера
      const savedToken = typeof window !== "undefined" ? localStorage.getItem("nextops_jwt") : null;

      // Конфігурація заголовків та параметрів запиту
      const options: RequestInit = {
        method: httpMethod,
        headers: {
          "Content-Type": "application/json",
          //  2. АВТО-ПІДСТАНОВКА: Якщо токен є в пам'яті, прикріплюємо заголовок Bearer для NestJS
          ...(savedToken ? { "Authorization": `Bearer ${savedToken}` } : {}),
        },
      };

      // Додаємо тіло запиту тільки для методів POST та PATCH
      if (httpMethod === "POST" || httpMethod === "PATCH") {
        try {
          // Попередня валідація JSON структури на клієнті
          JSON.parse(jsonPayload.trim());
          options.body = jsonPayload.trim();
        } catch {
          throw new Error("Некоректний формат JSON у полі тіла запиту");
        }
      }

      // Виконуємо живий запит до шлюзу NestJS API
      const res = await fetch(customEndpoint.trim(), options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      setResponseStatus(res.status);

      const text = await res.text();
      try {
        const parsedJson: unknown = JSON.parse(text);
        const accessToken =
          typeof parsedJson === "object" &&
          parsedJson !== null &&
          "accessToken" in parsedJson &&
          typeof parsedJson.accessToken === "string"
            ? parsedJson.accessToken
            : undefined;

        // 3. АВТО-ЗБЕРЕЖЕННЯ: Якщо це був успішний вхід, зберігаємо JWT токен автоматично
        if (customEndpoint.includes("/api/auth/login") && res.ok && accessToken) {
          localStorage.setItem("nextops_jwt", accessToken);
          setResponseBody(`// [SUCCESS] Токен успішно перехоплено та збережено в localStorage!\n// Статус: ${res.status} OK | Час: ${duration}ms\n` + JSON.stringify(parsedJson, null, 2));
        } else {
          setResponseBody(`// Статус: ${res.status} | Час: ${duration}ms\n` + JSON.stringify(parsedJson, null, 2));
        }
      } catch {
        setResponseBody(`// Статус: ${res.status} | Час: ${duration}ms\n${text}`);
      }

    } catch (err: unknown) {
      console.error("🚨 [WorkspacePostman Execution Error]:", err);
      setUiError(err instanceof Error ? err.message : "Помилка мережі при спробі зв'язку з бекендом");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 md:p-6 shadow-2xl font-sans text-neutral-300 transition-all duration-300">

      {/* 1. ШЛЮЗ ШАПКИ (Гнучка інженерна панель) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-800 pb-4 mb-4 select-none w-full">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400 animate-pulse shrink-0" />
          <span className="text-sm font-mono text-blue-400 font-black tracking-wider">🚀 NEXTOPS_API_POSTMAN v2.0</span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg text-blue-400 font-mono font-bold">БЕКЕНД СТУДІЯ</span>
          {isOpen && onCloseAction && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCloseAction(); }}
              className="text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1.5 rounded-xl hover:bg-red-500 hover:text-white transition cursor-pointer shrink-0"
            >
              [ × ЗАКРИТИ ]
            </button>
          )}
        </div>
      </div>

      {/* 2. ТАБИ СУТНОСТЕЙ (Адаптивна гнучка сітка для 6 табів) */}
      <div className="mb-4 w-full">
        <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase font-bold tracking-wider">Оберіть сутність для тесту</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
          {AVAILABLE_MODULES.map((mod, idx) => (
            <button
              key={mod.name}
              type="button"
              onClick={() => setSelectedModuleIndex(idx)}
              className={`p-2.5 text-[11px] font-mono font-bold rounded-xl border transition truncate text-center cursor-pointer ${selectedModuleIndex === idx
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
            >
              {mod.name}
            </button>
          ))}
        </div>
      </div>

          {/* Сповіщення про помилки клієнтської валідації */}
      {uiError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs rounded-xl text-left w-full break-all">
          ⚠️ {uiError}
        </div>
      )}

      {/* 3. ГОЛОВНА КОНСТРУКТОР-ФОРМА */}
      <form onSubmit={handleExecuteRequest} className="space-y-4 w-full" onClick={(e) => e.stopPropagation()}>

        {/* Рядок вибору методу та URL-адреси */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <select
            value={httpMethod}
            // ВИПРАВЛЕНО ANY: Суворе приведення типу під допустимі HTTP-методи
            onChange={(e) => setHttpMethod(e.target.value as "GET" | "POST" | "PATCH" | "DELETE")}
            className="w-full sm:w-32 text-xs p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-blue-400 font-mono font-black focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <div className="flex-1 flex gap-2 w-full">
            <input
              type="text"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="/api/..."
              className="flex-1 text-xs p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:border-blue-500 w-full min-w-0"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs rounded-xl transition font-mono disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 shrink-0"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>{isSubmitting ? "НАТИСК..." : "SEND"}</span>
            </button>
          </div>
        </div>

        {/* 4. РЕДАКТОР ТІЛА ЗАПИТУ ТА ВІКНО ВІДПОВІДІ (Двоколонна адаптивна панель) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">

          {/* Колонка А: Редактор JSON (Тільки для методів запису) */}
          <div className="flex flex-col w-full min-w-0">
            <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase font-bold tracking-wider">
              Тіло запиту (Request JSON Payload)
            </label>
            <textarea
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
              placeholder="{\n  // Введіть дані для POST/PATCH запиту\n}"
              rows={8}
              disabled={isSubmitting || httpMethod === "GET" || httpMethod === "DELETE"}
              className={`w-full p-3 rounded-xl bg-neutral-900 border text-xs font-mono focus:outline-none focus:border-blue-500 resize-none min-h-[160px] ${
                httpMethod === "GET" || httpMethod === "DELETE"
                  ? "opacity-30 border-neutral-800 text-neutral-600 select-none"
                  : "border-neutral-800 text-emerald-400"
              }`}
            />
          </div>

          {/* Колонка Б: Консоль відповіді сервера (Terminal Output) */}
          <div className="flex flex-col w-full min-w-0">
            <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase font-bold tracking-wider">
              Відповідь бекенду (Response Output)
            </label>
            <textarea
              readOnly
              value={responseBody || (isSubmitting ? "// Очікування відповіді від NestJS сервера..." : "// Натисніть SEND, щоб виконати запит до API")}
              rows={8}
              className={`w-full p-3 rounded-xl bg-black border text-xs font-mono resize-none min-h-[160px] focus:outline-none ${
                responseStatus && responseStatus >= 400
                  ? "text-red-400 border-red-900/40"
                  : responseStatus && responseStatus < 400
                    ? "text-blue-400 border-blue-900/40"
                    : "text-neutral-500 border-neutral-800"
              }`}
            />
          </div>

        </div>
      </form>

      {/* Комерційна інформаційна нода-футер */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 bg-neutral-900/20 border 
      border-neutral-800 border-dashed rounded-xl p-3 text-center sm:text-left w-full">
        <span className="text-xl shrink-0 select-none animate-pulse">⚡</span>
        <div>
          <p className="text-xs font-mono font-black text-neutral-200">
            Вбудоване тестування шлюзів NestJS API
          </p>
          <p className="text-[10px] font-sans text-neutral-500 mt-0.5 max-w-xl leading-relaxed">
            Вам більше не потрібно запускати сторонні програми. Обирайте потрібну сутність, метод, 
            редагуйте JSON-тіло прямо в інтерфейсі NextOps Studio.
          </p>
        </div>
      </div>

    </div>
  );
}
