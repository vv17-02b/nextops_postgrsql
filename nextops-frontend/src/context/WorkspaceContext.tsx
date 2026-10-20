"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense
} from "react";
import { useSearchParams } from "next/navigation";

export interface Project {
  id: string;
  userId: string;
  name: string;      
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookConfig {
  id: string;
  projectId: string;
  url: string;        
  secret: string;     
  events: string[];   
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
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

function WorkspaceProviderInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const searchTarget = searchParams ? searchParams.get("search_target") : null;
  const searchQuery = searchParams ? searchParams.get("q")?.toLowerCase().trim() : null;

  const [rawProjects, setRawProjects] = useState<Project[]>([]);
  const [rawWebhooks, setRawWebhooks] = useState<WebhookConfig[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resProjects, resWebhooks, resAnalytics] = await Promise.all([
        fetch("/api/project"),
        fetch("/api/webhookconfig"),
        fetch("/api/apihistory") 
      ]);

      if (resProjects.ok && resWebhooks.ok) {
        const dataProj = await resProjects.json();
        const dataWh = await resWebhooks.json();

        const fetchedProjects: Project[] = Array.isArray(dataProj) ? dataProj : dataProj.projects || [];
        const fetchedWebhooks: WebhookConfig[] = Array.isArray(dataWh) ? dataWh : dataWh.webhooks || [];

        setRawProjects(fetchedProjects);
        setRawWebhooks(fetchedWebhooks);

        if (resAnalytics.ok) {
          const dataAnal = await resAnalytics.json();
          if (dataAnal && (dataAnal.metrics || Array.isArray(dataAnal))) {
            const totalCount = Array.isArray(dataAnal) ? dataAnal.length : 0;
            setAnalytics({
              totalBudget: 0,
              averageCheck: 0,
              activeProjects: 0,
              totalProjects: totalCount,
              count_all: totalCount,
              active_count: 0
            });
          }
        }

        if (fetchedProjects.length > 0) {
          setActiveProject((prev) => {
            const stillExists = fetchedProjects.find((p: Project) => p.id === prev?.id);
            return stillExists || fetchedProjects[0];
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
  }, []);

  const filteredProjects = useMemo(() => {
    if (searchQuery && searchTarget === "AI_NODES") {
      return rawProjects.filter((p: Project) =>
        p.name.toLowerCase().includes(searchQuery) ||
        (p.description && p.description.toLowerCase().includes(searchQuery))
      );
    }
    return rawProjects;
  }, [rawProjects, searchQuery, searchTarget]);

  const filteredWebhooks = useMemo(() => {
    if (searchQuery && searchTarget === "WEBHOOKS") {
      return rawWebhooks.filter((w: WebhookConfig) =>
        w.events.some((e: string) => e.toLowerCase().includes(searchQuery)) ||
        w.url.toLowerCase().includes(searchQuery)
      );
    }
    return rawWebhooks;
  }, [rawWebhooks, searchQuery, searchTarget]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        projects: filteredProjects,
        webhooks: filteredWebhooks,
        analytics,
        activeProject,
        setActiveProject,
        refreshWorkspace,
        isLoading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center font-mono text-xs text-slate-500 z-50">
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
