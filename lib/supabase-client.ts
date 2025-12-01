import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * クライアント側用のSupabaseクライアント
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * サーバー側用のSupabaseクライアント（Service Role使用の場合）
 */
export function getServerSupabase() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        return createClient(supabaseUrl, serviceRoleKey);
    }
    return supabase;
}

/**
 * アクセストークンを使用して認証済みクライアントを作成
 */
export function createAuthenticatedClient(accessToken: string) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * ユーザーの単語辞書を取得
 */
export async function getUserDictionary(userId: string, client = supabase): Promise<Map<string, number>> {
    const { data, error } = await client
        .from('word_dictionary')
        .select('word, weight')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching dictionary:', error);
        return new Map();
    }

    const dictionary = new Map<string, number>();
    for (const row of data || []) {
        dictionary.set(row.word, row.weight);
    }

    return dictionary;
}

/**
 * 単語の重みを更新または挿入
 */
export async function upsertWordWeight(
    userId: string,
    word: string,
    weight: number
): Promise<void> {
    // 重みの範囲を制限
    const clampedWeight = Math.max(-5.0, Math.min(5.0, weight));

    const { error } = await supabase
        .from('word_dictionary')
        .upsert({
            user_id: userId,
            word,
            weight: clampedWeight,
            last_updated: new Date().toISOString(),
        }, {
            onConflict: 'user_id,word'
        });

    if (error) {
        console.error('Error upserting word weight:', error);
        throw error;
    }
}

/**
 * 複数の単語の重みを一括更新
 */
export async function batchUpdateWordWeights(
    userId: string,
    updates: Map<string, number>,
    client = supabase
): Promise<void> {
    const rows = Array.from(updates.entries()).map(([word, weight]) => ({
        user_id: userId,
        word,
        weight: Math.max(-5.0, Math.min(5.0, weight)),
        last_updated: new Date().toISOString(),
    }));

    if (rows.length === 0) return;

    const { error } = await client
        .from('word_dictionary')
        .upsert(rows, {
            onConflict: 'user_id,word'
        });

    if (error) {
        console.error('Error batch updating word weights:', error);
        throw error;
    }
}

/**
 * 重みが0に近い単語を削除
 */
export async function cleanupDictionary(userId: string, threshold: number = 0.1): Promise<number> {
    const { data, error } = await supabase
        .from('word_dictionary')
        .delete()
        .eq('user_id', userId)
        .gte('weight', -threshold)
        .lte('weight', threshold)
        .select();

    if (error) {
        console.error('Error cleaning up dictionary:', error);
        return 0;
    }

    return data?.length || 0;
}
