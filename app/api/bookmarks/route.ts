import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

        // Create Supabase client with auth token
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's bookmarks using RPC or direct query
        const { data: bookmarks, error } = await supabase
            .rpc('get_user_bookmarks', { p_user_id: user.id })
            .then(result => {
                if (result.error) {
                    // Fallback to direct query if RPC doesn't exist
                    return supabase
                        .from('bookmarks')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });
                }
                return result;
            });

        if (error) {
            console.error('Bookmarks fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch bookmarks', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            bookmarks: bookmarks || [],
            total: bookmarks?.length || 0,
        });
    } catch (error: any) {
        console.error('Bookmarks API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

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

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { articleUrl, title, source } = body;

        if (!articleUrl) {
            return NextResponse.json(
                { success: false, error: 'Article URL is required' },
                { status: 400 }
            );
        }

        console.log('Inserting bookmark for user:', user.id, 'URL:', articleUrl);

        // Insert bookmark with explicit schema reference
        const { data: bookmark, error } = await supabase
            .from('bookmarks')
            .insert({
                user_id: user.id,
                article_url: articleUrl,
                article_title: title,
                article_source: source,
            })
            .select()
            .single();

        if (error) {
            console.error('Bookmark insert error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create bookmark', details: error.message },
                { status: 500 }
            );
        }

        console.log('Bookmark created successfully:', bookmark);

        return NextResponse.json({
            success: true,
            bookmark,
        });
    } catch (error: any) {
        console.error('Bookmarks API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'No token provided' },
                { status: 401 }
            );
        }
        const token = authHeader.split(' ')[1];

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const articleUrl = searchParams.get('articleUrl');

        if (!articleUrl) {
            return NextResponse.json(
                { success: false, error: 'Article URL is required' },
                { status: 400 }
            );
        }

        // Delete bookmark
        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('article_url', articleUrl);

        if (error) {
            console.error('Bookmark delete error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to delete bookmark', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error: any) {
        console.error('Bookmarks API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
