import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'No token provided' },
                { status: 401 }
            );
        }
        const token = authHeader.split(' ')[1];

        const supabase = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get trending articles from the view
        const { data: trending, error } = await supabase
            .from('trending_articles')
            .select('*')
            .limit(3);

        if (error) {
            console.error('Trending fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch trending articles' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            trending: trending || [],
        });
    } catch (error) {
        console.error('Trending API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Track article view/interaction
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'No token provided' },
                { status: 401 }
            );
        }
        const token = authHeader.split(' ')[1];

        const supabase = createAuthenticatedClient(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { articleUrl, articleTitle, viewType } = body;

        if (!articleUrl || !viewType) {
            return NextResponse.json(
                { success: false, error: 'Article URL and view type are required' },
                { status: 400 }
            );
        }

        if (!['click', 'bookmark'].includes(viewType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid view type' },
                { status: 400 }
            );
        }

        // Insert view record
        const { error } = await supabase
            .from('article_views')
            .insert({
                article_url: articleUrl,
                article_title: articleTitle,
                user_id: user.id,
                view_type: viewType,
            });

        if (error) {
            console.error('View tracking error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to track view' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Trending API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
