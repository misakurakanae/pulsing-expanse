import { NewsItem } from './rss-feeds';

export interface ScoredArticle extends NewsItem {
    score: number;
    words: string[];
}

/**
 * 記事のスコアを計算
 * 
 * @param words - 記事から抽出された単語
 * @param dictionary - ユーザーの単語辞書
 * @returns スコア
 */
export function calculateArticleScore(
    words: string[],
    dictionary: Map<string, number>
): number {
    let score = 0;

    for (const word of words) {
        const weight = dictionary.get(word) || 0;
        score += weight;
    }

    return score;
}

/**
 * 複数の記事をスコアリングしてソート
 * 
 * @param articles - 記事の配列
 * @param dictionary - ユーザーの単語辞書
 * @param wordsMap - 記事URLごとの単語マップ（キャッシュ用）
 * @returns スコア順にソートされた記事
 */
export function rankArticles(
    articles: NewsItem[],
    dictionary: Map<string, number>,
    wordsMap: Map<string, string[]>
): ScoredArticle[] {
    const scoredArticles: ScoredArticle[] = articles.map(article => {
        const words = wordsMap.get(article.link) || [];
        const score = calculateArticleScore(words, dictionary);

        return {
            ...article,
            score,
            words,
        };
    });

    // スコアの降順でソート
    return scoredArticles.sort((a, b) => b.score - a.score);
}

/**
 * スコアの分布を取得（デバッグ用）
 */
export function getScoreDistribution(articles: ScoredArticle[]): {
    min: number;
    max: number;
    average: number;
    median: number;
} {
    if (articles.length === 0) {
        return { min: 0, max: 0, average: 0, median: 0 };
    }

    const scores = articles.map(a => a.score).sort((a, b) => a - b);
    const min = scores[0];
    const max = scores[scores.length - 1];
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const median = scores[Math.floor(scores.length / 2)];

    return { min, max, average, median };
}
