import { NextRequest, NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/rss-feeds';
import { extractWords } from '@/lib/morphological-analyzer';
import { rankArticles } from '@/lib/scoring-engine';
import { getCurrentUser, getUserDictionary } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase-client';

// タイトルから不要な文字列を削除
function cleanTitle(title: string): string {
    const removePatterns = [
        /東洋経済オンライン/g,
        /ヘッドラインニュース/g,
        /Yahooニュース/g,
        /\s*\|\s*YouTube.*$/gi,  // | Youtube...
        /\s*\|\s*Youtube.*$/gi,  // | Youtube (大文字小文字混在)
        /\s*\|\s*$/g,            // 末尾の |
        /\s*-\s*$/g,             // 末尾の -
        /^\d{4}年\d{1,2}月\d{1,2}日の.*/g,  // GIGAZINE「○年○月○日の...」
    ];

    let cleaned = title;
    for (const pattern of removePatterns) {
        cleaned = cleaned.replace(pattern, '');
    }
    return cleaned.trim();
}

export async function GET(request: NextRequest) {
    try {
        // 認証ヘッダーからトークン取得
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'No token provided' },
                { status: 401 }
            );
        }
        const token = authHeader.split(' ')[1];

        // 認証済みクライアントでユーザー取得
        const { createAuthenticatedClient } = await import('@/lib/supabase-client');
        const supabase = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // ユーザー辞書を取得（ソース設定の確認にも使用）
        const dictionary = await getUserDictionary(user.id, supabase);

        // ソース設定を確認
        let allowedSources = new Set<string>();
        let hasSourceSettings = false;

        for (const [word, weight] of dictionary.entries()) {
            if (word.startsWith('SOURCE:')) {
                hasSourceSettings = true;
                if (weight > 0) {
                    allowedSources.add(word.replace('SOURCE:', ''));
                }
            }
        }

        // ソース設定がない場合はデフォルト（Yahooのみ）
        // 設定があるが全てOFFの場合は、何も取得しない（空のセット）
        const targetSources = hasSourceSettings ? allowedSources : new Set(['yahoo']);

        // RSSフィードから最新ニュースを取得
        // targetSourcesが空（全てOFF）の場合は空配列を返す
        const news = targetSources.size > 0 ? await fetchAllNews(5, targetSources) : [];

        if (news.length === 0) {
            return NextResponse.json({
                success: true,
                news: [],
                total: 0,
                dictionary_size: dictionary.size,
            });
        }

        // 各記事を形態素解析してキャッシュ
        const wordsMap = new Map<string, string[]>();
        const articlesToCache: any[] = [];

        for (const article of news) {
            // タイトルをクリーニング
            article.title = cleanTitle(article.title);

            const text = `${article.title} ${article.contentSnippet || ''}`;
            const words = await extractWords(text);
            wordsMap.set(article.link, words);

            // キャッシュ用データ
            articlesToCache.push({
                user_id: user.id,
                article_url: article.link,
                title: article.title,
                snippet: article.contentSnippet?.substring(0, 200),
                source: article.source,
                pub_date: article.pubDate || null,
                score: 0, // 後で更新
                created_at: new Date().toISOString(),
            });
        }

        // スコアリング
        const rankedArticles = rankArticles(news, dictionary, wordsMap);

        // スコアをキャッシュに反映
        for (let i = 0; i < articlesToCache.length; i++) {
            const article = rankedArticles.find(a => a.link === articlesToCache[i].article_url);
            if (article) {
                articlesToCache[i].score = article.score;
            }
        }

        // 記事スコアをDBにキャッシュ（upsert）
        if (articlesToCache.length > 0) {
            await supabase
                .from('article_scores')
                .upsert(articlesToCache, {
                    onConflict: 'user_id,article_url',
                    ignoreDuplicates: false,
                });
        }

        // --- 記事選出ロジック（ハーフ＆ハーフ） ---

        // 1. ネガティブフィルター（スコアが-2.0以下の記事は除外）
        // ※ブロックしたジャンル（-5.0）はここで弾かれる
        const safeArticles = rankedArticles.filter(a => a.score > -2.0);

        // 2. 上位15件（スコア順）
        const topScored = safeArticles.slice(0, 15);
        const topIds = new Set(topScored.map(a => a.link));

        // 3. 発見枠15件（残りの記事からランダム/新着）
        // スコアに関係なく、まだ選ばれていない記事から選出
        const remaining = safeArticles.filter(a => !topIds.has(a.link));

        // ランダムにシャッフル（簡易的なFisher-Yates）
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }

        const discovery = remaining.slice(0, 15);

        // 4. 結合（上位 + 発見）
        const finalSelection = [...topScored, ...discovery];

        // 最終整形
        const topNews = finalSelection.map(article => ({
            ...article,
            words: undefined,
        }));

        return NextResponse.json({
            success: true,
            news: topNews,
            total: finalSelection.length,
            dictionary_size: dictionary.size,
        });
    } catch (error) {
        console.error('News API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}
