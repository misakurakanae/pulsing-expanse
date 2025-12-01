-- Create article_views table for tracking article interactions
CREATE TABLE IF NOT EXISTS article_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_url TEXT NOT NULL,
  article_title TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  view_type TEXT NOT NULL CHECK (view_type IN ('click', 'bookmark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_views_url ON article_views(article_url);
CREATE INDEX IF NOT EXISTS idx_article_views_created_at ON article_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_views_type ON article_views(view_type);
CREATE INDEX IF NOT EXISTS idx_article_views_url_type ON article_views(article_url, view_type);

-- Create a view for trending articles (last 7 days)
CREATE OR REPLACE VIEW trending_articles AS
SELECT 
  article_url,
  article_title,
  COUNT(*) as total_interactions,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN view_type = 'click' THEN 1 ELSE 0 END) as clicks,
  SUM(CASE WHEN view_type = 'bookmark' THEN 1 ELSE 0 END) as bookmarks,
  MAX(created_at) as last_interaction
FROM article_views
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY article_url, article_title
ORDER BY total_interactions DESC, unique_users DESC;

-- Enable Row Level Security
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Users can view all article views (for trending calculations)
CREATE POLICY "Anyone can view article stats"
  ON article_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own views
CREATE POLICY "Users can create own views"
  ON article_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
