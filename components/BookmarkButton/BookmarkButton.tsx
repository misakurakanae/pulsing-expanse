'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import styles from './BookmarkButton.module.css';

interface BookmarkButtonProps {
    articleUrl: string;
    articleTitle: string;
    articleSource: string;
    initialBookmarked?: boolean;
}

export default function BookmarkButton({
    articleUrl,
    articleTitle,
    articleSource,
}: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // ユーザーIDの取得
    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || 'guest');
        };
        getUserId();
    }, []);

    // ブックマーク状態の確認と同期
    useEffect(() => {
        if (!userId) return;

        const storageKey = `pulsing-expanse-bookmarks-${userId}`;

        const checkBookmark = () => {
            try {
                const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const exists = bookmarks.some((b: any) => b.articleUrl === articleUrl);
                setIsBookmarked(exists);
            } catch (e) {
                console.error('Failed to parse bookmarks', e);
            }
        };

        checkBookmark();

        // イベントリスナー
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === storageKey || e.key === null) checkBookmark();
        };
        const handleCustomUpdate = () => checkBookmark();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('bookmarks-updated', handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('bookmarks-updated', handleCustomUpdate);
        };
    }, [articleUrl, userId]);

    const toggleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userId) return;

        const storageKey = `pulsing-expanse-bookmarks-${userId}`;

        try {
            const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');

            if (isBookmarked) {
                // 削除
                const newBookmarks = bookmarks.filter((b: any) => b.articleUrl !== articleUrl);
                localStorage.setItem(storageKey, JSON.stringify(newBookmarks));
                setIsBookmarked(false);
            } else {
                // 追加
                const newBookmark = {
                    articleUrl,
                    articleTitle,
                    articleSource,
                    savedAt: new Date().toISOString()
                };
                bookmarks.push(newBookmark);
                localStorage.setItem(storageKey, JSON.stringify(bookmarks));
                setIsBookmarked(true);
            }

            // 更新通知
            window.dispatchEvent(new Event('bookmarks-updated'));

        } catch (e) {
            console.error('Failed to update bookmarks', e);
            alert('ブックマークの保存に失敗しました');
        }
    };

    if (!userId) return null; // ロード中は表示しない

    return (
        <button
            onClick={toggleBookmark}
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            aria-label={isBookmarked ? 'ブックマーク済み' : 'ブックマークに追加'}
            title={isBookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        </button>
    );
}
