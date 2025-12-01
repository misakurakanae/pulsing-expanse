'use client';

import { useRouter } from 'next/navigation';
import styles from './privacy.module.css';

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>🔒 プライバシーポリシー</h1>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    ← 戻る
                </button>
            </header>

            <main className={styles.main}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>私たちの約束</h2>
                    <div className={styles.promise}>
                        <div className={styles.promiseItem}>
                            <span className={styles.icon}>✅</span>
                            <div>
                                <h3>広告トラッカーなし</h3>
                                <p>第三者の広告トラッカーは一切使用していません</p>
                            </div>
                        </div>
                        <div className={styles.promiseItem}>
                            <span className={styles.icon}>✅</span>
                            <div>
                                <h3>データ販売なし</h3>
                                <p>あなたのデータを第三者に販売することは絶対にありません</p>
                            </div>
                        </div>
                        <div className={styles.promiseItem}>
                            <span className={styles.icon}>✅</span>
                            <div>
                                <h3>透明性の確保</h3>
                                <p>将来的にオープンソース化を予定しています</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>収集する情報</h2>
                    <ul className={styles.list}>
                        <li>メールアドレス（ログイン用）</li>
                        <li>ニュース嗜好データ（辞書、評価、ブックマーク）</li>
                        <li>利用統計（記事クリック、ページビュー）</li>
                    </ul>
                    <p className={styles.note}>
                        これらの情報は、あなた専用のニュースフィードを提供するためのみに使用されます。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>データの保管</h2>
                    <p>
                        すべてのデータはSupabase（PostgreSQL）に暗号化して保管されています。
                        アクセスできるのは本人のみです。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>データの削除</h2>
                    <p>
                        アカウントを削除すると、すべてのデータが完全に削除されます。
                        設定ページから削除リクエストを送信できます。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>お問い合わせ</h2>
                    <p>
                        プライバシーに関するご質問は、
                        <a href="mailto:privacy@herofilter.example.com" className={styles.link}>
                            privacy@herofilter.example.com
                        </a>
                        までお気軽にどうぞ。
                    </p>
                </section>

                <footer className={styles.footer}>
                    <p>最終更新: 2025年11月29日</p>
                </footer>
            </main>
        </div>
    );
}
