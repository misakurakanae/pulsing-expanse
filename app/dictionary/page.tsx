'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import styles from './dictionary.module.css';

interface DictionaryWord {
    word: string;
    weight: number;
    last_updated: string;
}

interface GroupedWords {
    [key: number]: DictionaryWord[];
}

export default function DictionaryPage() {
    const [words, setWords] = useState<DictionaryWord[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUserAndLoadDictionary();
    }, []);

    async function checkUserAndLoadDictionary() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        loadDictionary();
    }

    async function loadDictionary() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/dictionary', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setWords(data.words || []);
            }
        } catch (error) {
            console.error('Failed to load dictionary:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(word: string) {
        if (!confirm(`「${word}」を辞書から削除しますか？`)) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setWords(words.filter(w => w.word !== word));
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('削除に失敗しました');
        }
    }

    // Group words by weight
    const groupedWords = words.reduce((acc, word) => {
        const score = Math.round(word.weight * 10) / 10; // Round to 1 decimal
        if (!acc[score]) acc[score] = [];
        acc[score].push(word);
        return acc;
    }, {} as GroupedWords);

    // Sort scores descending
    const sortedScores = Object.keys(groupedWords)
        .map(Number)
        .sort((a, b) => b - a);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>辞書を読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>
                        <span className="gradient-text">📖 My Dictionary</span>
                    </h1>
                    <a href="/" className={styles.backBtn}>← ニュースに戻る</a>
                </div>
                <p className={styles.subtitle}>登録単語数: {words.length}件</p>
            </header>

            <main className={styles.main}>
                {words.length === 0 ? (
                    <div className={styles.empty}>
                        <p>辞書に登録されている単語がありません</p>
                        <a href="/" className={styles.backBtn}>ニュースで単語を登録してみましょう</a>
                    </div>
                ) : (
                    <div className={styles.groupsContainer}>
                        {sortedScores.map((score) => (
                            <section key={score} className={styles.scoreSection}>
                                <h2 className={styles.scoreHeader}>
                                    スコア <span className={styles.scoreValue}>{score.toFixed(1)}</span>
                                </h2>
                                <div className={styles.wordChips}>
                                    {groupedWords[score].map((item) => (
                                        <div key={item.word} className={styles.wordChip}>
                                            <span className={styles.wordText}>{item.word}</span>
                                            <button
                                                onClick={() => handleDelete(item.word)}
                                                className={styles.deleteBtn}
                                                aria-label={`${item.word}を削除`}
                                                title="削除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
