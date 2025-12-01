# セットアップガイド - 単語学習型ニュースアプリ

## 📋 現在の実装状況

### ✅ 完成（バックエンド）
- 形態素解析エンジン（kuromoji.js）
- 単語辞書システム
- スコアリングアルゴリズム
- 学習エンジン（1-4評価）
- API Routes（ニュース取得・評価・辞書管理）

### 🚧 実装中（フロントエンド）
- 一覧表示UI
- スワイプ評価UI
- 辞書管理画面

---

## 🚀 セットアップ手順

### 1. Node.jsをインストール

まずNode.jsをインストールしてください（推奨: v18以上）:
https://nodejs.org/

### 2. 依存関係のインストール

```bash
cd c:\Users\PCUser\.gemini\antigravity\playground\pulsing-expanse
npm install
```

> [!NOTE]
> kuromoji.jsの辞書ファイルは約10MBです。インストールに少し時間がかかります。

### 3. Supabaseプロジェクトの作成

1. https://supabase.com にアクセス
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワードを設定
4. リージョンは「Northeast Asia (Tokyo)」を選択（推奨）
5. プロジェクトが作成されるまで2-3分待機

### 4. データベーススキーマのセットアップ

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase/schema.sql`の内容をコピー
3. SQL Editorに貼り付けて「Run」を実行

### 5. 環境変数の設定

1. Supabaseダッシュボードの「Settings」→「API」を開く
2. 以下をコピー：
   - `Project URL`
   - `anon` `public` キー

3. `.env.example`をコピーして`.env.local`を作成:

```bash
copy .env.example .env.local
```

4. `.env.local`を編集:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your anon key here
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください！

---

## 📖 システム構成

### バックエンド

- **形態素解析**: kuromoji.js で日本語を単語に分解
- **スコアリング**: 単語の重みを合計して記事スコアを算出
- **学習**: 1-4評価に応じて単語重みを±0.1〜±0.3調整
- **データベース**: Supabase PostgreSQL

### API エンドポイント

- `GET /api/news` - スコア順ニュース取得
- `POST /api/rate` - 記事を評価（1-4）
- `GET /api/dictionary` - 単語辞書取得
- `POST /api/dictionary` - 単語追加
- `DELETE /api/dictionary` - 単語削除
- `GET /api/word-suggestions` - 候補単語取得

---

## 🔧 トラブルシューティング

### `npm install`が失敗する

```bash
# Node.jsのバージョン確認
node --version

# v18以上でない場合は再インストール
```

### Supabaseに接続できない

1. `.env.local`のURLとキーが正しいか確認
2. Supabaseプロジェクトが起動しているか確認（Dashboard右上の●が緑色）
3. サーバーを再起動（Ctrl+C → npm run dev）

### kuromoji辞書が見つからない

kuromojiは辞書ファイルを`/public/dict`に配置する必要があります。
（フロントエンド実装時に自動配置予定）

---

## 📝 次のステップ

1. **フロントエンドUI実装**（現在作業中）
   - ニュース一覧画面
   - スワイプ評価UI
   - 辞書管理モーダル

2. **認証実装**
   - Supabase Auth統合
   - ログイン画面

3. **定時通知**
   - Supabase Edge Functions
   - Discord/Slack Webhook

---

**バックエンドは完成！UIを実装中です 🚀**
