'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import BookmarkButton from '@/components/BookmarkButton/BookmarkButton';
import styles from './bookmarks.module.css';

interface Bookmark {
    articleUrl: string;
    articleTitle: string;
    articleSource: string;
    savedAt: string;
}

export default function BookmarksPage() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || 'guest');
        };
        init();
    }, []);

    useEffect(() => {
        if (!userId) return;

        loadBookmarks();

        const handleStorageChange = () => loadBookmarks();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('bookmarks-updated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('bookmarks-updated', handleStorageChange);
        };
    }, [userId]);

    function loadBookmarks() {
        if (!userId) return;

        const storageKey = `pulsing-expanse-bookmarks-${userId}`;

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                parsed.sort((a: Bookmark, b: Bookmark) =>
                    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
                );
                setBookmarks(parsed);
            } else {
                setBookmarks([]);
            }
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !userId) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>読み込み中...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>📚 あとで読む（{userId === 'guest' ? 'ゲスト' : 'マイ'}保存）</h1>
                <a href="/" className={styles.backBtn}>← 戻る</a>
            </header>

            <main className={styles.main}>
                {bookmarks.length === 0 ? (
                    <div className={styles.empty}>
                        <p className={styles.emptyIcon}>🔖</p>
                        <p className={styles.emptyText}>まだブックマークした記事がありません</p>
                        <p className={styles.emptySubText}>
                            記事の右上のブックマークボタンを押すと<br />
                            ここに保存されます
                            {userId === 'guest' && <br />}
                            {userId === 'guest' && <span style={{ fontSize: '0.8em', color: '#888' }}>※ログインするとアカウントごとに保存できます</span>}
                        </p>
                        <a href="/" className={styles.emptyLink}>ニュースを見る</a>
                    </div>
                ) : (
                    <div className={styles.bookmarkList}>
                        {bookmarks.map((bookmark) => (
                            <article key={bookmark.articleUrl} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.source}>{bookmark.articleSource}</span>
                                    <div className={styles.actions}>
                                        <BookmarkButton
                                            articleUrl={bookmark.articleUrl}
                                            articleTitle={bookmark.articleTitle}
                                            articleSource={bookmark.articleSource}
                                        />
                                    </div>
                                </div>
                                <a
                                    href={bookmark.articleUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.titleLink}
                                >
                                    <h2 className={styles.cardTitle}>{bookmark.articleTitle}</h2>
                                </a>
                                <time className={styles.time}>
                                    保存: {new Date(bookmark.savedAt).toLocaleDateString('ja-JP')} {new Date(bookmark.savedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </time>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
