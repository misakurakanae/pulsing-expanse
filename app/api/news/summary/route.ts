import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        const supabase = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, url } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'OpenAI API key not configured',
                mock: true,
                summary: '【デモ】APIキーが設定されていません。本来はここにAIによる要約が表示されます。\n1. 記事の主要なポイントを3行で要約します。\n2. 忙しいビジネスパーソンに最適です。\n3. 重要な情報を見逃しません。'
            });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'あなたは優秀なニュース編集者です。提供されたニュース記事のタイトルとURLから、その記事の内容を推測し、3つの箇条書き（各30文字程度）で要約してください。日本語で出力してください。'
                    },
                    {
                        role: 'user',
                        content: `タイトル: ${title}\nURL: ${url}`
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const summary = data.choices[0].message.content;

        return NextResponse.json({ success: true, summary });

    } catch (error) {
        console.error('Summary generation error:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
