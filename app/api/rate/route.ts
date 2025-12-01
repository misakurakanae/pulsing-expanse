import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-client';
import { extractWords } from '@/lib/morphological-analyzer';
import { updateWordWeights } from '@/lib/learning-engine';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { article_url, article_title, article_content, rating } = body;

        // バリデーション
        if (!article_url || !rating) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 4) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 4' },
                { status: 400 }
            );
        }

        // 記事を形態素解析
        const text = `${article_title || ''} ${article_content || ''}`;
        const words = await extractWords(text);

        if (words.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No words extracted from article' },
                { status: 400 }
            );
        }

        // 学習エンジンで単語重み更新（認証クライアントを渡す）
        const updatedWords = await updateWordWeights(words, rating, user.id, supabase);

        // 評価履歴を保存
        await supabase.from('ratings').insert({
            user_id: user.id,
            article_url,
            rating,
            created_at: new Date().toISOString(),
        });

        // 記事を既読にマーク
        await supabase
            .from('article_scores')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('article_url', article_url);

        return NextResponse.json({
            success: true,
            words_updated: updatedWords.length,
            updated_words: updatedWords,
            rating,
        });
    } catch (error) {
        console.error('Rate API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process rating' },
            { status: 500 }
        );
    }
}
