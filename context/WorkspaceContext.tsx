"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  budget: number;
  status: string;
  createdAt: string;
}

export interface WebhookConfig {
  id: string;
  targetEvent: string;
  targetUrl: string;
  isActive: boolean;
}

export interface AnalyticsData {
  count_all: number;
  sum_budget: number;
  avg_budget: number;
  active_count: number;
}

interface WorkspaceContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  webhooks: WebhookConfig[];
  analytics: AnalyticsData | null;
  isLoading: boolean;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshWorkspace = async () => {
    setIsLoading(true);
    try {
      // 1. Синхронізація з API проектів { success: true, projects: [...] }
      const resProjects = await fetch("/api/v1/projects");
      if (resProjects.ok) {
        const data = await resProjects.json();
        const projectList = data.projects || [];
        setProjects(projectList);
        if (projectList.length > 0 && !activeProject) {
          setActiveProject(projectList[0]);
        }
      }

      // 2. Синхронізація з API вебхуків { success: true, webhooks: [...] }
      const resWebhooks = await fetch("/api/v1/webhooks");
      if (resWebhooks.ok) {
        const data = await resWebhooks.json();
        const webhookList = data.webhooks || [];
        const formattedWebhooks = webhookList.map((wh: any) => ({
          id: wh._id || wh.id,
          targetEvent: wh.targetEvent,
          targetUrl: wh.targetUrl,
          isActive: wh.isActive,
        }));
        setWebhooks(formattedWebhooks);
      }

      // 3. Синхронізація з API аналітики { success: true, metrics: { ... } }
      const resAnalytics = await fetch("/api/v1/analytics");
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        const metrics = data.metrics || {};
        setAnalytics({
          count_all: metrics.totalProjects || 0,
          sum_budget: metrics.totalBudget || 0,
          avg_budget: metrics.averageCheck || 0,
          active_count: metrics.activeProjects || 0,
        });
      }
    } catch (error) {
      console.error("Помилка синхронізації з працюючим бекендом:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshWorkspace();
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        webhooks,
        analytics,
        isLoading,
        refreshWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace має використовуватись всередині WorkspaceProvider");
  }
  return context;
}
