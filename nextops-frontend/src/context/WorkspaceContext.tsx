"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { apiFetch, getApiHeaders, getApiUrl } from "@/lib/api";
import { readPaginatedCollection } from "@/lib/collections";

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

function WorkspaceSearchSync({
  onChange,
}: {
  onChange: (searchTarget: string | null, searchQuery: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const searchTarget = searchParams.get("search_target");
  const searchQuery = searchParams.get("q")?.toLowerCase().trim() ?? null;

  useEffect(() => {
    onChange(searchTarget, searchQuery);
  }, [onChange, searchTarget, searchQuery]);

  return null;
}

function WorkspaceProviderInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);
  const [searchTarget, setSearchTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const updateSearch = useCallback((target: string | null, query: string | null) => {
    setSearchTarget(target);
    setSearchQuery(query);
  }, []);

  const [rawProjects, setRawProjects] = useState<Project[]>([]);
  const [rawWebhooks, setRawWebhooks] = useState<WebhookConfig[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = getApiHeaders();
      const [resProjects, resWebhooks, resAnalytics] = await Promise.all([
        apiFetch(getApiUrl("/api/project"), { headers }),
        apiFetch(getApiUrl("/api/webhookconfig"), { headers }),
        apiFetch(getApiUrl("/api/apihistory"), { headers })
      ]);

      if (resProjects.ok && resWebhooks.ok) {
        const [projects, webhooks, history] = await Promise.all([
          readPaginatedCollection<Project>(resProjects),
          readPaginatedCollection<WebhookConfig>(resWebhooks),
          resAnalytics.ok
            ? readPaginatedCollection<unknown>(resAnalytics)
            : Promise.resolve(null),
        ]);
        const fetchedProjects = projects.data;
        const fetchedWebhooks = webhooks.data;

        setRawProjects(fetchedProjects);
        setRawWebhooks(fetchedWebhooks);

        const totalCount = history?.meta?.total ?? 0;
        setAnalytics({
          totalBudget: 0,
          averageCheck: 0,
          activeProjects: 0,
          totalProjects: totalCount,
          count_all: totalCount,
          active_count: 0
        });

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
    if (initialPathname.current === "/login" || initialPathname.current === "/invite") return;
    refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    const handleSessionRestored = (): void => {
      void refreshWorkspace();
    };
    window.addEventListener("nextops:session-restored", handleSessionRestored);
    return () => {
      window.removeEventListener("nextops:session-restored", handleSessionRestored);
    };
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
      <Suspense fallback={null}>
        <WorkspaceSearchSync onChange={updateSearch} />
      </Suspense>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  return <WorkspaceProviderInner>{children}</WorkspaceProviderInner>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider layer");
  }
  return context;
}
