-- パーソナライズドニュースアプリ - データベーススキーマ
-- このSQLをSupabase SQL Editorで実行してください

-- 単語辞書テーブル
CREATE TABLE IF NOT EXISTS word_dictionary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  weight FLOAT DEFAULT 0.0,
  last_updated TIMESTAMP DEFAULT NOW(),
  CONSTRAINT word_dictionary_user_word_unique UNIQUE(user_id, word)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_word_dictionary_user_id ON word_dictionary(user_id);
CREATE INDEX IF NOT EXISTS idx_word_dictionary_weight ON word_dictionary(weight DESC);

-- 記事スコアキャッシュテーブル
CREATE TABLE IF NOT EXISTS article_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  source TEXT,
  pub_date TIMESTAMP,
  score FLOAT DEFAULT 0.0,
  is_read BOOLEAN DEFAULT FALSE,
  saved_for_later BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT article_scores_user_url_unique UNIQUE(user_id, article_url)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_article_scores_user_id ON article_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_article_scores_score ON article_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_article_scores_created_at ON article_scores(created_at DESC);

-- 評価履歴テーブル
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_url TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 4) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- 通知設定テーブル
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  morning_time TIME DEFAULT '08:00',
  noon_time TIME DEFAULT '12:00',
  evening_time TIME DEFAULT '18:00',
  enabled BOOLEAN DEFAULT TRUE,
  webhook_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (RLS) を有効化
ALTER TABLE word_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view their own dictionary" ON word_dictionary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dictionary" ON word_dictionary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dictionary" ON word_dictionary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dictionary" ON word_dictionary
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own article scores" ON article_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own article scores" ON article_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own article scores" ON article_scores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own article scores" ON article_scores
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ratings" ON ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);
