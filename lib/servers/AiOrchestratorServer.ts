// C:\Users\Admin\Documents\my-unified-work-space\lib\servers\AiOrchestratorServer.ts

import { GoogleSearchServer } from "./GoogleSearchServer";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class AiOrchestratorServer {
  /**
   * Головний оркестратор діалогу, пошуку та формування валідного SSE-потоку (Нуль any)
   */
  static async executeWorkflow(
    messages: ChatMessage[],
    agentTitle: string,
    agentDescription: string,
  ): Promise<ReadableStream> {
    const encoder = new TextEncoder();
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    let internetKnowledge = "";
    const lowerMessage = lastUserMessage.toLowerCase();

    // ТРИГЕРИ АВТОНОМНОГО ПОШУКУ: якщо ШІ запитують про погоду, новини, курси або прямо просять знайти
    const triggerWords = [
      "знайди",
      "пошук",
      "новини",
      "курс",
      "погода",
      "хто такий",
      "що таке",
      "search",
      "news",
    ];
    const needsInternet = triggerWords.some((word) =>
      lowerMessage.includes(word),
    );

    if (needsInternet) {
      // Очищаємо запит від слів-тригерів для більш точного пошуку в мережі
      let searchQuery = lastUserMessage;
      triggerWords.forEach((word) => {
        searchQuery = searchQuery.replace(new RegExp(word, "gi"), "");
      });

      // Виклик нашого автономного пошуковика DuckDuckGo/Google
      internetKnowledge = await GoogleSearchServer.searchInternet(
        searchQuery.trim(),
      );
    }

    // Збірка преміального системного промпту інструкцій ШІ
    const systemPrompt = `
      You are an advanced AI Agent named [${agentTitle}].
      Your core engineering instructions from developer's MongoDB Atlas: "${agentDescription}".
      
      ${needsInternet ? `CURRENT_INTERNET_KNOWLEDGE (Свіжі дані з мережі):\n"""\n${internetKnowledge}\n"""\nВикористовуй ці дані для відповіді користувачу.` : ""}
      
      Правила ведення діалогу:
      1. Будь чітким, розмовляй професійною мовою інженерів.
      2. Якщо використовував дані з інтернет-знань, обов'язково вкажи це користувачу.
      3. Відповідай тією мовою, якою до тебе звернулися.
    `.trim();

    // Формуємо масив повідомлень для офіційного OpenAI API — повністю типізовано
    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    return new ReadableStream({
      async start(controller) {
        try {
          // Якщо ключ OpenAI відсутній у .env, автоматично перемикаємося на преміальний локальний емулятор
          if (!process.env.OPENAI_API_KEY) {
            const mockReply = `[NEXTOPS_CORE_EMULATOR]: Я виявив ваш запит. Робот [${agentTitle}] проаналізував інструкцію з бази даних і ${needsInternet ? "виконав нативний пошук в інтернеті" : "підготував відповідь"}. Контекст збагачено. Для бойового виклику GPT-4o додайте OPENAI_API_KEY у ваш файл .env.`;
            const words = mockReply.split(" ");

            for (const word of words) {
              // СУВОРЕ ПРАВИЛО SSE: data: ... \n\n
              controller.enqueue(encoder.encode(`data: ${word} \n\n`));
              await new Promise((res) => setTimeout(res, 60));
            }
            controller.close();
            return;
          }

          // БОЙОВИЙ ОФІЦІЙНИЙ HTTP-ВИКЛИК ДО OPENAI (НАДІЙНИЙ REST API ШЛЮЗ)
          const openaiResponse = await fetch("https://openai.com", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini", // Високопродуктивна та економна модель для SaaS
              messages: apiMessages,
              stream: true, // Включаємо серверний стрімінг токенів
              temperature: 0.3,
            }),
          });

          if (!openaiResponse.ok) {
            throw new Error(
              `OpenAI API returned status ${openaiResponse.status}`,
            );
          }

          const reader = openaiResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            controller.close();
            return;
          }

          // Парсимо вхідний потік від OpenAI та перепаковуємо у суворий SSE формат для фронтенду
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk
              .split("\n")
              .filter((line) => line.trim() !== "");

            for (const line of lines) {
              if (line.includes("[DONE]")) continue;
              if (line.startsWith("data: ")) {
                try {
                  const jsonStr = line.replace("data: ", "").trim();
                  const parsed = JSON.parse(jsonStr) as {
                    choices?: Array<{ delta?: { content?: string } }>;
                  };
                  const token = parsed.choices?.[0]?.delta?.content || "";

                  if (token) {
                    // Відправляємо токен у наш клієнтський чат з префіксом стандарту
                    controller.enqueue(encoder.encode(`data: ${token}\n\n`));
                  }
                } catch {
                  // Ігноруємо проміжні биті пакети
                }
              }
            }
          }

          controller.close();
        } catch (err: unknown) {
          // НА ТИВНА ТИПІЗАЦІЯ ПОМИЛОК: Повна відмова від брудного 'any'
          const error = err as Error;
          controller.enqueue(
            encoder.encode(`data: [SYSTEM_CRASH_ERROR]: ${error.message}\n\n`),
          );
          controller.close();
        }
      },
    });
  }
}
