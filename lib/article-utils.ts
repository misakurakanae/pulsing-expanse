// ニュース記事の型にreadTime, isReadを追加
export interface NewsArticle {
    title: string;
    link: string;
    source: string;
    pubDate?: string;
    contentSnippet?: string;
    score: number;
    readTime?: number; // 読了時間（分）
    isRead?: boolean; // 既読フラグ
}

// 読了時間を計算（200文字/分）
export function calculateReadTime(text: string): number {
    const charCount = text.length;
    const minutes = Math.ceil(charCount / 200);
    return Math.max(1, minutes); // 最低1分
}

// 既読管理
export function markAsRead(articleUrl: string): void {
    const readArticles = getReadArticles();
    readArticles.add(articleUrl);
    localStorage.setItem('readArticles', JSON.stringify([...readArticles]));
}

export function getReadArticles(): Set<string> {
    const stored = localStorage.getItem('readArticles');
    if (!stored) return new Set();
    try {
        return new Set(JSON.parse(stored));
    } catch {
        return new Set();
    }
}

export function isArticleRead(articleUrl: string): boolean {
    return getReadArticles().has(articleUrl);
}

// SNS共有用URL生成
export function generateShareUrl(article: { title: string; link: string }): string {
    const text = `HERO FILTER - あなただけのニュースカスタム\n\n${article.title}`;
    const url = article.link;
    const hashtags = 'HeroFilter,ニュース';

    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
}
