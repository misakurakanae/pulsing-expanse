-- 指定されたユーザーに管理者権限(adminロール)を付与する
-- Email: rockimpokiller.kimattendaro.jk@gmail.com

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
) 
WHERE email = 'rockimpokiller.kimattendaro.jk@gmail.com';

-- 確認用クエリ
SELECT email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'rockimpokiller.kimattendaro.jk@gmail.com';
