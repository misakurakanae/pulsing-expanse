'use client';

import styles from './ShareButton.module.css';

interface ShareButtonProps {
    articleTitle: string;
    articleUrl: string;
}

export default function ShareButton({ articleTitle, articleUrl }: ShareButtonProps) {
    function handleShare() {
        const text = `HERO FILTER - あなただけのニュースカスタム\n\n${articleTitle}`;
        const hashtags = 'HeroFilter,ニュース';
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(articleUrl)}&hashtags=${encodeURIComponent(hashtags)}`;

        window.open(shareUrl, '_blank', 'width=600,height=400');
    }

    return (
        <button
            onClick={handleShare}
            className={styles.shareBtn}
            aria-label="Xでシェア"
            title="Xでシェア"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        </button>
    );
}
