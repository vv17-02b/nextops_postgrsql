"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
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

export interface CurrentSessionUser {
  id: string;
  email: string | null;
  role: string;
  companyId: string | null;
  companyName: string | null;
  planCode: string | null;
}

interface WorkspaceContextType {
  projects: Project[];
  webhooks: WebhookConfig[];
  analytics: Analytics | null;
  activeProject: Project | null;
  currentUser: CurrentSessionUser | null;
  setActiveProject: (project: Project | null) => void;
  updateWorkspaceName: (name: string) => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSessionUser(payload: unknown): CurrentSessionUser | null {
  if (!isRecord(payload) || !isRecord(payload.user)) return null;
  const user = payload.user;
  if (typeof user.id !== "string" || typeof user.role !== "string") return null;
  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : null,
    role: user.role,
    companyId: typeof user.companyId === "string" ? user.companyId : null,
    companyName: typeof user.companyName === "string" ? user.companyName : null,
    planCode: typeof user.planCode === "string" ? user.planCode : null,
  };
}

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
  const [currentUser, setCurrentUser] = useState<CurrentSessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = getApiHeaders();
      const [resMe, resProjects, resWebhooks, resAnalytics] = await Promise.all([
        apiFetch(getApiUrl("/api/auth/me"), { headers }),
        apiFetch(getApiUrl("/api/project"), { headers }),
        apiFetch(getApiUrl("/api/webhookconfig"), { headers }),
        apiFetch(getApiUrl("/api/apihistory"), { headers }),
      ]);

      if (resMe.ok) {
        const mePayload: unknown = await resMe.json();
        setCurrentUser(parseSessionUser(mePayload));
      } else {
        setCurrentUser(null);
      }

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
          active_count: 0,
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
      console.error("[WorkspaceContext Sync Error]:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWorkspaceName = useCallback(async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new Error("Назва компанії має містити щонайменше 2 символи.");
    }
    const response = await apiFetch(getApiUrl("/api/auth/workspace"), {
      method: "PATCH",
      headers: getApiHeaders(true),
      body: JSON.stringify({ name: trimmed }),
    });
    if (!response.ok) {
      throw new Error(`Не вдалося оновити назву компанії (HTTP ${response.status}).`);
    }
    setCurrentUser((prev) => (prev ? { ...prev, companyName: trimmed } : prev));
  }, []);

  const filteredProjects = useMemo(() => {
    if (searchQuery && searchTarget === "AI_NODES") {
      return rawProjects.filter(
        (p: Project) =>
          p.name.toLowerCase().includes(searchQuery) ||
          (p.description && p.description.toLowerCase().includes(searchQuery)),
      );
    }
    return rawProjects;
  }, [rawProjects, searchQuery, searchTarget]);

  const filteredWebhooks = useMemo(() => {
    if (searchQuery && searchTarget === "WEBHOOKS") {
      return rawWebhooks.filter(
        (w: WebhookConfig) =>
          w.events.some((e: string) => e.toLowerCase().includes(searchQuery)) ||
          w.url.toLowerCase().includes(searchQuery),
      );
    }
    return rawWebhooks;
  }, [rawWebhooks, searchQuery, searchTarget]);

  useEffect(() => {
    if (initialPathname.current === "/login" || initialPathname.current === "/invite") return;
    void refreshWorkspace();
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
        currentUser,
        setActiveProject,
        updateWorkspaceName,
        refreshWorkspace,
        isLoading,
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
