'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import styles from './TrendingSection.module.css';

interface TrendingArticle {
    article_url: string;
    article_title: string;
    total_interactions: number;
    unique_users: number;
    clicks: number;
    bookmarks: number;
}

export default function TrendingSection() {
    const [trending, setTrending] = useState<TrendingArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrending();
    }, []);

    async function loadTrending() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/trending', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();
            if (data.success) {
                setTrending(data.trending);
            }
        } catch (error) {
            console.error('Failed to load trending:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return null; // または <div className={styles.loading}>読み込み中...</div>
    }

    if (trending.length === 0) {
        return null; // トレンド記事がない場合は表示しない
    }

    return (
        <section className={styles.trendingSection}>
            <div className={styles.header}>
                <h2 className={styles.title}>🔥 今週のトレンド TOP3</h2>
                <span className={styles.subtitle}>みんなが注目している記事</span>
            </div>
            <div className={styles.trendingList}>
                {trending.map((article, index) => (
                    <a
                        key={article.article_url}
                        href={article.article_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.trendingCard}
                    >
                        <div className={styles.rank}>#{index + 1}</div>
                        <div className={styles.content}>
                            <h3 className={styles.articleTitle}>{article.article_title}</h3>
                            <div className={styles.stats}>
                                <span className={styles.stat}>
                                    👁️ {article.clicks}回
                                </span>
                                <span className={styles.stat}>
                                    🔖 {article.bookmarks}件
                                </span>
                                <span className={styles.stat}>
                                    👥 {article.unique_users}人
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
