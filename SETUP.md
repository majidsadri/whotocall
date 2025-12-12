# whotocall - Setup Guide

## Quick Start

### 1. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
```
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run this schema:

```sql
-- Enable vector extension
create extension if not exists vector;

-- Contacts table
create table contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  name text not null,
  email text,
  phone text,
  company text,
  role text,
  linkedin_url text,
  card_image_url text,
  location text,
  industry text,
  event_type text,
  met_date date,
  tags text[] default '{}',
  raw_context text,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Semantic search function
create or replace function search_contacts(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 20
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
    c.id, c.name, c.email, c.phone, c.company, c.role,
    c.linkedin_url, c.location, c.industry, c.event_type,
    c.met_date, c.tags, c.raw_context, c.created_at,
    1 - (c.embedding <=> query_embedding) as similarity
  from contacts c
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Indexes
create index contacts_embedding_idx on contacts
using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index contacts_industry_idx on contacts(industry);
create index contacts_location_idx on contacts(location);
```

4. Copy your project URL and anon key from Settings > API

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### Add Contact
1. **Scan Card** - Take a photo or upload a business card image
2. **Voice Notes** - Record or type how you met this person
3. **LinkedIn** - Paste their LinkedIn URL
4. **Auto-Tagging** - AI extracts location, industry, role, etc.

### Find Contact
- Natural language search: "real estate guy from Arizona last month"
- Semantic matching finds related contacts even with different words
- Filter by industry, location, timeframe

---

## LinkedIn Integration Options

### Option 1: Manual URL (Default)
- Users paste LinkedIn profile URLs when adding contacts
- URLs are stored and displayed as clickable links

### Option 2: Proxycurl API (Recommended for enrichment)
1. Get API key from [proxycurl.com](https://proxycurl.com)
2. Add to `.env.local`:
   ```
   PROXYCURL_API_KEY=your-key
   ```
3. Uncomment Proxycurl code in `/src/app/api/linkedin/route.ts`

### Option 3: LinkedIn OAuth (For import)
1. Create app at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Add to `.env.local`:
   ```
   LINKEDIN_CLIENT_ID=your-client-id
   LINKEDIN_CLIENT_SECRET=your-secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contacts` | GET | List contacts |
| `/api/contacts` | POST | Create contact |
| `/api/search` | POST | Semantic search |
| `/api/extract` | POST | Extract tags from text |
| `/api/ocr` | POST | Extract text from card image |
| `/api/linkedin` | POST | Validate LinkedIn URL |

---

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-4o-mini, Whisper, Embeddings
- **Icons**: Lucide React
