import { useState, useEffect, useCallback } from 'react';
import type { AgentKnowledgeBase, CreateAgentKnowledgeBaseInput } from '@/types/api';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { readPaginatedCollection } from '@/lib/collections';
export type { AgentKnowledgeBase, CreateAgentKnowledgeBaseInput };

export function useAgentKnowledgeBase() {
  const [data, setData] = useState<AgentKnowledgeBase[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/api/agentknowledgebase'), { headers: getApiHeaders() });
      if (res.ok) {
        const { data } = await readPaginatedCollection<AgentKnowledgeBase>(res);
        setData(data);
      }
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (formData: CreateAgentKnowledgeBaseInput): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl('/api/agentknowledgebase'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(formData)
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка створення:', err);
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl(`/api/agentknowledgebase/${id}`), {
        method: 'DELETE',
        headers: getApiHeaders(),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Помилка видалення:', err);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, createItem, deleteItem };
}
