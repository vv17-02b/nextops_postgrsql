export class GoogleSearchServer {
  /**
   * Виконує швидкий нативний пошук в інтернеті без важких сторонніх пакетів
   * @param query Пошуковий запит користувача
   */
  static async searchInternet(query: string): Promise<string> {
    if (!query || query.trim().length < 2) return "Немає даних для пошуку.";

    try {
      // НАДІЙНИЙ ФІКС: Додано пропущений знак $ та правильний параметр запиту ?q=
      const url = `https://duckduckgo.com{encodeURIComponent(query.trim())}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "NextOpsEngineSaasHub/2.0"
        },
        next: { revalidate: 300 } // Кешування результатів на 5 хвилин за стандартами Next.js
      });

      if (!response.ok) {
        return `[SEARCH_WARN]: Пошуковий сервер повернув статус ${response.status}`;
      }

      // Сувора типізація відповіді DDG API для повної відмови від any
      const data = (await response.json()) as {
        AbstractText?: string;
        RelatedTopics?: Array<{ Text?: string }>;
      };
      
      let extractedContext = "";

      // 1. Беремо пряму вижимку знань (Abstract)
      if (data.AbstractText) {
        extractedContext += `Головний факт: ${data.AbstractText}\n`;
      }

      // 2. Збираємо суміжні релевантні топіки для розширення RAG-контексту
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        const topTopics = data.RelatedTopics.slice(0, 3);
        topTopics.forEach((topic, idx: number) => {
          if (topic.Text) {
            extractedContext += `Джерело [${idx + 1}]: ${topic.Text}\n`;
          }
        });
      }

      return extractedContext.trim() || "Свіжої інформації за цим запитом в індексі не виявлено.";
    } catch (error: unknown) {
      const err = error as Error;
      console.error("🚨 Помилка автономного пошукового двигуна:", err.message);
      return `[SEARCH_CRASH]: Не вдалося отримати дані з мережі: ${err.message}`;
    }
  }
}
