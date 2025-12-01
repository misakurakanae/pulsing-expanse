import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

/**
 * Gemini AIクライアントを初期化
 */
function getGeminiClient() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

/**
 * ニュース記事を要約
 */
export async function summarizeNews(title: string, content: string): Promise<string> {
    try {
        const client = getGeminiClient();
        const model = client.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `以下のニュース記事を3-4文で簡潔に要約してください。重要なポイントを押さえ、読みやすい日本語で書いてください。

タイトル: ${title}

内容:
${content.substring(0, 2000)} 

要約:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        return summary.trim();
    } catch (error) {
        console.error('Gemini API error:', error);
        // エラーの場合は元のコンテンツの一部を返す
        return content.substring(0, 200) + '...';
    }
}

/**
 * 複数のニュースを一括要約（レート制限を考慮）
 */
export async function summarizeMultipleNews(
    items: Array<{ title: string; content: string }>
): Promise<string[]> {
    const summaries: string[] = [];

    // レート制限を避けるため、少しずつ処理
    for (let i = 0; i < items.length; i++) {
        try {
            const summary = await summarizeNews(items[i].title, items[i].content);
            summaries.push(summary);

            // 次のリクエストまで少し待機（60 requests/minute制限対策）
            if (i < items.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1100));
            }
        } catch (error) {
            console.error(`Failed to summarize item ${i}:`, error);
            summaries.push(items[i].content.substring(0, 200) + '...');
        }
    }

    return summaries;
}
