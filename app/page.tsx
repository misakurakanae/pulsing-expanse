'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import BookmarkButton from '@/components/BookmarkButton/BookmarkButton';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import TrendingSection from '@/components/TrendingSection/TrendingSection';
import AdSidebar from '@/components/AdSidebar/AdSidebar';
import ShareButton from '@/components/ShareButton/ShareButton';
import SummaryButton from '@/components/SummaryButton/SummaryButton';
import AdminPanel from '@/components/AdminPanel/AdminPanel';
import { calculateReadTime, markAsRead, getReadArticles } from '@/lib/article-utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import styles from './page.module.css';
import heroStyles from './hero-mode.module.css';
import './globals.css';

interface NewsArticle {
    title: string;
    link: string;
    source: string;
    pubDate?: string;
    contentSnippet?: string;
    score: number;
    readTime?: number;
    isRead?: boolean;
}

export default function Home() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [dictionarySize, setDictionarySize] = useState(0);
    const [hiddenArticles, setHiddenArticles] = useState<Set<string>>(new Set());
    const [fadingArticles, setFadingArticles] = useState<Set<string>>(new Set());
    const [wordInput, setWordInput] = useState<{ [key: string]: string }>({});
    const [toastMessage, setToastMessage] = useState<string>('');
    const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
    const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
    const [focusedIndex, setFocusedIndex] = useState(0);
    const router = useRouter();

    useEffect(() => {
        checkUser();
        // Load read articles from localStorage
        setReadArticles(getReadArticles());
    }, []);

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);
        loadNews();
    }

    async function loadNews() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/news', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                // Add read time and read status
                const enrichedNews = data.news.map((article: NewsArticle) => ({
                    ...article,
                    readTime: calculateReadTime(article.contentSnippet || article.title),
                    isRead: readArticles.has(article.link)
                }));
                setNews(enrichedNews);
                setDictionarySize(data.dictionary_size || 0);

                // Fetch bookmarks
                const bookmarksResponse = await fetch('/api/bookmarks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const bookmarksData = await bookmarksResponse.json();
                if (bookmarksData.success) {
                    const bookmarkSet = new Set(bookmarksData.bookmarks.map((b: any) => b.article_url));
                    setBookmarkedArticles(bookmarkSet as Set<string>);
                }
            }
        } catch (error) {
            console.error('Failed to load news:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRate(article: NewsArticle, rating: number) {
        setFadingArticles(prev => new Set(prev).add(article.link));

        try {
            const response = await fetch('/api/rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    article_url: article.link,
                    article_title: article.title,
                    article_content: article.contentSnippet || '',
                    rating,
                }),
            });

            const data = await response.json();
            if (data.success) {
                const wordCount = data.words_updated || 0;
                const updatedWords = data.updated_words || [];
                const emoji = rating >= 3 ? '👍' : '👎';

                let message = `${emoji} 評価を記録しました！\n`;
                if (wordCount > 0) {
                    const wordList = updatedWords.slice(0, 5).map((w: string) => `「${w}」`).join('、');
                    const moreText = updatedWords.length > 5 ? ` 他${updatedWords.length - 5}個` : '';
                    message += `辞書の${wordList}${moreText}を更新しました`;
                } else {
                    message += '辞書に該当する単語がありませんでした\n手動で単語を登録してください';
                }

                alert(message);

                setTimeout(() => {
                    setHiddenArticles(prev => new Set(prev).add(article.link));
                    setFadingArticles(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(article.link);
                        return newSet;
                    });
                }, 300);
            }
        } catch (error) {
            console.error('Rating error:', error);
            alert('評価の記録に失敗しました');
            setFadingArticles(prev => {
                const newSet = new Set(prev);
                newSet.delete(article.link);
                return newSet;
            });
        }
    }

    async function handleAddWord(articleLink: string) {
        const word = wordInput[articleLink]?.trim();
        if (!word) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/dictionary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    word,
                    weight: 5.0
                })
            });

            const data = await response.json();
            if (data.success) {
                setWordInput(prev => ({ ...prev, [articleLink]: '' }));
                setDictionarySize(prev => prev + 1);

                // トースト通知を表示（2秒間）
                setToastMessage(`「${word}」を登録しました！`);
                setTimeout(() => setToastMessage(''), 2000);
            }
        } catch (error) {
            console.error('Word registration error:', error);
            alert('単語の登録に失敗しました');
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
    }

    async function trackArticleClick(article: NewsArticle) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            await fetch('/api/trending', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    articleUrl: article.link,
                    articleTitle: article.title,
                    viewType: 'click',
                }),
            });
        } catch (error) {
            console.error('Failed to track click:', error);
        }
    }

    function handleArticleClick(article: NewsArticle) {
        // Mark as read
        markAsRead(article.link);
        setReadArticles(prev => new Set(prev).add(article.link));
        setNews(prev => prev.map(a =>
            a.link === article.link ? { ...a, isRead: true } : a
        ));
        // Track click
        trackArticleClick(article);
    }

    // Keyboard shortcuts
    const visibleNews = news.filter(article => !hiddenArticles.has(article.link));
    useKeyboardShortcuts({
        onNext: () => setFocusedIndex(prev => Math.min(prev + 1, visibleNews.length - 1)),
        onPrevious: () => setFocusedIndex(prev => Math.max(prev - 1, 0)),
        onRefresh: () => loadNews(),
        onRate: (rating) => {
            if (visibleNews[focusedIndex]) {
                handleRate(visibleNews[focusedIndex], rating);
            }
        },
    });

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>ニュースを取得中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.title}>
                            <span className="gradient-text">HERO FILTER</span>
                        </h1>
                        <div className={styles.headerActions}>
                            <ThemeToggle />
                            <button onClick={handleLogout} className={styles.logoutBtn}>
                                ログアウト
                            </button>
                        </div>
                    </div>
                    <div className={styles.stats}>
                        <span>辞書: {dictionarySize}単語</span>
                        <span>記事: {news.length}件</span>
                        <a href="/dictionary" className={styles.dictionaryLink}>📖 辞書</a>
                        <a href="/bookmarks" className={styles.dictionaryLink}>📚 あとで読む</a>
                        <a href="/settings" className={styles.dictionaryLink}>⚙️ 設定</a>
                    </div>
                </header>

                <TrendingSection />

                <main className={styles.main}>
                    {news.length === 0 ? (
                        <div className={styles.empty}>
                            <p>ニュースが見つかりませんでした</p>
                            <button onClick={loadNews} className={styles.refreshBtn}>
                                🔄 再読み込み
                            </button>
                        </div>
                    ) : (
                        <div className={styles.newsList}>
                            {news.filter(article => !hiddenArticles.has(article.link)).map((article, index) => (
                                <article
                                    key={article.link}
                                    className={`
                                        ${styles.newsCard} 
                                        ${fadingArticles.has(article.link) ? styles.fading : ''} 
                                        ${article.isRead ? styles.read : ''}
                                        ${article.score >= 80 ? heroStyles.heroCard : ''}
                                    `}
                                >
                                    {article.score >= 80 && (
                                        <div className={heroStyles.heroBadge}>HERO PICK 🔥</div>
                                    )}
                                    <div className={styles.cardHeader}>
                                        <span className={styles.rank}>#{index + 1}</span>
                                        <span className={styles.source}>{article.source}</span>
                                        <span className={styles.score}>スコア: {article.score.toFixed(1)}</span>
                                        {article.readTime && (
                                            <span className={styles.readTime}>📖 約{article.readTime}分</span>
                                        )}
                                        <SummaryButton articleTitle={article.title} articleUrl={article.link} />
                                        <ShareButton articleTitle={article.title} articleUrl={article.link} />
                                        <BookmarkButton
                                            articleUrl={article.link}
                                            articleTitle={article.title}
                                            articleSource={article.source}
                                            initialBookmarked={bookmarkedArticles.has(article.link)}
                                        />
                                        <span className={styles.date}>
                                            {article.pubDate ? new Date(article.pubDate).toLocaleString('ja-JP', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '---'}
                                        </span>

                                        <div className={styles.wordRegistrationInline}>
                                            <input
                                                type="text"
                                                placeholder="単語"
                                                value={wordInput[article.link] || ''}
                                                onChange={(e) => setWordInput(prev => ({ ...prev, [article.link]: e.target.value }))}
                                                className={styles.wordInputInline}
                                            />
                                            <button
                                                onClick={() => handleAddWord(article.link)}
                                                className={styles.addWordBtnInline}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <h2 className={styles.newsTitle}>
                                        <a
                                            href={article.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => handleArticleClick(article)}
                                        >
                                            {article.title}
                                        </a>
                                    </h2>

                                    <div className={styles.ratingSection}>
                                        <p className={styles.ratingLabel}>この記事の評価:</p>
                                        <div className={styles.ratingButtons}>
                                            {[1, 2, 3, 4].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => handleRate(article, rating)}
                                                    className={styles.ratingBtn}
                                                    title={
                                                        rating === 1 ? '興味なし' :
                                                            rating === 2 ? 'あまり興味なし' :
                                                                rating === 3 ? 'まあまあ興味あり' :
                                                                    'かなり興味あり'
                                                    }
                                                >
                                                    {rating}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </main>

                <footer className={styles.footer}>
                    <button onClick={loadNews} className={styles.refreshBtn}>
                        🔄 ニュースを更新
                    </button>
                </footer>

                {/* トースト通知 */}
                {toastMessage && (
                    <div className={styles.toast}>
                        {toastMessage}
                    </div>
                )}
            </div>

            <AdSidebar />
            <AdminPanel />
        </div>
    );
}
