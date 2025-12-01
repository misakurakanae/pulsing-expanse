export interface UserRating {
    newsUrl: string;
    rating: number; // 0 = 興味なし, 1-5 = 評価
    timestamp: number;
}

export interface UserPreferences {
    keywords: string[];
    ratings: UserRating[];
}

/**
 * ローカルストレージからユーザー設定を取得
 */
export function getUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
        return { keywords: [], ratings: [] };
    }

    const stored = localStorage.getItem('userPreferences');
    if (!stored) {
        return { keywords: [], ratings: [] };
    }

    try {
        return JSON.parse(stored);
    } catch {
        return { keywords: [], ratings: [] };
    }
}

/**
 * ユーザー設定を保存
 */
export function saveUserPreferences(preferences: UserPreferences): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

/**
 * キーワードを追加
 */
export function addKeyword(keyword: string): void {
    const prefs = getUserPreferences();
    if (!prefs.keywords.includes(keyword)) {
        prefs.keywords.push(keyword);
        saveUserPreferences(prefs);
    }
}

/**
 * キーワードを削除
 */
export function removeKeyword(keyword: string): void {
    const prefs = getUserPreferences();
    prefs.keywords = prefs.keywords.filter(k => k !== keyword);
    saveUserPreferences(prefs);
}

/**
 * ニュースを評価
 */
export function rateNews(newsUrl: string, rating: number): void {
    const prefs = getUserPreferences();

    // 既存の評価を削除
    prefs.ratings = prefs.ratings.filter(r => r.newsUrl !== newsUrl);

    // 新しい評価を追加
    prefs.ratings.push({
        newsUrl,
        rating,
        timestamp: Date.now(),
    });

    // 最新100件のみ保持
    if (prefs.ratings.length > 100) {
        prefs.ratings = prefs.ratings
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 100);
    }

    saveUserPreferences(prefs);
}

/**
 * ニュースの評価を取得
 */
export function getNewsRating(newsUrl: string): number | null {
    const prefs = getUserPreferences();
    const rating = prefs.ratings.find(r => r.newsUrl === newsUrl);
    return rating ? rating.rating : null;
}

/**
 * パーソナライゼーションスコアを計算
 * 評価履歴に基づいてニュースの関連性スコアを算出
 */
export function calculatePersonalizationScore(
    newsTitle: string,
    newsContent: string,
    preferences: UserPreferences
): number {
    let score = 0;
    const text = `${newsTitle} ${newsContent}`.toLowerCase();

    // キーワードマッチング
    for (const keyword of preferences.keywords) {
        if (text.includes(keyword.toLowerCase())) {
            score += 10;
        }
    }

    // 高評価された記事と似たキーワードを含む場合にスコア追加
    const highRatedUrls = preferences.ratings
        .filter(r => r.rating >= 4)
        .slice(0, 20);

    // 簡易的な関連性チェック（実用的にはもっと高度なアルゴリズムを使用）
    // ここでは評価数でスコアを調整
    if (highRatedUrls.length > 0) {
        score += 1;
    }

    return score;
}
