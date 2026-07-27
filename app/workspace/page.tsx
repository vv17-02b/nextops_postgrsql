"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/config/store";
import Link from "next/link";
import { Terminal, Send, ArrowLeft, ShieldCheck, Globe, Code } from "lucide-react";

export default function WorkspacePage() {
  const { data: session } = useSession();

  const [url, setUrl] = useState("http://localhost:3000/api/v1/projects");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{\n  "title": "Новий ШІ-Робот",\n  "budget": 500\n}');
  
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string>("// Результат відповіді сервера з'явиться тут після відправки запиту...");
  const [isSending, setIsProcessing] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsProcessing(true);
    setResponseStatus(null);
    setResponseData("// З'єднання з кластером MongoDB Atlas через Secure Proxy...");

    // Safe JSON Parsing for Request Body
    let parsedBody = null;
    if (method !== "GET" && method !== "HEAD") {
      try {
        parsedBody = JSON.parse(body.trim());
      } catch (jsonErr: any) {
        setIsProcessing(false);
        setResponseStatus(400);
        setResponseData(`// [JSON_PARSE_ERROR]: Некоректний формат Request Body.\n// Перевірте наявність ком та лапок.\n// Деталі: ${jsonErr.message}`);
        return;
      }
    }

    try {
      const res = await fetch("/api/dev/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          method,
          headers: headers.trim(),
          body: parsedBody
        })
      });

      const result = await res.json();
      
      if (res.ok && result.success) {
        setResponseStatus(result.status);
        try {
          const formattedJson = JSON.stringify(JSON.parse(result.data), null, 2);
          setResponseData(formattedJson);
        } catch {
          setResponseData(result.data || "// Успішно обролено порожній пакет.");
        }
      } else {
        setResponseStatus(res.status || 500);
        setResponseData(JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData(`// [CRASH]: Помилка виконання запиту через ретранслятор: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white p-4 sm:p-6 font-mono text-sm relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293703_1px,transparent_1px),linear-gradient(to_bottom,#1f293703_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* ШАПКА ПОСТМАНА */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-neutral-900 sticky top-0 bg-neutral-950/80 backdrop-blur-md z-30 select-none">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm sm:text-base font-black tracking-widest text-neutral-200 uppercase">
            NextOps // API_SANDBOX_POSTMAN_EMULATOR
          </h1>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-neutral-900 to-neutral-850 hover:from-neutral-800 hover:to-neutral-750 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl transition shadow-lg cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-500 font-bold" />
            <span>RETURN_TO_HOME</span>
          </Link>
        </div>
      </header>

      {/* РОБОЧИЙ ІНТЕРФЕЙС */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ЛІВА ЧАСТИНА: ПАНЕЛЬ ВВЕДЕННЯ ЗАПИТУ */}
        <div className="lg:col-span-5 border border-white/5 bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Globe className="w-4 h-4" /> CONFIGURE_HTTP_REQUEST
          </h2>

          <form onSubmit={handleSendRequest} className="space-y-4">
            {/* Метод + URL */}
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="p-3 text-xs font-black bg-neutral-950 border border-neutral-800 text-emerald-400 font-mono rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 p-3 text-xs bg-neutral-950 border border-neutral-800 text-white font-mono rounded-xl focus:outline-none focus:border-blue-500"
                placeholder="Введіть URL для перевірки API..."
                required
              />
            </div>

            {/* Хедери */}
            <div>
              <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1 select-none">Custom Headers (JSON)</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full h-24 p-3 bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs rounded-xl focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Тіло запиту (Body) */}
            {method !== "GET" && method !== "HEAD" && (
              <div>
                <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1 select-none">Request Body (JSON)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full h-32 p-3 bg-neutral-950 border border-neutral-800 text-cyan-400 font-mono text-xs rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-900 text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
            >
              {isSending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  <span>DISPATCHING_PACKET...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>EXECUTE_API_REQUEST</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ПРАВА ЧАСТИНА: ПАНЕЛЬ ЕКРАНУ ВІДПОВІДІ (RESPONSE) */}
        <div className="lg:col-span-7 border border-white/5 bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center border-b border-neutral-800/60 pb-3 mb-3 select-none">
            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4" /> SERVER_RESPONSE_WINDOW
            </h2>
            {responseStatus && (
              <span className={`px-2.5 py-1 text-xs font-black rounded-lg border font-mono ${
                responseStatus >= 200 && responseStatus < 300 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                STATUS: {responseStatus}
              </span>
            )}
          </div>

          {/* Чорне вікно виводу JSON коду */}
          <div className="flex-1 bg-neutral-950 p-4 rounded-xl border border-neutral-900 overflow-auto font-mono text-xs text-emerald-400/90 whitespace-pre text-left shadow-inner selection:bg-emerald-500/20">
            {responseData}
          </div>
        </div>

      </main>

      <div className="max-w-7xl mx-auto border-t border-neutral-900 mt-6 pt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-600 font-mono select-none">
        <ShieldCheck className="w-4 h-4 text-emerald-500/30" />
        <span>PROXY RELAY CORE ENCRYPTED WITH SSL SECURITY LAYER // HISTORY_LOGGING: ENABLED</span>
      </div>
    </div>
  );
}
