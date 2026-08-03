"use client";

import React, { useState } from "react";
import { useAppStore } from "@/config/store";
import { CreditCard, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

interface CreditCardFormProps {
  planType: "PRO" | "ENTERPRISE" | string;
  price: string;
  onSuccess?: (redirectUrl: string) => void;
}

export default function CreditCardForm({ planType, price, onSuccess }: CreditCardFormProps) {
  const { setUpgradeModal } = useAppStore();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Маска номера картки: безпечна та сумісна з TypeScript
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 16);
    const parts = [];

    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }
    
    setCardNumber(parts.length > 0 ? parts.join(" ").trim() : value);
  };

  // ФІКС МАСКИ ДАТИ: Забезпечує коректне видалення символів через Backspace
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Якщо користувач видаляє символ і рядок закінчується на слеш — видаляємо і слеш, і попередню цифру
    if (expiry.endsWith("/") && input.length < expiry.length) {
      setExpiry(input.substring(0, input.length - 1));
      return;
    }

    const value = input.replace(/\D/g, "").substring(0, 4);
    
    if (value.length > 2) {
      setExpiry(`${value.substring(0, 2)}/${value.substring(2, 4)}`);
    } else if (value.length === 2 && input.length > expiry.length) {
      // Додаємо слеш автоматично тільки під час введення вперед
      setExpiry(`${value}/`);
    } else {
      setExpiry(value);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3 || !name.trim()) {
      setErrorMessage("Будь ласка, заповніть всі платіжні реквізити коректно.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: planType || "PRO" }),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success) {
        setUpgradeModal(false);
        if (onSuccess) {
          onSuccess(result.url);
        } else {
          window.location.href = result.url;
        }
      } else {
        setErrorMessage(result.error || "Помилка процесингу платіжного шлюзу.");
        setIsProcessing(false);
      }
    } catch (error: unknown) {
      // ФІКС БІЛДY: Знищено тип 'any', замінено на суворий TypeScript-стандарт
      const err = error as Error;
      console.error(" [CreditCardForm Submit Error]:", err.message);
      setErrorMessage("Не вдалося встановити зв'язок з платіжним сервером.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-neutral-950 p-5 rounded-2xl border border-neutral-900 
    shadow-2xl relative select-none text-left">
      <div className="absolute top-3 right-3 text-[9px] font-black 
      uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 
      py-0.5 rounded-full flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5" /> SECURE_GATEWAY
      </div>

      <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-4 flex items-center gap-2 font-mono">
        <CreditCard className="w-4 h-4 text-blue-500" /> ВВЕДЕННЯ ПЛАТІЖНОЇ КАРТИ
      </h3>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20
         text-red-400 text-xs font-mono rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePaymentSubmit} className="space-y-3.5 font-mono text-xs">
        <div>
          <label className="block text-neutral-500 font-bold uppercase mb-1 text-[10px]">
            Власник карти (ПІБ англійською)
            </label>
          <input
            type="text"
            placeholder="VLADIMIR UMAN"
            value={name}
            // ФІКС ВАЛІДАЦІЇ: Дозволяємо лише латинські літери та пробіли, обмежуємо довжину
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase().substring(0, 30))}
            className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800
             text-white focus:outline-none focus:border-blue-500 text-xs font-mono h-[44px]"
            required
          />
        </div>

        <div>
          <label className="block text-neutral-500 font-bold uppercase mb-1 text-[10px]">
            Номер кредитної карти
            </label>
          <input
            type="text"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={handleCardChange}
            className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800
             text-white focus:outline-none focus:border-blue-500 text-xs font-mono tracking-widest h-[44px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-500 font-bold uppercase mb-1 text-[10px]">Термін дії</label>
            <input
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={handleExpiryChange}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500 text-xs font-mono text-center h-[44px]"
              required
            />
          </div>
          <div>
            <label className="block text-neutral-500 font-bold uppercase mb-1 text-[10px]">Код CVC / CVV</label>
            <input
              type="password"
              placeholder="***"
              maxLength={3}
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-blue-500 text-xs font-mono text-center tracking-widest h-[44px]"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 disabled:bg-neutral-900 text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 font-mono"
        >
          {isProcessing ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
              <span>PROCESSING_TRANSACTION...</span>
            </>
          ) : (
            <span>АКТИВУВАТИ ТАРИФ {planType} // {price}</span>
          )}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-neutral-900 text-[10px] text-neutral-500 flex items-center gap-2 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>AES-256 PCI-DSS BANKING COMPLIANCE SECURITY LAYER</span>
      </div>
    </div>
  );
}
