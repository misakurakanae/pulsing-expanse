import { getUserDictionary, batchUpdateWordWeights } from './supabase-client';

// 評価ごとの重み調整量
const RATING_ADJUSTMENTS: Record<number, number> = {
    1: -0.3,  // 全く興味なし
    2: -0.1,  // あまり興味なし
    3: 0.1,   // まあまあ興味あり
    4: 0.3,   // かなり興味あり
};

/**
 * 評価に基づいて単語の重みを更新
 * 
 * @param articleWords - 記事に含まれる単語
 * @param rating - ユーザーの評価（1-4）
 * @param userId - ユーザーID
 * @param client - 認証済みSupabaseクライアント
 * @returns 更新された単語のリスト
 */
export async function updateWordWeights(
    articleWords: string[],
    rating: number,
    userId: string,
    client?: any
): Promise<string[]> {
    if (rating < 1 || rating > 4) {
        throw new Error('Rating must be between 1 and 4');
    }

    // 現在の辞書を取得
    const dictionary = await getUserDictionary(userId, client);

    // 調整量を取得
    const adjustment = RATING_ADJUSTMENTS[rating];

    // 辞書に既に存在する単語のみを抽出
    const existingWords = articleWords.filter(word => dictionary.has(word));

    console.log('=== 評価デバッグ ===');
    console.log('記事から抽出した単語:', articleWords);
    console.log('辞書に存在する単語:', Array.from(dictionary.keys()));
    console.log('一致した単語:', existingWords);

    // 各単語の重みを調整
    const updates = new Map<string, number>();
    for (const word of existingWords) {
        const currentWeight = dictionary.get(word) || 0;
        const newWeight = currentWeight + adjustment;
        updates.set(word, newWeight);
    }

    // 一括更新（認証クライアントを渡す）
    if (updates.size > 0) {
        await batchUpdateWordWeights(userId, updates, client);
    }

    // 更新された単語のリストを返す
    return Array.from(updates.keys());
}

/**
 * 複数の記事評価をバッチ処理
 * 
 * @param ratings - 記事URLと評価のマップ
 * @param wordsMap - 記事URLと単語のマップ
 * @param userId - ユーザーID
 */
export async function batchUpdateFromRatings(
    ratings: Map<string, number>,
    wordsMap: Map<string, string[]>,
    userId: string
): Promise<void> {
    const dictionary = await getUserDictionary(userId);
    const updates = new Map<string, number>();

    // 各評価について重みを累積
    for (const [articleUrl, rating] of ratings.entries()) {
        const words = wordsMap.get(articleUrl);
        if (!words) continue;

        const adjustment = RATING_ADJUSTMENTS[rating];
        for (const word of words) {
            const currentWeight = dictionary.get(word) || 0;
            const existingUpdate = updates.get(word) || currentWeight;
            updates.set(word, existingUpdate + adjustment);
        }
    }

    await batchUpdateWordWeights(userId, updates);
}

/**
 * 学習の進捗状況を取得
 * 
 * @param userId - ユーザーID
 * @returns 統計情報
 */
export async function getLearningStats(userId: string): Promise<{
    totalWords: number;
    positiveWords: number;
    negativeWords: number;
    neutralWords: number;
}> {
    const dictionary = await getUserDictionary(userId);

    let positiveWords = 0;
    let negativeWords = 0;
    let neutralWords = 0;

    for (const [, weight] of dictionary.entries()) {
        if (weight > 0.5) {
            positiveWords++;
        } else if (weight < -0.5) {
            negativeWords++;
        } else {
            neutralWords++;
        }
    }

    return {
        totalWords: dictionary.size,
        positiveWords,
        negativeWords,
        neutralWords,
    };
}
