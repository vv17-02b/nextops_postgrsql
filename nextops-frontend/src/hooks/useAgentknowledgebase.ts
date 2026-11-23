import { useState, useEffect, useCallback } from 'react';
import type { AgentKnowledgeBase, CreateAgentKnowledgeBaseInput } from '@/types/api';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection } from '@/lib/collections';

export type { AgentKnowledgeBase, CreateAgentKnowledgeBaseInput };

export interface ProjectOption {
  id: string;
  name: string;
}

interface ApiErrorPayload {
  message?: string | string[];
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return fallback;
  }
  const msg = (payload as ApiErrorPayload).message;
  if (Array.isArray(msg) && msg.length > 0) {
    return String(msg[0]);
  }
  if (typeof msg === 'string' && msg.trim().length > 0) {
    return msg;
  }
  return fallback;
}

export function useAgentKnowledgeBase(selectedProjectId?: string) {
  const [data, setData] = useState<AgentKnowledgeBase[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl('/api/project?limit=100'), {
        headers: getApiHeaders(),
      });
      if (!res.ok) return;
      const { data: list } = await readPaginatedCollection<{ id: string; name?: string }>(res);
      setProjects(
        list.map((item) => ({
          id: item.id,
          name: item.name && item.name.trim().length > 0 ? item.name : item.id,
        })),
      );
    } catch {
      // Non-blocking: user can still view knowledge base even if projects dropdown fails
    }
  }, []);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const query = selectedProjectId
        ? `?projectId=${encodeURIComponent(selectedProjectId)}`
        : '';
      const res = await apiFetch(getApiUrl(`/api/agentknowledgebase${query}`), {
        headers: getApiHeaders(),
      });
      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        setError(
          extractErrorMessage(
            payload,
            `Не вдалося завантажити базу знань (HTTP ${res.status}).`,
          ),
        );
        return;
      }
      const { data: items } = await readPaginatedCollection<AgentKnowledgeBase>(res);
      setData(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при завантаженні бази знань.');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  const createItem = async (formData: CreateAgentKnowledgeBaseInput): Promise<boolean> => {
    setError(null);
    try {
      const res = await apiFetch(getApiUrl('/api/agentknowledgebase'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        setError(
          extractErrorMessage(
            payload,
            `Не вдалося створити документ (HTTP ${res.status}).`,
          ),
        );
        return false;
      }
      await fetchData();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при створенні документа.');
      return false;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await apiFetch(getApiUrl(`/api/agentknowledgebase/${id}`), {
        method: 'DELETE',
        headers: getApiHeaders(),
      });
      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        setError(
          extractErrorMessage(
            payload,
            `Не вдалося видалити документ (HTTP ${res.status}).`,
          ),
        );
        return false;
      }
      await fetchData();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при видаленні документа.');
      return false;
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    projects,
    loading,
    error,
    clearError: () => setError(null),
    refetch: fetchData,
    createItem,
    deleteItem,
  };
}
