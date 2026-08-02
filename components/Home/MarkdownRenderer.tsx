"use client";

import React, { useEffect, useState } from "react";

interface RendererProps {
  url: string;
}

export default function MarkdownRenderer({ url }: RendererProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          setContent(text);
        } else {
          setContent("# Помилка\nНе вдалося завантажити маніфест.");
        }
      } catch {
        setContent("# Помилка\nМережевий збій при читанні файлу.");
      } finally {
        setIsLoading(false);
      }
    };

    if (url) loadTemplate();
  }, [url]);

  if (isLoading) {
    return <div className="text-center font-mono text-xs text-neutral-500">// SYNCHRONIZING_TEMPLATE...</div>;
  }

  return (
    /* Головний контейнер: тепер адаптивний за шириною (w-full), p-4 на мобільних, p-6 на десктопах */
    <div className="w-full bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-6 shadow-2xl text-left font-mono overflow-hidden">
      <div 
        className="text-neutral-300 whitespace-pre-line text-[11px] sm:text-xs leading-relaxed 
                   max-h-[400px] sm:max-h-[550px] overflow-y-auto pr-2
                   scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
        style={{
          /* Кастомні інлайнові стилі для тонкого кібер-скролбару, які працюють у всіх браузерах */
          scrollbarWidth: 'thin',
          scrollbarColor: '#262626 transparent'
        }}
      >
        {content}
      </div>
    </div>
  );
}
