'use client';

import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import styles from './AdminPanel.module.css';

export default function AdminPanel() {
    const { isAdmin, isPremiumDebug, togglePremiumDebug, resetAiLimit } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);

    if (!isAdmin) return null;

    return (
        <div className={styles.container}>
            <button
                className={styles.toggleBtn}
                onClick={() => setIsOpen(!isOpen)}
                title="Admin Panel"
            >
                🛡️
            </button>

            {isOpen && (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <h3>Admin Control</h3>
                        <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>×</button>
                    </div>

                    <div className={styles.section}>
                        <h4>Debug Options</h4>
                        <div className={styles.option}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isPremiumDebug}
                                    onChange={togglePremiumDebug}
                                />
                                Simulate Premium Plan
                            </label>
                            <p className={styles.desc}>
                                有料プランの機能を有効化してテストします
                            </p>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h4>Actions</h4>
                        <button onClick={resetAiLimit} className={styles.actionBtn}>
                            Reset AI Limit (10/10)
                        </button>
                    </div>

                    <div className={styles.footer}>
                        Logged in as Admin
                    </div>
                </div>
            )}
        </div>
    );
}
