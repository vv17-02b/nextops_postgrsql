"use client";


import { useAgentKnowledgeBase } from '@/hooks/useAgentknowledgebase';
import AgentKnowledgeBaseForm from '@/components/agentknowledgebase/agentknowledgebase-form';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { ApiErrorBanner } from '@/components/common/collection-controls';
import { Trash2, Bot, Send, Sparkles, BookOpen, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface KnowledgeSourceRef {
  id: string;
  title: string;
  type: 'KNOWLEDGE_DOC' | 'PRODUCT';
  snippet: string;
}

interface AskAssistantResponse {
  answer: string;
  provider: 'openai' | 'local-rag';
  chargedMinor: number;
  remainingBudgetMinor: number;
  sources: KnowledgeSourceRef[];
}

export default function AgentKnowledgeBasePage(): React.JSX.Element {
  const { data, loading, createItem, deleteItem } = useAgentKnowledgeBase();

  const [question, setQuestion] = useState<string>('');
  const [asking, setAsking] = useState<boolean>(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AskAssistantResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (initialQuery) {
      setQuestion(initialQuery);
    }
  }, []);


  const handleAskAssistant = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setAskError('Введіть запитання для AI-консультанта.');
      return;
    }

    setAsking(true);
    setAskError(null);
    try {
      const res = await apiFetch(getApiUrl('/api/agentknowledgebase/ask'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify({ question: trimmed }),
      });

      const payload = (await res.json()) as AskAssistantResponse & { message?: string };
      if (!res.ok) {
        setAskError(payload.message ?? `Не вдалося отримати відповідь AI (HTTP ${res.status}).`);
        return;
      }

      setAiResult(payload);
    } catch (err: unknown) {
      setAskError(err instanceof Error ? err.message : 'Помилка мережі при зверненні до AI.');
    } finally {
      setAsking(false);
    }
  };
  return (
    <div className="space-y-6 font-sans">
      {/* Шапка */}
      <div className="bg-gray-950/40 backdrop-blur-md p-4 sm:p-6 border border-white/10 rounded-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white font-mono flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-400 shrink-0" />
              <span>База знань та корпоративний AI-консультант</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1">
              RAG-пошук по документах і товарах компанії (<code className="text-blue-400">/api/agentknowledgebase/ask</code>)
            </p>
          </div>
          <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold font-mono text-blue-300">
            PostgreSQL RLS + FinOps Budget
          </span>
        </div>
      </div>

      {/* Скляна картка AI-консультанта */}
      <div className="bg-gray-950/40 backdrop-blur-md p-4 sm:p-6 border border-white/10 rounded-xl shadow-2xl font-mono space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Запитати AI-асистента по базі знань</span>
          </div>
          {aiResult && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-emerald-300">
                {aiResult.provider === 'openai' ? 'OpenAI LLM' : 'Local RAG Engine'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-gray-300">
                <Wallet className="h-3 w-3 text-blue-400" />
                Залишок: ${(aiResult.remainingBudgetMinor / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <ApiErrorBanner error={askError} onDismiss={() => setAskError(null)} />

        <form onSubmit={(e) => void handleAskAssistant(e)} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="ai-knowledge-question" className="sr-only">
            Запитання до AI-консультанта
          </label>
          <input
            id="ai-knowledge-question"
            name="aiKnowledgeQuestion"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Напр. Які умови гарантії або яка ціна ноутбука NextOps Pro?"
            className="flex-1 rounded-lg border border-white/10 bg-gray-900/70 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={asking}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500 bg-blue-600/30 px-5 py-2.5 text-xs sm:text-sm font-semibold text-blue-200 hover:bg-blue-600/50 transition cursor-pointer disabled:opacity-40 shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>{asking ? 'Аналіз бази...' : 'Запитати AI'}</span>
          </button>
        </form>

        {aiResult && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-3">
            <div className="text-xs sm:text-sm text-gray-100 whitespace-pre-line leading-relaxed">
              {aiResult.answer}
            </div>

            {aiResult.sources.length > 0 && (
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                  <span>Використані джерела ({aiResult.sources.length}):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiResult.sources.map((src) => (
                    <div
                      key={`${src.type}-${src.id}`}
                      className="rounded-lg border border-white/10 bg-gray-900/60 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-white truncate">{src.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-blue-300 shrink-0">
                          {src.type === 'PRODUCT' ? 'Товар' : 'Документ'}
                        </span>
                      </div>
                      <p className="text-gray-400 line-clamp-2 text-[11px]">{src.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AgentKnowledgeBaseForm onSubmit={createItem} />

      {/* Головний контейнер таблиці */}
      <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-white/10 bg-gray-900/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
            Документи бази знань у PostgreSQL
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm font-mono">Виконується запит до сервера...</div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-900/50 text-xs font-semibold text-gray-400 uppercase border-b border-white/10 font-mono">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">ID Документа</th>
                  <th scope="col" className="px-4 py-3 text-left">Project ID</th>
                  <th scope="col" className="px-4 py-3 text-left">Заголовок бази знань</th>
                  <th scope="col" className="px-4 py-3 text-left">Вміст (Контент)</th>
                  <th scope="col" className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition text-xs sm:text-[13px]">
                    <td className="px-4 py-3 font-mono text-xs text-blue-400 whitespace-nowrap">{item.id}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{String(item.projectId || '-')}</td>
                    <td className="px-4 py-3 text-white font-semibold">{String(item.title || '-')}</td>
                    <td className="px-4 py-3 break-words text-gray-300 max-w-md">{String(item.content || '-')}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        aria-label="Видалити запис"
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-md transition inline-flex cursor-pointer"
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
          <div className="p-8 text-center text-gray-400 text-sm font-mono">
            Колекція порожня. Заповніть форму вище, щоб додати перший документ.
          </div>
        )}
      </div>
    </div>
  );
}
