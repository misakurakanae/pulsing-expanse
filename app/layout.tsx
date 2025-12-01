import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AdminProvider } from '@/contexts/AdminContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'あなた専用ニュース | AIパーソナライズドニュース',
    description: 'AIがあなたの興味に合わせてニュースを要約・配信。東洋経済、ダイヤモンド、ITmediaなど主要メディアから最新情報をお届け',
    keywords: 'ニュース,AI,要約,パーソナライズ,ビジネス,テクノロジー',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#6366f1" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="My News" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className={inter.className}>
                <ThemeProvider>
                    <AdminProvider>
                        {children}
                    </AdminProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
