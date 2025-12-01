'use client';

import styles from '../admin.module.css';

export default function AdminUsersPage() {
    return (
        <div>
            <h1 className={styles.cardTitle} style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
                ユーザー管理
            </h1>

            <div className={styles.card}>
                <p style={{ marginBottom: '16px' }}>
                    ※ ユーザー一覧の取得には、SupabaseのService Role Keyが必要です。
                    現在はデモ用のプレースホルダーを表示しています。
                </p>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>メールアドレス</th>
                            <th>登録日</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Mock Data */}
                        <tr>
                            <td>user_123...</td>
                            <td>user@example.com</td>
                            <td>2023-11-01</td>
                            <td>
                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>削除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
