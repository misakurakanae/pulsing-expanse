import kuromoji from 'kuromoji';

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

// ストップワード（除外する単語）
const STOP_WORDS = new Set([
    'する', 'ある', 'いる', 'なる', 'れる', 'できる', 'られる',
    'こと', 'もの', 'よう', 'ため', 'これ', 'それ', 'あれ',
    'この', 'その', 'あの', 'ここ', 'そこ', 'あそこ',
    'です', 'ます', 'だ', 'である', 'について', 'により',
    '年', '月', '日', '時', '分', '秒', '人', '円', '個', '件',
]);

/**
 * kuromojiトークナイザーを初期化（遅延ロード）
 */
async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
    if (tokenizer) {
        return tokenizer;
    }

    return new Promise((resolve, reject) => {
        kuromoji.builder({ dicPath: '/dict' }).build((err, _tokenizer) => {
            if (err) {
                reject(err);
            } else {
                tokenizer = _tokenizer;
                resolve(_tokenizer);
            }
        });
    });
}

/**
 * テキストから重要な単語を抽出
 * 
 * @param text - 解析するテキスト
 * @returns 抽出された単語の配列
 */
export async function extractWords(text: string): Promise<string[]> {
    try {
        const _tokenizer = await getTokenizer();
        const tokens = _tokenizer.tokenize(text);

        const words: string[] = [];

        for (const token of tokens) {
            // 名詞・動詞・形容詞のみを対象
            const pos = token.pos;
            if (pos !== '名詞' && pos !== '動詞' && pos !== '形容詞') {
                continue;
            }

            // 基本形を取得（活用形を正規化）
            const word = token.basic_form || token.surface_form;

            // ストップワード除外
            if (STOP_WORDS.has(word)) {
                continue;
            }

            // 1文字の単語は除外
            if (word.length <= 1) {
                continue;
            }

            // 数字のみは除外
            if (/^\d+$/.test(word)) {
                continue;
            }

            words.push(word);
        }

        // 重複を除去
        return Array.from(new Set(words));
    } catch (error) {
        console.error('Morphological analysis error:', error);
        // フォールバック: 簡易的な単語分割
        return text
            .split(/[\s、。！？\n]+/)
            .filter(word => word.length > 1)
            .slice(0, 20);
    }
}

/**
 * 複数のテキストから単語を抽出して頻度をカウント
 * 
 * @param texts - テキストの配列
 * @returns 単語とその出現回数のマップ
 */
export async function extractWordFrequencies(texts: string[]): Promise<Map<string, number>> {
    const frequencies = new Map<string, number>();

    for (const text of texts) {
        const words = await extractWords(text);
        for (const word of words) {
            frequencies.set(word, (frequencies.get(word) || 0) + 1);
        }
    }

    return frequencies;
}
