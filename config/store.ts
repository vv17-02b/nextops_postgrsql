import { create } from "zustand";
import { ua } from "./localization/ua"; 
import { en } from "./localization/en";

export type Locale = "ua" | "en"; 

// Створюємо єдиний гнучкий тип для словника, який покриває обидві локалізації
export type Dictionary = typeof ua & typeof en;

interface AppState {
  // --- ЛОКАЛІЗАЦІЯ ---
  locale: Locale;
  t: typeof ua; // Використовуємо базову структуру як еталон
  isHydrated: boolean; // Прапорець завершення гідратації на клієнті
  setLocale: (locale: Locale) => void;
  initLanguage: () => void; 

  // --- МОДАЛЬНІ ВІКНА ---
  isAuthModalOpen: boolean;
  isUpgradeModalOpen: boolean;
  isReviewModalOpen: boolean;
  setAuthModal: (isOpen: boolean) => void;
  setUpgradeModal: (isOpen: boolean) => void;
  setReviewModal: (isOpen: boolean) => void;

  // --- ІНТЕРАКТИВНА ВИДИМІСТЬ БЛОКІВ НА СТОРІНЦІ (SPA) ---
  isPricingVisible: boolean;
  isReviewsVisible: boolean;
  setPricingVisible: (isVisible: boolean) => void;
  setReviewsVisible: (isVisible: boolean) => void;

  // --- БЕЗПЕКА ТА ВЛАСНИК ---
  userRole: "DEVELOPER" | "ADMIN";
  userPlan: "FREE" | "PRO" | "ENTERPRISE";
  setUserSession: (role: "DEVELOPER" | "ADMIN", plan: "FREE" | "PRO" | "ENTERPRISE") => void;
  isOwnerBypass: () => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  locale: "ua",
  t: ua,
  isHydrated: false, // Спочатку сервер і клієнт стартують в однаковому стані
  
  setLocale: (locale) => {
    const translations = locale === "ua" ? ua : en;
    set({ locale, t: translations });
    if (typeof window !== "undefined") {
      localStorage.setItem("nextops_lang", locale);
    }
  },

  initLanguage: () => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("nextops_lang") as Locale;
      if (savedLang === "ua" || savedLang === "en") {
        const translations = savedLang === "ua" ? ua : en;
        set({ locale: savedLang, t: translations, isHydrated: true });
        return;
      }
      set({ isHydrated: true }); // Якщо мови в localStorage немає, гідратація все одно завершена
    }
  },

  isAuthModalOpen: false,
  isUpgradeModalOpen: false,
  isReviewModalOpen: false,
  setAuthModal: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setUpgradeModal: (isOpen) => set({ isUpgradeModalOpen: isOpen }),
  setReviewModal: (isOpen) => set({ isReviewModalOpen: isOpen }),

  isPricingVisible: false,
  isReviewsVisible: false,
  setPricingVisible: (isVisible) => set({ isPricingVisible: isVisible }),
  setReviewsVisible: (isVisible) => set({ isReviewsVisible: isVisible }),

  userRole: "DEVELOPER",
  userPlan: "FREE",
  
  // ПРИМІТКА ПРОДАКШЕНУ: Використовувати ВИКЛЮЧНО для синхронізації UI-елементів лендінгу.
  // Головним сервером правди для захищених роутів залишається NextAuth (auth() / useSession())
  setUserSession: (role, plan) => set({ userRole: role, userPlan: plan }),

  isOwnerBypass: () => get().userRole === "ADMIN",
}));
