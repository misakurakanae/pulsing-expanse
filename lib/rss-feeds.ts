import Parser from 'rss-parser';

export interface NewsItem {
    title: string;
    link: string;
    pubDate?: string;
    content?: string;
    contentSnippet?: string;
    source: string;
    categories?: string[];
}

const parser = new Parser();

// ニュースソース定義
export const RSS_FEEDS = [
    // 総合・国内
    {
        id: 'yahoo',
        name: 'Yahoo!ニュース',
        url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
        description: '総合・速報',
        category: 'general'
    },
    {
        id: 'nhk',
        name: 'NHKニュース',
        url: 'https://www.nhk.or.jp/rss/news/cat0.xml',
        description: '国内・信頼性',
        category: 'general'
    },
    // 経済・ビジネス
    {
        id: 'nikkei',
        name: '日本経済新聞',
        url: 'https://www.nikkei.com/rss/rc/nw.rdf',
        description: '経済・マーケット',
        category: 'business'
    },
    {
        id: 'toyokeizai',
        name: '東洋経済オンライン',
        url: 'https://toyokeizai.net/list/feed/rss',
        description: 'ビジネス・深掘り',
        category: 'business'
    },
    {
        id: 'diamond',
        name: 'ダイヤモンド',
        url: 'https://diamond.jp/list/feed/rss',
        description: 'ビジネス・キャリア',
        category: 'business'
    },
    // IT・ガジェット
    {
        id: 'itmedia_news',
        name: 'ITmedia NEWS',
        url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
        description: 'IT総合・速報',
        category: 'tech'
    },
    {
        id: 'gigazine',
        name: 'GIGAZINE',
        url: 'https://gigazine.net/news/rss_2.0/',
        description: 'ガジェット・サブカル',
        category: 'tech'
    },
    {
        id: 'gizmodo',
        name: 'ギズモード',
        url: 'https://www.gizmodo.jp/index.xml',
        description: 'ガジェット・テクノロジー',
        category: 'tech'
    },
    // 技術・開発
    {
        id: 'zenn',
        name: 'Zenn',
        url: 'https://zenn.dev/feed',
        description: '技術・プログラミング',
        category: 'dev'
    },
    {
        id: 'qiita',
        name: 'Qiita',
        url: 'https://qiita.com/popular-items/feed',
        description: '技術・知見共有',
        category: 'dev'
    },
    // ライフスタイル・エンタメ
    {
        id: 'lifehacker',
        name: 'ライフハッカー',
        url: 'https://www.lifehacker.jp/feed/index.xml',
        description: '仕事術・生活',
        category: 'life'
    },
    {
        id: 'eiga_com',
        name: '映画.com',
        url: 'https://eiga.com/rss/news.xml',
        description: '映画・新作',
        category: 'entertainment'
    },
    {
        id: 'number',
        name: 'Number Web',
        url: 'https://number.bunshun.jp/list/feed/rss',
        description: 'スポーツ・深掘り',
        category: 'sports'
    },
];

/**
 * 複数のRSSフィードから最新ニュースを取得
 * @param allowedSources 許可されたソースIDのリスト（nullの場合は全て取得）
 */
export async function fetchAllNews(maxItemsPerSource: number = 10, allowedSources: Set<string> | null = null): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];

    // 許可されたソースのみをフィルタリング
    const targetFeeds = allowedSources
        ? RSS_FEEDS.filter(feed => allowedSources.has(feed.id))
        : RSS_FEEDS;

    // 並列で取得して高速化
    const promises = targetFeeds.map(async (feed) => {
        try {
            const result = await parser.parseURL(feed.url);
            const items = result.items.slice(0, maxItemsPerSource).map(item => ({
                title: item.title || '',
                link: item.link || '',
                pubDate: item.pubDate,
                content: item.content,
                contentSnippet: item.contentSnippet,
                source: feed.name,
                categories: item.categories,
            }));
            return items;
        } catch (error) {
            console.error(`Error fetching ${feed.name}:`, error);
            return [];
        }
    });

    const results = await Promise.all(promises);
    results.forEach(items => allNews.push(...items));

    // 日付順にソート（新しい順）
    return allNews.sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateB - dateA;
    });
}

/**
 * キーワードでニュースをフィルタリング
 */
export function filterNewsByKeywords(news: NewsItem[], keywords: string[]): NewsItem[] {
    if (keywords.length === 0) return news;

    return news.filter(item => {
        const searchText = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
}
