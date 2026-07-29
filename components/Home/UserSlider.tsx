// C:\Users\Admin\Documents\my-unified-work-space\components\Home\UserSlider.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // Для отримання та поновлення локальної сесії
import { motion } from "framer-motion";
import { Settings, FileImage, Trash2, UserPlus, ShieldCheck } from "lucide-react";


interface StreamUser {
  id: string;
  name: string;
  role: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  image?: string | null;
}

export default function UserSlider() {
  const { data: session, update: updateSession } = useSession(); // Метод update оновить сесію в Навбарі без релоаду
  const [users, setUsers] = useState<StreamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стан для інтерактивної Cyber-Glass панелі налаштувань профілю
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchStreamUsers = async () => {
    try {
      const res = await fetch("/api/v1/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Не вдалося завантажити підписників для слайдера:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamUsers();
  }, []);

  // Ініціалізуємо поля форми даними з поточної сесії Auth.js
  useEffect(() => {
    if (session?.user) {
      setNewName(session.user.name || "");
      setNewImage(session.user.image || "");
    }
  }, [session]);

  // Хендлер відправки мутацій на наш новий серверний шлюз profile
  const handleUpdateProfile = async (e: React.FormEvent, shouldDeleteImage = false) => {
    if (e) e.preventDefault();
    if (!newName.trim()) return;

    setIsUpdating(true);
    setProfileError(null);
    const targetImgValue = shouldDeleteImage ? "" : newImage;

    try {
      const res = await fetch("/api/v1/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, image: targetImgValue }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (shouldDeleteImage) setNewImage("");
        // Поновлюємо клієнтську сесію, щоб Навбар та форми миттєво побачили нове ім'я розробника
        await updateSession({ name: newName, image: targetImgValue });
        // Миттєво перечитуємо стрім з MongoDB Atlas для каруселі
        await fetchStreamUsers();
        setIsSettingsOpen(false);
      } else {
        setProfileError(result.error || "Помилка оновлення профілю.");
      }
    } catch (err) {
      setProfileError("Не вдалося встановити зв'язок з сервером.");
    } finally {
      setIsUpdating(false);
    }
  };
  // Розраховуємо фолбек та дублювання масиву для безшовного скролу
  const displayUsers = users.length > 0 ? users : [
    { id: "fallback_core", name: "vlad_engine", role: "SaaS Core Architect", plan: "PRO" as const, image: null }
  ];
  const duplicatedUsers = [...displayUsers, ...displayUsers, ...displayUsers, ...displayUsers];

  if (isLoading) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] bg-neutral-900/20 border border-neutral-900 rounded-2xl flex items-center justify-center font-mono text-xs text-neutral-500">
        <span className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-2"></span>
        <span>SYNCHRONIZING_CYBER_STREAM...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-neutral-900/20 backdrop-blur-xl border border-white/5 rounded-2xl p-4 overflow-visible shadow-[20px_20px_50px_rgba(0,0,0,0.8)] select-none flex flex-col gap-4">

      {/* Шапка та кнопка виклику кастомізації профілю */}
      <div className="flex justify-between items-center border-b border-neutral-900 pb-2 select-none font-mono text-xs">
        <span className="text-neutral-400 font-bold uppercase tracking-wider">// PLATFORM_LIVE_STREAM</span>
        {session?.user && (
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-cyan-400 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Налаштування профілю розробника"
          >
            <Settings className="w-3.5 h-3.5 animate-spin [animation-duration:10s]" />
            <span>[ EDIT_PROFILE ]</span>
          </button>
        )}
      </div>

      <div className="relative w-full h-[220px] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-neutral-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-neutral-950 to-transparent z-10 pointer-events-none" />

        {/* Вертикальна карусель Framer-Motion */}
        <motion.div
          className="flex flex-col gap-3"
          animate={{ y: [0, -450] }}
          transition={{
            ease: "linear",
            duration: displayUsers.length * 5,
            repeat: Infinity
          }}
        >
          {duplicatedUsers.map((user, idx) => {
            const isCoreUser = user.name ? user.name.toLowerCase().includes("vlad") : false;
            let avatarSrc = null;

            if (isCoreUser && !user.image) {
              avatarSrc = "/images/avatar.jpg";
            } else if (user.image) {
              avatarSrc = user.image;
            }

            return (
              <div
                key={`${user.id}-${idx}`}
                className="flex items-center gap-3 bg-neutral-900/40 border border-neutral-800/60 p-3.5 rounded-xl hover:border-blue-500/20 transition-all duration-300 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-black uppercase text-blue-500 shrink-0 font-mono overflow-hidden">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover object-center brightness-95" />
                  ) : (
                    (user.name || "US").substring(0, 2)
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-black text-neutral-200 font-mono truncate">@{user.name || "anonymous"}</span>
                  <span className="text-[10px] text-neutral-500 font-sans mt-0.5 truncate">{user.role || "Platform Engineer"}</span>
                </div>

                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md border shrink-0 font-mono ${user.plan === "PRO" || user.plan === "ENTERPRISE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                  : "bg-neutral-950 text-neutral-500 border-neutral-850"
                  }`}>
                  {user.plan}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* =================================================================
               🎨 ІНТЕРАКТИВНА ЦИФРОВА ПАНЕЛЬ НАЛАШТУВАНЬ (CYBER-GLASS ФOРМА)
         ================================================================= */}
      {isSettingsOpen && (
        <div className="absolute top-10 inset-x-0 bg-neutral-950/95 border border-cyan-500/30 p-4 rounded-xl shadow-2xl z-40 animate-fadeIn font-mono text-xs">
          <h4 className="text-neutral-300 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-[11px] border-b border-neutral-900 pb-1.5">
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" /> Керування NoSQL вузлом користувача
          </h4>

          {profileError && (
            <p className="p-2 mb-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg">
              {profileError}
            </p>
          )}

          <form onSubmit={(e) => handleUpdateProfile(e, false)} className="space-y-3 text-left">
            <div>
              <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1">Новий системний нікнейм</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value.replace(/\s+/g, ""))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 font-mono h-[36px]"
                required
                placeholder="Введіть нікнейм..."
              />
            </div>

            <div>
              <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1">URL-адреса картинки аватара</label>
              <div>
                <label className="block text-[9px] text-neutral-500 uppercase font-black mb-1">URL-адреса картинки аватара</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 pl-8 text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px] h-[36px] truncate"
                      placeholder="https://example.com"
                    />
                    {/* 🔥 ОСТАТOЧНИЙ ФІКС: Використовуємо нативну іконку FileImage. Помилки alt-text та undef повністю ліквідовані */}
                    <FileImage className="w-3.5 h-3.5 text-neutral-600 absolute left-2.5 top-3" />
                  </div>
                  {session?.user?.image && (
                    <button
                      type="button"
                      onClick={(e) => handleUpdateProfile(e, true)}
                      className="px-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 h-[36px]"
                      title="Видалити photo та повернути ініціали"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>



            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-neutral-950 font-black rounded-lg uppercase tracking-wider text-[10px] transition cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                {isUpdating ? "SYNCHRONIZING..." : "SAVE_MUTATION"}
              </button>
              <button
                type="button"
                onClick={() => { setIsSettingsOpen(false); setProfileError(null); }}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer"
              >
                [ ESC ]
              </button>
            </div>
          </form>

          <div className="mt-3 pt-2 border-t border-neutral-900 text-[9px] text-neutral-600 flex items-center gap-1.5 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/30" />
            <span>Зміни миттєво перезапишуть NoSQL сесію Auth.js</span>
          </div>
        </div>
      )}

    </div>
  );
}
