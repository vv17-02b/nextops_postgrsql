export class GoogleSearchServer {
  /**
   * Виконує швидкий нативний пошук в інтернеті без важких сторонніх пакетів
   * @param query Пошуковий запит користувача
   */
  static async searchInternet(query: string): Promise<string> {
    if (!query || query.trim().length < 2) return "Немає даних для пошуку.";

    try {
      // Використовуємо нативний безкоштовний шлюз DuckDuckGo API для миттєвих відповідей
      const url = `https://duckduckgo.com{encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      
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

      const data = await response.json();
      let extractedContext = "";

      // 1. Беремо пряму вижимку знань (Abstract)
      if (data.AbstractText) {
        extractedContext += `Головний факт: ${data.AbstractText}\n`;
      }

      // 2. Збираємо суміжні релевантні топіки для розширення RAG-контексту
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        const topTopics = data.RelatedTopics.slice(0, 3);
        topTopics.forEach((topic: any, idx: number) => {
          if (topic.Text) {
            extractedContext += `Джерело [${idx + 1}]: ${topic.Text}\n`;
          }
        });
      }

      return extractedContext.trim() || "Свіжої інформації за цим запитом в індексі не виявлено.";
    } catch (error: any) {
      console.error(" Помилка автономного пошукового двигуна:", error.message);
      return `[SEARCH_CRASH]: Не вдалося отримати дані з мережі: ${error.message}`;
    }
  }
}
