'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import '../globals.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('確認メールを送信しました。メールを確認してください。');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
            }
        } catch (error: any) {
            alert(error.message || 'エラーが発生しました');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>
                    <span className="gradient-text">My News</span>
                </h1>
                <p className={styles.subtitle}>
                    AIがあなた専用のニュースを学習
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="email">メールアドレス</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">パスワード</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className={styles.input}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitBtn}
                    >
                        {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}
                    </button>
                </form>

                <div className={styles.toggle}>
                    {mode === 'login' ? (
                        <p>
                            アカウントをお持ちでない方は{' '}
                            <button
                                onClick={() => setMode('signup')}
                                className={styles.toggleBtn}
                            >
                                新規登録
                            </button>
                        </p>
                    ) : (
                        <p>
                            すでにアカウントをお持ちの方は{' '}
                            <button
                                onClick={() => setMode('login')}
                                className={styles.toggleBtn}
                            >
                                ログイン
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
