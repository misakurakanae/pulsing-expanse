import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dictionary
 * ユーザーの単語辞書を取得
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
        const sortBy = searchParams.get('sort') || 'weight'; // 'weight' or 'updated'
        const order = searchParams.get('order') || 'desc'; // 'asc' or 'desc'

        // 辞書を取得
        const { data, error } = await supabase
            .from('word_dictionary')
            .select('*')
            .eq('user_id', user.id)
            .order(sortBy === 'updated' ? 'last_updated' : 'weight', { ascending: order === 'asc' });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            words: data || [],
            total: data?.length || 0,
        });
    } catch (error) {
        console.error('Dictionary GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dictionary' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/dictionary
 * 単語を手動で追加または更新
 */
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
        const { word, weight } = body;

        if (!word || typeof weight !== 'number') {
            return NextResponse.json(
                { success: false, error: 'Missing word or weight' },
                { status: 400 }
            );
        }

        // 重みの範囲を制限
        const clampedWeight = Math.max(-5.0, Math.min(5.0, weight));

        const { error } = await supabase
            .from('word_dictionary')
            .upsert({
                user_id: user.id,
                word: word.trim(),
                weight: clampedWeight,
                last_updated: new Date().toISOString(),
            }, {
                onConflict: 'user_id,word'
            });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            word: word.trim(),
            weight,
        });
    } catch (error) {
        console.error('Dictionary POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add word' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/dictionary
 * 単語を削除
 */
export async function DELETE(request: NextRequest) {
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
        const word = searchParams.get('word');
        const cleanup = searchParams.get('cleanup') === 'true';

        if (cleanup) {
            // 重みが0に近い単語を一括削除
            const threshold = parseFloat(searchParams.get('threshold') || '0.1');

            const { data, error } = await supabase
                .from('word_dictionary')
                .delete()
                .eq('user_id', user.id)
                .gte('weight', -threshold)
                .lte('weight', threshold)
                .select();

            if (error) throw error;
            const deletedCount = data?.length || 0;

            return NextResponse.json({
                success: true,
                deleted_count: deletedCount,
            });
        }

        if (!word) {
            return NextResponse.json(
                { success: false, error: 'Missing word parameter' },
                { status: 400 }
            );
        }

        // 特定の単語を削除
        const { error } = await supabase
            .from('word_dictionary')
            .delete()
            .eq('user_id', user.id)
            .eq('word', word);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            word,
        });
    } catch (error) {
        console.error('Dictionary DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete word' },
            { status: 500 }
        );
    }
}
