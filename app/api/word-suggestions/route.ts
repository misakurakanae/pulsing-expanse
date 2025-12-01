import { NextRequest, NextResponse } from 'next/server';
import { getUserDictionary } from '@/lib/supabase-client';
import { extractWordFrequencies } from '@/lib/morphological-analyzer';

/**
 * GET /api/word-suggestions
 * 辞書未登録の頻出単語を候補として提示
 */
export async function GET(request: NextRequest) {
    try {
        // 認証ヘッダーからトークン取得
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        const { createAuthenticatedClient } = await import('@/lib/supabase-client');
        const supabase = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');

        // 最近の記事を取得（過去24時間）
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentArticles, error } = await supabase
            .from('article_scores')
            .select('title, snippet')
            .eq('user_id', user.id)
            .gte('created_at', oneDayAgo)
            .limit(50);

        if (error) {
            throw error;
        }

        if (!recentArticles || recentArticles.length === 0) {
            return NextResponse.json({
                success: true,
                suggestions: [],
            });
        }

        // 記事から単語を抽出して頻度をカウント
        const texts = recentArticles.map(a => `${a.title} ${a.snippet || ''}`);
        const frequencies = await extractWordFrequencies(texts);

        // ユーザー辞書を取得
        const dictionary = await getUserDictionary(user.id, supabase);

        // 辞書未登録の単語を抽出
        const suggestions: Array<{ word: string; frequency: number }> = [];
        for (const [word, frequency] of frequencies.entries()) {
            if (!dictionary.has(word)) {
                suggestions.push({ word, frequency });
            }
        }

        // 頻度順にソート
        suggestions.sort((a, b) => b.frequency - a.frequency);

        return NextResponse.json({
            success: true,
            suggestions: suggestions.slice(0, limit),
        });
    } catch (error) {
        console.error('Word suggestions error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get suggestions' },
            { status: 500 }
        );
    }
}
