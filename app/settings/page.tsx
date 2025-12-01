'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { RSS_FEEDS } from '@/lib/rss-feeds';
import styles from './settings.module.css';

// ブロック対象のジャンル定義（大分類 > 小分類）
const GENRE_CATEGORIES = [
    {
        label: '政治',
        code: 'Z',
        items: [
            { label: '政治', words: ['政治'] },
            { label: '右翼左翼', words: ['右翼', '左翼'] },
            { label: '選挙', words: ['選挙'] },
            { label: '行政', words: ['行政'] },
            { label: '地方自治', words: ['地方自治', '自治体'] },
            { label: '司法', words: ['司法', '裁判'] },
            { label: '警察', words: ['警察'] },
            { label: '日本外交', words: ['外交'] },
            { label: '軍事', words: ['軍事', '自衛隊'] },
            { label: '戦争', words: ['戦争'] },
        ]
    },
    {
        label: '経済',
        code: 'Y',
        items: [
            { label: '経済', words: ['経済'] },
            { label: '財政', words: ['財政'] },
            { label: '金融', words: ['金融'] },
            { label: '企業', words: ['企業'] },
            { label: '中小企業', words: ['中小企業'] },
            { label: '技術', words: ['技術', 'テクノロジー'] },
            { label: '情報', words: ['情報', 'IT'] },
            { label: 'サービス', words: ['サービス'] },
            { label: '貿易', words: ['貿易'] },
            { label: '国土・都市計画', words: ['都市計画', '開発'] },
            { label: '鉱工業', words: ['鉱工業'] },
            { label: '資源エネルギー', words: ['エネルギー', '原発'] },
            { label: '農林水産', words: ['農業', '漁業'] },
        ]
    },
    {
        label: '社会',
        code: 'X',
        items: [
            { label: '社会', words: ['社会'] },
            { label: '市民運動', words: ['市民運動', 'デモ'] },
            { label: '社会保障', words: ['社会保障', '年金'] },
            { label: '環境', words: ['環境', 'エコ'] },
            { label: '婦人', words: ['婦人', '女性'] },
            { label: '子供', words: ['子供', '育児'] },
            { label: '中高年', words: ['中高年', '高齢者'] },
            { label: '勲章・賞', words: ['勲章', '受賞'] },
            { label: '労働', words: ['労働', '働き方'] },
            { label: '教育', words: ['教育', '学校'] },
        ]
    },
    {
        label: 'スポーツ',
        code: 'W',
        items: [
            { label: 'スポーツ', words: ['スポーツ'] },
            { label: '巨人軍', words: ['巨人', 'ジャイアンツ'] },
            { label: '野球', words: ['野球', 'プロ野球', 'MLB'] }, // 追加
            { label: 'サッカー', words: ['サッカー', 'Jリーグ'] }, // 追加
            { label: '五輪', words: ['五輪', 'オリンピック'] }, // 追加
        ]
    },
    {
        label: '文化',
        code: 'V',
        items: [
            { label: '文化', words: ['文化'] },
            { label: '学術', words: ['学術', '研究'] },
            { label: '美術', words: ['美術', 'アート'] },
            { label: '映像', words: ['映像', '映画'] },
            { label: '文学', words: ['文学', '小説'] },
            { label: '音楽', words: ['音楽'] },
            { label: '演劇', words: ['演劇', '舞台'] },
            { label: '芸能', words: ['芸能', 'エンタメ', 'アイドル'] },
            { label: '舞踊', words: ['舞踊', 'ダンス'] },
            { label: '宗教', words: ['宗教'] },
        ]
    },
    {
        label: '生活',
        code: 'U',
        items: [
            { label: '生活', words: ['生活'] },
            { label: '健康', words: ['健康', 'ヘルスケア'] },
            { label: '衣', words: ['ファッション'] },
            { label: '食', words: ['グルメ', '料理'] },
            { label: '住', words: ['住宅', 'インテリア'] },
            { label: '余暇', words: ['レジャー', '旅行'] },
            { label: '行事', words: ['行事', 'イベント'] },
        ]
    },
    {
        label: '事件・事故',
        code: 'T',
        items: [
            { label: '犯罪事件', words: ['事件', '逮捕', '容疑'] },
            { label: '事故', words: ['事故'] },
            { label: '災害', words: ['災害', '地震', '台風'] },
        ]
    },
    {
        label: '科学',
        code: 'S',
        items: [
            { label: '科学', words: ['科学', 'サイエンス'] },
            { label: '宇宙', words: ['宇宙'] },
            { label: '地球', words: ['地球'] },
            { label: '理工学', words: ['理工学'] },
            { label: '生命工学', words: ['バイオ'] },
            { label: '動植物', words: ['動物', '植物'] },
        ]
    },
    {
        label: '国際',
        code: 'R',
        items: [
            { label: '国際', words: ['国際'] },
            { label: 'アジア太平洋', words: ['アジア', '中国', '韓国'] },
            { label: '南北アメリカ', words: ['アメリカ', '米国'] },
            { label: '西欧', words: ['ヨーロッパ', 'EU'] },
            { label: '中近東', words: ['中東'] },
            { label: 'アフリカ', words: ['アフリカ'] },
        ]
    }
];

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [blockedItems, setBlockedItems] = useState<Set<string>>(new Set());
    const [activeSources, setActiveSources] = useState<Set<string>>(new Set());
    const router = useRouter();

    useEffect(() => {
        checkUserAndLoadSettings();
    }, []);

    async function checkUserAndLoadSettings() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/dictionary', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success && data.words) {
                const currentBlocked = new Set<string>();
                const currentSources = new Set<string>();
                const dictMap = new Map<string, number>(data.words.map((w: any) => [w.word, w.weight]));

                // ジャンルブロック判定
                GENRE_CATEGORIES.forEach(category => {
                    category.items.forEach(item => {
                        const firstWord = item.words[0];
                        const weight = dictMap.get(firstWord);
                        if (weight !== undefined && weight <= -4.0) {
                            currentBlocked.add(item.label);
                        }
                    });
                });
                setBlockedItems(currentBlocked);

                // ソース設定判定 (SOURCE:id)
                let hasSourceSettings = false;
                RSS_FEEDS.forEach(feed => {
                    const key = `SOURCE:${feed.id}`;
                    const weight = dictMap.get(key);
                    if (weight !== undefined) {
                        hasSourceSettings = true;
                        if (weight > 0) currentSources.add(feed.id);
                    }
                });

                // 設定がない場合はデフォルト（Yahooのみ）
                if (!hasSourceSettings) {
                    currentSources.add('yahoo');
                }
                setActiveSources(currentSources);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleItem(item: { label: string, words: string[] }) {
        // 楽観的UI更新
        const isBlocked = blockedItems.has(item.label);

        setBlockedItems(prev => {
            const next = new Set(prev);
            if (isBlocked) next.delete(item.label);
            else next.add(item.label);
            return next;
        });

        // 裏側でAPIを呼ぶ
        const weight = isBlocked ? 0 : -5.0;
        const updates = item.words.map(word => ({
            word,
            weight
        }));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            await fetch('/api/dictionary/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ updates })
            });
        } catch (error) {
            console.error('Background save error:', error);
        }
    }

    async function toggleSource(sourceId: string) {
        const isActive = activeSources.has(sourceId);

        // 楽観的UI更新
        setActiveSources(prev => {
            const next = new Set(prev);
            if (isActive) next.delete(sourceId);
            else next.add(sourceId);
            return next;
        });

        // 裏側でAPIを呼ぶ
        const weight = isActive ? 0 : 1.0; // OFFなら0、ONなら1.0
        const updates = [{
            word: `SOURCE:${sourceId}`,
            weight
        }];

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            await fetch('/api/dictionary/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ updates })
            });
        } catch (error) {
            console.error('Background save error:', error);
        }
    }

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>読み込み中...</div></div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>設定</h1>
                <a href="/" className={styles.backBtn}>← 戻る</a>
            </header>

            <main className={styles.main}>
                <p className={styles.description}>
                    興味のないジャンルを選択してください。選択したジャンルの記事は表示されなくなります。
                </p>

                {GENRE_CATEGORIES.map((category) => (
                    <section key={category.code} className={styles.section}>
                        <h2 className={styles.sectionTitle}>{category.label}</h2>
                        <div className={styles.genreGrid}>
                            {category.items.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => toggleItem(item)}
                                    className={`${styles.genreBtn} ${blockedItems.has(item.label) ? styles.blocked : ''}`}
                                >
                                    <span className={styles.icon}>
                                        {blockedItems.has(item.label) ? '🚫' : '✅'}
                                    </span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </section>
                ))}

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>ニュースソース設定</h2>
                    <p className={styles.description}>
                        取得するニュースサイトを選択してください。
                    </p>
                    <div className={styles.sourceList}>
                        {RSS_FEEDS.map((feed) => (
                            <button
                                key={feed.id}
                                onClick={() => toggleSource(feed.id)}
                                className={`${styles.sourceBtn} ${activeSources.has(feed.id) ? styles.active : ''}`}
                            >
                                <div className={styles.sourceInfo}>
                                    <span className={styles.sourceName}>{feed.name}</span>
                                    <span className={styles.sourceDesc}>{feed.description}</span>
                                </div>
                                <span className={styles.toggleIcon}>
                                    {activeSources.has(feed.id) ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
