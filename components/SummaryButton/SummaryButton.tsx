'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import styles from './SummaryButton.module.css';

interface SummaryButtonProps {
    articleTitle: string;
    articleUrl: string;
}

const DAILY_LIMIT = 10;

export default function SummaryButton({ articleTitle, articleUrl }: SummaryButtonProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [remaining, setRemaining] = useState(DAILY_LIMIT);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        checkUsage();
    }, []);

    function checkUsage() {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('summaryUsage');

        if (stored) {
            const { date, count } = JSON.parse(stored);
            if (date === today) {
                setRemaining(Math.max(0, DAILY_LIMIT - count));
            } else {
                // Reset for new day
                localStorage.setItem('summaryUsage', JSON.stringify({ date: today, count: 0 }));
                setRemaining(DAILY_LIMIT);
            }
        } else {
            localStorage.setItem('summaryUsage', JSON.stringify({ date: today, count: 0 }));
            setRemaining(DAILY_LIMIT);
        }
    }

    function incrementUsage() {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('summaryUsage');
        let newCount = 1;

        if (stored) {
            const { date, count } = JSON.parse(stored);
            if (date === today) {
                newCount = count + 1;
            }
        }

        localStorage.setItem('summaryUsage', JSON.stringify({ date: today, count: newCount }));
        setRemaining(Math.max(0, DAILY_LIMIT - newCount));
    }

    async function handleGetSummary() {
        if (remaining <= 0 && !summary) return;
        if (summary) {
            setIsOpen(!isOpen);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: articleTitle,
                    url: articleUrl
                })
            });

            const data = await response.json();

            if (data.error && !data.mock) {
                throw new Error(data.error);
            }

            setSummary(data.summary);
            setIsOpen(true);
            incrementUsage();

            if (data.mock) {
                console.log('Mock summary used (API key missing)');
            }

        } catch (err: any) {
            setError(err.message || '要約の生成に失敗しました');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <button
                onClick={handleGetSummary}
                className={`${styles.summaryBtn} ${remaining <= 0 && !summary ? styles.disabled : ''}`}
                disabled={loading || (remaining <= 0 && !summary)}
            >
                {loading ? (
                    <span className={styles.spinner}></span>
                ) : (
                    <>
                        <span className={styles.icon}>✨</span>
                        {summary ? (isOpen ? '要約を閉じる' : '要約を表示') : 'AI要約'}
                        {!summary && <span className={styles.count}>残り{remaining}回</span>}
                    </>
                )}
            </button>

            {error && <p className={styles.error}>{error}</p>}

            {isOpen && summary && (
                <div className={styles.summaryContent}>
                    <div className={styles.summaryHeader}>
                        <span className={styles.aiLabel}>AI Summary</span>
                    </div>
                    <div className={styles.text}>
                        {summary.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                    <div className={styles.promo}>
                        Pro版なら無制限で使い放題！ 🚀
                    </div>
                </div>
            )}
        </div>
    );
}
