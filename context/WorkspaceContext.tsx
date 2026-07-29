// C:\Users\Admin\Documents\my-unified-work-space\context\WorkspaceContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

// Інтерфейси NoSQL-документів MongoDB Atlas
interface Project {
  id: string;
  title: string;
  description?: string | null;
  budget: number;
  status: "PLANNING" | "ACTIVE" | string;
  createdAt: string;
}

interface WebhookConfig {
  id: string;
  targetEvent: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface Analytics {
  totalBudget: number;
  averageCheck: number;
  activeProjects: number;
  totalProjects: number;
  count_all?: number;
  active_count?: number;
}

interface WorkspaceContextType {
  projects: Project[];
  webhooks: WebhookConfig[];
  analytics: Analytics | null;
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  refreshWorkspace: () => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Внутрішній компонент, який безпечно використовує хук useSearchParams
function WorkspaceProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  // Перехоплюємо живі параметри пошуку з URL Навбару
  const searchParams = useSearchParams();
  const searchTarget = searchParams ? searchParams.get("search_target") : null;
  const searchQuery = searchParams ? searchParams.get("q")?.toLowerCase().trim() : null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Головна функція синхронізації 4-х інженерних вікон матриці
  const refreshWorkspace = useCallback(async () => {
    // ЗАХИСТ СЕСІЇ: Блокуємо передчасні запити 401 до API під час завантаження куків
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    try {
      setIsLoading(true);

      const [resProjects, resWebhooks, resAnalytics] = await Promise.all([
        fetch("/api/v1/projects"),
        fetch("/api/v1/webhooks"),
        fetch("/api/v1/analytics")
      ]);

      if (resProjects.ok && resWebhooks.ok && resAnalytics.ok) {
        const dataProj = await resProjects.json();
        const dataWh = await resWebhooks.json();
        const dataAnal = await resAnalytics.json();

        let fetchedProjects: Project[] = dataProj.projects || [];
        let fetchedWebhooks: WebhookConfig[] = dataWh.webhooks || [];

        // Жива інтелектуальна фільтрація на основі пошукового рядка Навбару
        if (searchQuery) {
          if (searchTarget === "AI_NODES") {
            fetchedProjects = fetchedProjects.filter((p: Project) => 
              p.title.toLowerCase().includes(searchQuery) || 
              (p.description && p.description.toLowerCase().includes(searchQuery))
            );
          } else if (searchTarget === "WEBHOOKS") {
            fetchedWebhooks = fetchedWebhooks.filter((w: WebhookConfig) => 
              w.targetEvent.toLowerCase().includes(searchQuery) || 
              w.targetUrl.toLowerCase().includes(searchQuery)
            );
          }
        }

        setProjects(fetchedProjects);
        setWebhooks(fetchedWebhooks);

        // Синхронізація FinOps метрик для Вікна №4 (WorkspaceDb.tsx)
        if (dataAnal.success && dataAnal.metrics) {
          setAnalytics({
            totalBudget: dataAnal.metrics.totalBudget,
            averageCheck: dataAnal.metrics.averageCheck,
            activeProjects: dataAnal.metrics.activeProjects,
            totalProjects: dataAnal.metrics.totalProjects,
            count_all: dataAnal.metrics.totalProjects, 
            active_count: dataAnal.metrics.activeProjects 
          });
        }

        // Автоматично тримаємо фокус на поточному проєкті або фіксуємо найперший елемент масиву
        if (fetchedProjects.length > 0) {
          setActiveProject((prev) => {
            const stillExists = fetchedProjects.find((p: Project) => p.id === prev?.id);
            return stillExists || fetchedProjects[0]; // Виправлено: беремо перший індекс [0] замість усього масиву
          });
        } else {
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error("🚨 [WorkspaceContext Sync Error]:", err);
    } finally {
      setIsLoading(false);
    }
  }, [status, session, searchQuery, searchTarget]);

  // Запускаємо фетч тільки після підтвердження авторизації, уникаючи дублювання та Race Condition
  useEffect(() => {
    if (status === "authenticated") {
      refreshWorkspace();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, refreshWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        webhooks,
        analytics,
        activeProject,
        setActiveProject,
        refreshWorkspace,
        isLoading: isLoading || status === "loading"
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// =================================================================
// 🛡️ РУТОВИЙ ПРОВАЙДЕР З КУЛЕНЕПРОБИВНОЮ ОГОРТКОЮ SUSPENSE (ФІКС ДЛЯ YARN BUILD)
// =================================================================
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center font-mono text-xs text-neutral-500 z-50">
        <span className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-2"></span>
        <span>CONNECTING_NEXTOPS_CORES...</span>
      </div>
    }>
      <WorkspaceProviderInner>{children}</WorkspaceProviderInner>
    </Suspense>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider layer");
  }
  return context;
}
