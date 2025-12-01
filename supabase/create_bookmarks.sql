-- 既存の関数を削除（念のため）
DROP FUNCTION IF EXISTS toggle_bookmark;

-- 関数の作成
CREATE OR REPLACE FUNCTION toggle_bookmark(
  p_article_url text,
  p_article_title text,
  p_article_source text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  -- 現在のユーザーIDを取得
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ブックマークが存在するか確認
  SELECT EXISTS (
    SELECT 1 FROM bookmarks 
    WHERE user_id = v_user_id AND article_url = p_article_url
  ) INTO v_exists;

  IF v_exists THEN
    -- 存在する場合は削除
    DELETE FROM bookmarks 
    WHERE user_id = v_user_id AND article_url = p_article_url;
    RETURN false; -- 削除されたことを示す
  ELSE
    -- 存在しない場合は追加
    INSERT INTO bookmarks (user_id, article_url, article_title, article_source)
    VALUES (v_user_id, p_article_url, p_article_title, p_article_source);
    RETURN true; -- 追加されたことを示す
  END IF;
END;
$$;

-- 権限の付与（これが重要です！）
GRANT EXECUTE ON FUNCTION toggle_bookmark TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_bookmark TO anon;
GRANT EXECUTE ON FUNCTION toggle_bookmark TO service_role;

-- キャッシュのリロード
NOTIFY pgrst, 'reload schema';
