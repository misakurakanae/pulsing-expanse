'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import styles from '../admin.module.css';

export default function AdminContentPage() {
    const [words, setWords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWords();
    }, []);

    async function fetchWords() {
        try {
            // Fetch all words (RLS might restrict this to own words without admin key)
            const { data, error } = await supabase
                .from('word_dictionary')
                .select('*')
                .limit(50)
                .order('created_at', { ascending: false });

            if (data) {
                setWords(data);
            }
        } catch (error) {
            console.error('Error fetching words:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1 className={styles.cardTitle} style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
                コンテンツ管理
            </h1>

            <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ marginBottom: '16px' }}>
                    最新の登録単語 (辞書)
                </h2>

                {loading ? (
                    <p>読み込み中...</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>単語</th>
                                <th>スコア</th>
                                <th>ユーザーID</th>
                                <th>更新日</th>
                                <th>アクション</th>
                            </tr>
                        </thead>
                        <tbody>
                            {words.map((word) => (
                                <tr key={word.id}>
                                    <td>{word.word}</td>
                                    <td>{word.weight}</td>
                                    <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {word.user_id}
                                    </td>
                                    <td>{new Date(word.last_updated).toLocaleDateString()}</td>
                                    <td>
                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                                            削除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {words.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>
                                        データがありません、または表示権限がありません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
