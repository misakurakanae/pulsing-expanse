import { createClient } from '@supabase/supabase-js';

/**
 * サーバーサイドで管理者を検証するためのユーティリティ
 * クライアント側の偽装を防止します
 */
export async function verifyAdmin(token: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // トークンを使用してSupabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });

    // ユーザー情報を取得
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return false;
    }

    // メタデータからロールを確認
    const role = user.user_metadata?.role;
    return role === 'admin';
}
