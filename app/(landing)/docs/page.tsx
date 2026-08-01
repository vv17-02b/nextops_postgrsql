"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Terminal, Layers, Webhook,
  BookOpen, Code, Cpu, ShieldAlert, CreditCard, ExternalLink, Menu, X, Play, Zap
} from "lucide-react";

interface DocArticle {
  id: string;
  title: string;
  description: string;
  codeSnippet?: string;
  snippetColor?: "cyan" | "emerald" | "amber" | "purple";
}

interface DocCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  articles: DocArticle[];
}

export default function DocsPage() {
  // Розширена промислова база знань NextOps Engine v1.2 з великим обсягом інструкцій
  const docsData: DocCategory[] = [
    {
      id: "getting-started",
      title: " Швидкий старт",
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      articles: [
        {
          id: "intro",
          title: "Огляд та можливості платформи",
          description: "NextOps Engine v1.2 — це готова високонадійна B2B SaaS-платформа (інженерний Boilerplate), розроблена для оркестрації автономних ШІ-агентів, low-code налаштування вебхуків та миттєвого дебагу HTTP-запитів. Платформа надає розробникам та ШІ-стартапам архітектуру «все в одному» (All-in-One Hub), усуваючи необхідність створювати інфраструктуру авторизації, білінгу та підключення до баз даних з нуля. Увесь інтерфейс працює в преміальному скляному дизайні Cyber-Glass на базі реактивної матричної сітки 2х2.",
        },
        {
          id: "installation",
          title: "Розгортання та Запуск (Yarn)",
          description: "Для запуску локального NoSQL-хабу у вашому робочому середовищі виконайте наступні кроки в терміналі MINGW64 / Bash:\n\n1. Клонуйте репозиторій: git clone\n2. Встановіть залежності: yarn install\n3. Запустіть сервер розробника: yarn dev або yarn start\n\nПроєкт повністю оптимізований під Next.js 15 та React 19. Команда yarn build збирає додаток за лічені секунди, ізолюючи статичні сторінки лендінгу від динамічних серверних функцій (Server Actions), що гарантує миттєве завантаження сайту під екстремальними навантаженнями.",
          codeSnippet: `$ yarn install\n$ yarn build\n$ yarn start\n\n▲ Next.js 15.3.2\n- Local: http://localhost:3000\n✓ Ready in 4.3s\n▲ NextOps Engine v1.2: Запущено уніфікований NoSQL Хаб`,
          snippetColor: "purple"
        }
      ]
    },
    {
      id: "architecture",
      title: " Архітектура та MongoDB",
      icon: <Cpu className="w-4 h-4 text-violet-400" />,
      articles: [
        {
          id: "nosql-cluster",
          title: "Синхронізація з MongoDB Atlas",
          description: "Платформа повністю підключена до хмарної NoSQL-бази даних MongoDB Atlas за допомогою ORM Prisma. Замість важких реляційних зв'язків, NextOps використовує гнучкі JSON-подібні документи. Це дозволяє динамічно змінювати структуру даних ШІ-роботів на льоту. Користувач може взаємодіяти з кластером баз даних прямо з інтерфейсу платформи (через Вікно №4: Mongo Real-Time FinOps), не відкриваючи сторонній софт типу MongoDB Compass.",
        },
        {
          id: "finops-mechanics",
          title: "Автоматизація FinOps та ліміти",
          description: "Повна автоматизація FinOps реалізована у Вікнах 1 та 4 вашого робочого простору. Коли користувач створює ШІ-робота або прописує фінансові ліміти бюджету, система без жодного перезавантаження сторінки перераховує аналітику кабінету. Це досягається завдяки паралельним NoSQL-агрегаціям у хмарі Atlas, які миттєво підтягують оновлені ліміти для активного ID користувача.",
          codeSnippet: `[Mock-Aggregation]: Розрахунок лімітів для користувача: 65cb7f4a21de456789abcdef\n{\n  "userId": "65cb7f4a21de456789abcdef",\n  "allocatedBudget": 450.00,\n  "spentBudget": 120.50,\n  "activeNodes": 3\n}`,
          snippetColor: "amber"
        }
      ]
    },
    {
      id: "api-workbench",
      title: " Емулятор Sandbox Postman",
      icon: <Code className="w-4 h-4 text-cyan-400" />,
      articles: [
        {
          id: "postman-core",
          title: "Обхід CORS обмежень через Secure Proxy",
          description: "Вбудований Sandbox Postman (Вікно №3) — це повноцінний інструмент дебагу HTTP-запитів (GET, POST, PUT, DELETE). Він працює через наш безпечний проксі-сервер на бекенді (/api/dev/proxy). Проксі перехоплює запит клієнта, виконує його на рівні сервера Node.js (тим самим повністю обходячи CORS обмеження браузерів) і повертає чисту відповідь у Вікно відповіді сервера. Кожен виконаний тест автоматично логується в NoSQL колекцію ApiHistory.",
        },
        {
          id: "api-reference",
          title: "Специфікація маршрутів ядра",
          description: "Для інтеграції зовнішніх CRM або месенджерів (наприклад, Telegram API), платформа надає два базові відкриті маршрути:\n\n1. GET /api/v1/projects — Повертає масив останніх 10 комерційних нод, закріплених за активною сесією розробника.\n2. POST /api/v1/webhooks — Реєструє low-code правила маршрутизації та виклику зовнішніх шлюзів при настанні бізнес-подій.",
          codeSnippet: `// POST /api/v1/webhooks\n{\n  "targetEvent": "PROJECT_COMPLETED",\n  "targetUrl": "https://telegram.org"\n}`,
          snippetColor: "cyan"
        }
      ]
    },
    {
      id: "security-billing",
      title: " Безпека та Stripe білінг",
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      articles: [
        {
          id: "auth-js",
          title: "Куленепробивна безпека Auth.js v5",
          description: "Усі приватні роути, робочі простори (Workspace) та списки користувачів закриті від хакерських атак. Система автоматично повертає статус 401 Unauthorized для неавторизованих гостей на рівні проміжного ПЗ (Middleware). Кожен запис у базі даних суворо ізолюється й прив'язується до особистого профілю розробника в MongoDB за його унікальним ідентифікатором.",
        },
        {
          id: "stripe-engine",
          title: "Монетизація та логіка статусів PRO",
          description: "У платформу інтегрована Stripe Engine — преміальна платіжна форма картки з масками введення символів. Вона повністю зшита з бекендом. Після імітації або реального підтвердження оплати, користувач у базі даних миттєво отримує статус 'Plan: PRO' на 30 днів вперед. Це автоматично розширює його FinOps ліміти на створення нових ШІ-агентів.",
          codeSnippet: `{\n  "success": true,\n  "message": "Payment simulation successful",\n  "updatedUser": { "plan": "PRO", "billingCycle": "monthly" }\n}`,
          snippetColor: "emerald"
        }
      ]
    }
  ];

  const [activeCategoryId, setActiveCategoryId] = useState("getting-started");
  const [activeArticleId, setActiveArticleId] = useState("intro");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeCategory = docsData.find(c => c.id === activeCategoryId) || docsData[0];
  const activeArticle = activeCategory.articles.find(a => a.id === activeArticleId) || activeCategory.articles[0];
  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono text-sm relative z-10 flex flex-col antialiased">
      {/* Промислова неонова сітка на тлі */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293703_1px,transparent_1px),linear-gradient(to_bottom,#1f293703_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* ==========================================
          КЕРУЮЧИЙ БАР (HEADER)
         ========================================== */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between border-b
       border-slate-900 pb-5 mb-8 px-4 pt-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 mr-1 rounded-xl bg-neutral-900 border border-neutral-800 
            lg:hidden text-neutral-400 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-violet-400 animate-pulse" />
            <h1 className="text-sm sm:text-base font-black uppercase tracking-widest text-neutral-200">
              NextOps // CORE_DOCUMENTATION
            </h1>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs 
          font-black uppercase tracking-wider bg-gradient-to-r from-neutral-900 
          to-neutral-850 hover:from-neutral-800 hover:to-neutral-750 text-neutral-300
           hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl
            transition shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-500 font-bold" />
          <span> ПОВЕРНУТИСЬ_ДОДОМУ</span>
        </Link>
      </header>

      {/* ==========================================
          ГОЛОВНА ОРКЕСТРАЦІЯ КОНТЕНТУ
         ========================================== */}
      <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 pb-12">

        {/* ДЕСКТОПНИЙ САЙДБАР (SIDEBAR) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-5 border-r border-slate-900/60 pr-5 select-none">
          <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-2 mb-3">
             СТРУКТУРА ДИРЕКТОРІЙ ТА ІНСТРУКЦІЙ
          </div>
          {docsData.map((category) => (
            <div key={category.id} className="space-y-1.5">
              <div className="flex items-center gap-2 px-2 py-2 font-black
               text-neutral-200 uppercase tracking-wider text-xs border-b border-neutral-900/40">
                {category.icon}
                <span>{category.title}</span>
              </div>
              <div className="pl-4 border-l border-neutral-800 space-y-1">
                {category.articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => {
                      setActiveCategoryId(category.id);
                      setActiveArticleId(article.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-all text-xs ${activeArticleId === article.id
                        ? "bg-violet-950/20 text-violet-400 border-violet-500/30 font-black shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                        : "bg-transparent text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-neutral-900/40"
                      }`}
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
        {/* МОБІЛЬНЕ МЕНЮ ДИРЕКТОРІЙ (ВСПЛИВАЮЧЕ) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div 
            className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
             onClick={() => setIsMobileMenuOpen(false)} />
            <div className="w-4/5 max-w-sm bg-[#0c0c0e] border-r border-neutral-800 p-6 overflow-y-auto
             z-10 font-mono">
              <div className="flex justify-between items-center mb-6 border-b border-neutral-900 pb-3">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                   НАВІГАЦІЯ ПО ХАБУ
                  </span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5
                 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {docsData.map((category) => (
                <div key={category.id} className="space-y-1.5 mb-5">
                  <div className="flex items-center gap-2 font-black text-neutral-200 
                  uppercase tracking-wider text-xs mb-1">
                    {category.icon}
                    <span>{category.title}</span>
                  </div>
                  <div className="pl-3 border-l border-neutral-800 space-y-1">
                    {category.articles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => {
                          setActiveCategoryId(category.id);
                          setActiveArticleId(article.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl 
                          border text-xs ${activeArticleId === article.id
                            ? "bg-violet-950/20 text-violet-400 border-violet-500/30 font-bold"
                            : "bg-transparent text-neutral-400 border-transparent"
                          }`}
                      >
                        {article.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="col-span-1 lg:col-span-8 flex flex-col space-y-5">
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 
           p-6 sm:p-8 rounded-2xl space-y-6 text-left shadow-2xl relative overflow-hidden min-h-[480px]">

            {/* Технічний ідентифікатор активної ноди */}
            <div className="absolute top-0 right-0 p-4 text-[9px] text-neutral-700 select-none">
              MANIFEST_ID: {activeCategory.id} // {activeArticle.id}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-violet-400 
            uppercase tracking-widest flex items-center gap-2.5 select-text">
              <Zap className="w-5 h-5 text-violet-500" />
              <span>{activeArticle.title}</span>
            </h1>

            <p className="text-neutral-300 leading-relaxed font-sans 
            text-sm sm:text-base select-text whitespace-pre-line">
              {activeArticle.description}
            </p>

            {/* Блок з синтаксисом коду, логів або JSON-структур */}
            {activeArticle.codeSnippet && (
              <div className="border-t border-slate-900 pt-5 space-y-2.5">
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest select-none 
                flex items-center gap-1.5 font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-600" />
                  СТРУКТУРНИЙ ДЕБАГ ТА МАЙСТЕР-ЛОГ JSON
                </div>
                <pre className={`p-4 bg-black/70 border border-slate-900 rounded-xl 
                overflow-x-auto text-[11px] sm:text-xs shadow-inner 
                select-text ${activeArticle.snippetColor === "cyan" ? "text-cyan-400" :
                    activeArticle.snippetColor === "emerald" ? "text-emerald-400" :
                      activeArticle.snippetColor === "amber" ? "text-amber-400" : "text-violet-400"
                  }`}>
                  <code>{activeArticle.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>

          {/* НАТИВНИЙ БАР ВЕРИФІКАЦІЇ БЕЗПЕКИ */}
          <div className="bg-neutral-900/20 border border-slate-900 p-4 rounded-xl 
          text-neutral-500 flex items-center gap-3 text-left select-none">
            <ShieldCheck className="w-5 h-5 text-emerald-500/40 shrink-0" />
            <span className="text-[10px] tracking-widest uppercase leading-snug">
              Manifest relay: документацію автоматично верифіковано внутрішніми SSL-протоколами та синхронізовано 
              з NoSQL кластером MongoDB Atlas
            </span>
          </div>
        </main>

      </div>
    </div>
  );
}
