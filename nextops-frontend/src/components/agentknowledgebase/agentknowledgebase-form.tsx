import React, { useState } from 'react';

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
}

export default function AgentKnowledgeBaseForm({ onSubmit }: FormProps): React.JSX.Element {
  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      projectId: projectId,
      title: title,
      content: content
    });
    setProjectId('');
    setTitle('');
    setContent('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (AgentKnowledgeBase)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Project ID (MongoDB ObjectId)</label>
        <input 
          type="text" 
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Введіть project id (mongodb objectid)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Заголовок бази знань</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введіть заголовок бази знань..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Вміст (Контент)</label>
        <input 
          type="text" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Введіть вміст (контент)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Надсилання...' : 'Створити документ'}
      </button>
    </form>
  );
}
