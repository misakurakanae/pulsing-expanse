'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import styles from './admin.module.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        bookmarks: 0,
        dictionaryWords: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        // Note: In a real app, you'd want a dedicated admin API for this
        // to avoid fetching all data. This is a simplified version.
        try {
            // Get counts (approximate using simple queries)
            // Note: supabase-js client doesn't support count() on auth.users directly from client
            // We'll just show what we can access via public tables for now

            const { count: bookmarksCount } = await supabase
                .from('bookmarks')
                .select('*', { count: 'exact', head: true });

            const { count: wordsCount } = await supabase
                .from('word_dictionary')
                .select('*', { count: 'exact', head: true });

            setStats({
                users: 0, // Cannot fetch users count from client without admin API
                bookmarks: bookmarksCount || 0,
                dictionaryWords: wordsCount || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1 className={styles.cardTitle} style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
                ダッシュボード
            </h1>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>総ブックマーク数</div>
                    <div className={styles.statValue}>{loading ? '...' : stats.bookmarks}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>総登録単語数</div>
                    <div className={styles.statValue}>{loading ? '...' : stats.dictionaryWords}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>総ユーザー数</div>
                    <div className={styles.statValue}>-</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                        (要Admin API)
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>システムステータス</h2>
                </div>
                <p>システムは正常に稼働しています。</p>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '8px' }}>
                    最終更新: {new Date().toLocaleString('ja-JP')}
                </p>
            </div>
        </div>
    );
}
