-- Enable pgvector extension
create extension if not exists vector;

-- Reviews table
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  movie_id integer not null,
  rating integer check (rating >= 1 and rating <= 5),
  content text,
  embedding vector(384), -- Using a 384-dim model like all-MiniLM-L6-v2 (common for free HF models)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, movie_id)
);

-- Watchlist table
create table watchlist (
  user_id text not null,
  movie_id integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, movie_id)
);

-- Movie Lists table
create table movie_lists (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  description text,
  movies integer[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Taste Profile table (for RAG)
create table user_tastes (
  user_id text primary key,
  taste_vector vector(384),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
