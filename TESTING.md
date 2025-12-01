# 📋 動作確認の手順

## 🔧 セットアップ（初回のみ）

### 1. Node.jsインストール確認
```powershell
node --version
```
v18以上が表示されればOK。なければ https://nodejs.org/ からインストール

### 2. パッケージインストール
```powershell
cd c:\Users\PCUser\.gemini\antigravity\playground\pulsing-expanse
npm install
```
待機時間: 1-3分

### 3. Supabaseプロジェクト作成

1. https://supabase.com にアクセス
2. 「New Project」クリック
3. プロジェクト名入力（例: my-news-app）
4. データベースパスワード設定
5. リージョン: **Northeast Asia (Tokyo)** を選択
6. 「Create new project」クリック
7. 作成完了まで待機（2-3分）

### 4. データベーススキーマ作成

1. Supabaseダッシュボード左メニューから「SQL Editor」をクリック
2. 以下のファイルを開く: `supabase/schema.sql`
3. 内容をすべてコピー
4. SQL Editorに貼り付け
5. 「Run」ボタンをクリック
6. 成功メッセージが出ればOK

### 5. 環境変数設定

1. Supabaseダッシュボード → 「Settings」→「API」を開く
2. 以下をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhb...長い文字列`

3. プロジェクトフォルダで`.env.local`を作成:
```powershell
copy .env.example .env.local
```

4. `.env.local`をメモ帳で開いて編集:
```env
NEXT_PUBLIC_SUPABASE_URL=コピーしたProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=コピーしたanon public key
```

5. 保存

---

## 🚀 起動

```powershell
npm run dev
```

以下が表示されれば成功:
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

**ブラウザで開く**: http://localhost:3000

---

## ✅ 動作確認

### テスト1: ログイン
1. ブラウザで http://localhost:3000 を開く
2. 「新規登録」をクリック
3. メールアドレスとパスワード（6文字以上）を入力
4. 「新規登録」ボタンをクリック
5. 確認メールが届くが、**テストなので無視してOK**
6. Supabaseダッシュボード → 「Authentication」→「Users」を開く
7. 作成したユーザーの「Confirm email」をクリック
8. 再度ログイン画面に戻ってログイン

### テスト2: ニュース表示
1. ログイン成功後、ニュース一覧が表示される
2. **スコア順**に並んでいることを確認
3. ソース名、スコア、時刻が表示されている

### テスト3: 評価機能
1. 1つの記事の「2」ボタンをクリック
2. アラートが表示される: 「評価 2 を記録しました！X個の単語を学習」
3. 「OK」をクリック
4. 「🔄 ニュースを更新」をクリック
5. スコアが変わっていることを確認

### テスト4: 学習の確認
1. 同じ記事をもう一度「4」で評価
2. 「🔄 ニュースを更新」をクリック  
3. その記事のスコアが上がって、上位に移動する

---

## 🎯 確認できること

- ✅ ニュースが取得できる
- ✅ スコア順に表示される
- ✅ 評価すると単語の重みが更新される
- ✅ 評価後、スコアが変わる
- ✅ 辞書の単語数が増える

---

## ❌ トラブルシューティング

### 「Unauthorized」エラー
- `.env.local`のURLとキーが正しいか確認
- サーバーを再起動: Ctrl+C → `npm run dev`

### ニュースが表示されない
- インターネット接続を確認
- RSSフィードが取得できないことがある（時間を置いて再試行）

### 型エラーが大量に出る
- `npm install`を実行したか確認
- `node_modules`フォルダがあるか確認

### kuromoji辞書エラー
- 現在は簡易実装（後で解決予定）
- 形態素解析が動かない場合はエラーが出るが、基本機能は動作

---

**準備完了！動作確認を始めてください 🎉**
