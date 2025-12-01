import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        const { createAuthenticatedClient } = await import('@/lib/supabase-client');
        const supabaseClient = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { updates } = body; // [{ word: '...', weight: -5.0 }, ...]

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ success: false, error: 'Invalid updates format' }, { status: 400 });
        }

        // バッチ更新用のデータ作成
        const rows = updates.map((item: any) => ({
            user_id: user.id,
            word: item.word,
            weight: item.weight,
            last_updated: new Date().toISOString(),
        }));

        const { error } = await supabaseClient
            .from('word_dictionary')
            .upsert(rows, { onConflict: 'user_id,word' });

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, count: rows.length });
    } catch (error) {
        console.error('Batch update error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update dictionary' }, { status: 500 });
    }
}
