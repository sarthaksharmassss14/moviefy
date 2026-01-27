import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = (supabaseToken?: string) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: supabaseToken ? `Bearer ${supabaseToken}` : "",
            },
        },
    });
};

export type Review = {
    id: string;
    user_id: string;
    movie_id: number;
    rating: number;
    content: string;
    created_at: string;
};

export type Watchlist = {
    user_id: string;
    movie_id: number;
    created_at: string;
};

export type MovieList = {
    id: string;
    user_id: string;
    name: string;
    description: string;
    movies: number[];
    is_public: boolean;
    created_at: string;
};
