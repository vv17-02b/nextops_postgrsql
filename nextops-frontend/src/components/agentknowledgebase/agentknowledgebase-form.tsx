import React, { useEffect, useState } from 'react';
import type { CreateAgentKnowledgeBaseInput } from '@/types/api';
import type { ProjectOption } from '@/hooks/useAgentknowledgebase';

interface FormProps {
  projects: ProjectOption[];
  defaultProjectId?: string;
  onSubmit: (data: CreateAgentKnowledgeBaseInput) => Promise<boolean>;
}

export default function AgentKnowledgeBaseForm({
  projects,
  defaultProjectId,
  onSubmit,
}: FormProps): React.JSX.Element {
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (!projectId && projects.length > 0 && projects[0]) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects, projectId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!projectId.trim()) return;

    setLoading(true);
    const created = await onSubmit({
      projectId: projectId.trim(),
      title: title.trim(),
      content: content.trim(),
    });
    setLoading(false);

    if (created) {
      setTitle('');
      setContent('');
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-gray-950/40 backdrop-blur-md p-4 sm:p-6 border border-white/10 rounded-xl shadow-2xl space-y-4 font-mono"
    >
      <h3 className="text-xs sm:text-sm font-semibold text-gray-200 uppercase tracking-wider">
        Форма додавання (AgentKnowledgeBase)
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="kb-project-select"
            className="block text-xs font-medium text-gray-400"
          >
            Проєкт (Project)
          </label>
          {projects.length > 0 ? (
            <select
              id="kb-project-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-gray-900/80 px-3 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-blue-500"
              required
            >
              <option value="" disabled>
                Оберіть проєкт...
              </option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="kb-project-select"
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Введіть project id (UUID)..."
              className="w-full rounded-lg border border-white/10 bg-gray-900/80 px-3 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
              required
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="kb-title-input"
            className="block text-xs font-medium text-gray-400"
          >
            Заголовок бази знань
          </label>
          <input
            id="kb-title-input"
            type="text"
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введіть заголовок бази знань..."
            className="w-full rounded-lg border border-white/10 bg-gray-900/80 px-3 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor="kb-content-textarea"
            className="block text-xs font-medium text-gray-400"
          >
            Вміст (Контент, до 50 000 символів)
          </label>
          <textarea
            id="kb-content-textarea"
            rows={4}
            maxLength={50000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Введіть текст інструкції, прайсу або умов обслуговування..."
            className="w-full rounded-lg border border-white/10 bg-gray-900/80 px-3 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 resize-y"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-blue-500 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 px-5 py-2.5 text-xs sm:text-sm font-semibold transition disabled:opacity-40 cursor-pointer"
      >
        {loading ? 'Надсилання...' : 'Створити документ'}
      </button>
    </form>
  );
}
