import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL to create tables (run this in Supabase SQL editor)
export const SCHEMA_SQL = `
-- Enable vector extension
create extension if not exists vector;

-- Contacts table
create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  name text not null,
  email text,
  phone text,
  company text,
  role text,
  linkedin_url text,
  card_image_url text,

  -- Tags
  location text,
  industry text,
  event_type text,
  met_date date,
  tags text[] default '{}',

  -- Context
  raw_context text,

  -- Vector for semantic search
  embedding vector(1536),

  created_at timestamptz default now()
);

-- Index for vector similarity search
create index if not exists contacts_embedding_idx
on contacts using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Index for common queries
create index if not exists contacts_industry_idx on contacts(industry);
create index if not exists contacts_location_idx on contacts(location);
create index if not exists contacts_tags_idx on contacts using gin(tags);

-- Function for semantic search
create or replace function search_contacts(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  company text,
  role text,
  linkedin_url text,
  location text,
  industry text,
  event_type text,
  met_date date,
  tags text[],
  raw_context text,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company,
    c.role,
    c.linkedin_url,
    c.location,
    c.industry,
    c.event_type,
    c.met_date,
    c.tags,
    c.raw_context,
    c.created_at,
    1 - (c.embedding <=> query_embedding) as similarity
  from contacts c
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
`;
