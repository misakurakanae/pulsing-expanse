'use client';

import { useState } from 'react';
import { getNewsRating } from '@/lib/personalization';
import BookmarkButton from './BookmarkButton/BookmarkButton';
import styles from './NewsCard.module.css';

interface NewsCardProps {
    title: string;
    link: string;
    source: string;
    pubDate?: string;
    summary?: string;
    onRate: (rating: number) => void;
}

export default function NewsCard({
    title,
    link,
    source,
    pubDate,
    summary,
    onRate,
}: NewsCardProps) {
    const [currentRating, setCurrentRating] = useState<number | null>(
        getNewsRating(link)
    );
    const [isExpanded, setIsExpanded] = useState(false);

    const handleRate = (rating: number) => {
        setCurrentRating(rating);
        onRate(rating);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={`${styles.card} fade-in`}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.source}>{source}</span>
                    <BookmarkButton
                        articleUrl={link}
                        articleTitle={title}
                        articleSource={source}
                    />
                </div>
                {pubDate && <span className={styles.date}>{formatDate(pubDate)}</span>}
            </div>

            <h2 className={styles.title}>
                <a href={link} target="_blank" rel="noopener noreferrer">
                    {title}
                </a>
            </h2>

            {summary && (
                <div className={styles.summaryContainer}>
                    <p className={`${styles.summary} ${isExpanded ? styles.expanded : ''}`}>
                        {summary}
                    </p>
                    {summary.length > 150 && (
                        <button
                            className={styles.expandBtn}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? '折りたたむ' : 'もっと読む'}
                        </button>
                    )}
                </div>
            )}

            <div className={styles.actions}>
                <div className={styles.ratingButtons}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                            key={rating}
                            className={`${styles.starBtn} ${currentRating && currentRating >= rating ? styles.active : ''
                                }`}
                            onClick={() => handleRate(rating)}
                            title={`${rating}つ星`}
                        >
                            ★
                        </button>
                    ))}
                </div>
                <button
                    className={`${styles.notInterested} ${currentRating === 0 ? styles.active : ''
                        }`}
                    onClick={() => handleRate(0)}
                >
                    興味なし
                </button>
            </div>
        </div>
    );
}
