'use client';

import styles from './AdSidebar.module.css';

export default function AdSidebar() {
    return (
        <aside className={styles.sidebar}>
            {/* 自社ブログプロモーション */}
            <div className={styles.promoCard}>
                <div className={styles.cardHeader}>
                    <span className={styles.badge}>おすすめ</span>
                </div>
                <h3 className={styles.cardTitle}>📝 開発者ブログ</h3>
                <p className={styles.cardDescription}>
                    ニュースアプリの開発秘話や、AI活用のヒントを発信中
                </p>
                <a
                    href="https://your-blog.example.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardButton}
                >
                    ブログを見る →
                </a>
            </div>

            {/* プレミアムプラン案内 */}
            <div className={`${styles.promoCard} ${styles.premium}`}>
                <div className={styles.cardHeader}>
                    <span className={`${styles.badge} ${styles.premiumBadge}`}>✨ Premium</span>
                </div>
                <h3 className={styles.cardTitle}>広告なしで快適に</h3>
                <p className={styles.cardDescription}>
                    月額300円で全機能が使い放題
                </p>
                <ul className={styles.featureList}>
                    <li>✓ 広告非表示</li>
                    <li>✓ 無制限ブックマーク</li>
                    <li>✓ 高度なフィルター</li>
                </ul>
                <button className={styles.premiumButton} disabled>
                    近日公開
                </button>
            </div>

            {/* ヘルプ・フィードバック */}
            <div className={styles.helpCard}>
                <p className={styles.helpText}>
                    ご意見・ご要望はこちら
                </p>
                <a
                    href="mailto:feedback@example.com"
                    className={styles.helpLink}
                >
                    📧 お問い合わせ
                </a>
            </div>
        </aside>
    );
}
