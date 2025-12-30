# Reachr - Smart Contact Management

A React Native mobile app for capturing and managing professional contacts with AI-powered tagging, voice notes, business card scanning, and digital business card sharing.

## Table of Contents

- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Mobile App](#mobile-app)
- [Backend API](#backend-api)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Frontend Components](#frontend-components)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
whotocall/
├── mobile/              # React Native iOS/Android app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── screens/     # Main app screens
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client
│   │   ├── navigation/  # Tab navigation
│   │   └── types/       # TypeScript interfaces
│   ├── ios/             # Native iOS project
│   └── android/         # Native Android project
├── backend/             # FastAPI backend server
├── data/                # JSON data storage
├── src/                 # Next.js web app (legacy)
└── deploy.sh            # Deployment script
```

---

## Quick Start

### Prerequisites

- **Node.js 20+** (Required for React Native 0.83)
- **Python 3.10+** (for backend)
- **Xcode 15+** with iOS Simulator
- **CocoaPods** for iOS dependencies

### 1. Clone and Install

```bash
git clone <repo-url>
cd whotocall

# Mobile app
cd mobile
npm install
cd ios && bundle install && bundle exec pod install && cd ..

# Backend
cd ../backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```env
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=your-claude-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

**Mobile** (`mobile/src/lib/supabase.ts`):
```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Run the App

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Start Metro bundler (requires Node 20+)
cd mobile
export PATH="/opt/homebrew/Cellar/node@20/20.19.2/bin:$PATH"
node ./node_modules/react-native/cli.js start

# Terminal 3: Run iOS app
cd mobile
npx react-native run-ios --simulator="iPhone 16 Pro"
```

---

## Mobile App

### Running on iOS Simulator

```bash
cd mobile

# Step 1: Start Metro bundler (requires Node 20+)
export PATH="/opt/homebrew/Cellar/node@20/20.19.2/bin:$PATH"
node ./node_modules/react-native/cli.js start

# Step 2: In new terminal, build and run
npx react-native run-ios --simulator="iPhone 16 Pro"
```

### Simulator Controls

- **Reload app**: Press `R` or `Cmd+R`
- **Open Dev Menu**: `Cmd+D`
- **Open Debugger**: `Cmd+Shift+D`

### Common Issues

**"No script URL provided" error:**
Metro bundler isn't running. Start it first.

**"configs.toReversed is not a function" error:**
Wrong Node version. React Native 0.83 requires Node 20+.

```bash
# Check version
node --version

# Use Node 20 if installed via Homebrew
export PATH="/opt/homebrew/Cellar/node@20/20.19.2/bin:$PATH"
```

### Build for App Store

```bash
cd mobile/ios
open Reachr.xcworkspace
# Product > Archive
```

---

## Backend API

### Architecture

- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API for tag extraction, OpenAI Whisper for transcription
- **OCR**: Tesseract for business card scanning

### Core Features

| Feature | Description |
|---------|-------------|
| Voice Transcription | Whisper API converts voice notes to text |
| OCR | Extract text from business card photos |
| AI Tag Extraction | Claude analyzes context to generate searchable tags |
| Semantic Search | AI-powered contact search by natural language |
| LinkedIn Enrichment | Web search to find LinkedIn profiles |
| Digital Business Cards | Shareable card pages with QR codes |

### Local Development

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add API keys to .env
uvicorn main:app --reload --port 8000
```

---

## Database Setup

### Supabase Configuration

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run this SQL in SQL Editor:

```sql
-- Enable vector extension
create extension if not exists vector;

-- Contacts table
create table contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  name text not null,
  email text,
  phone text,
  company text,
  role text,
  linkedin_url text,
  location text,
  industry text,
  met_date date,
  meeting_location text,
  priority integer default 50,
  tags text[] default '{}',
  raw_context text,
  enrichment jsonb,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Business cards table
create table business_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) unique not null,
  full_name varchar(255) not null,
  email varchar(255),
  phone varchar(50),
  title varchar(255),
  company varchar(255),
  website varchar(500),
  linkedin_url varchar(500),
  avatar_url varchar(1000),
  template_id varchar(50) default 'classic',
  accent_color varchar(7) default '#7C3AED',
  share_slug varchar(100) unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User preferences table
create table user_preferences (
  user_id uuid references auth.users(id) primary key,
  industry varchar(100),
  custom_tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Semantic search function
create or replace function search_contacts(
  query_embedding vector(1536),
  user_uuid uuid,
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
    c.linkedin_url, c.location, c.industry,
    c.met_date, c.tags, c.raw_context, c.created_at,
    1 - (c.embedding <=> query_embedding) as similarity
  from contacts c
  where c.user_id = user_uuid
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Indexes
create index contacts_user_id_idx on contacts(user_id);
create index contacts_embedding_idx on contacts
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index contacts_industry_idx on contacts(industry);
create index business_cards_share_slug_idx on business_cards(share_slug);
```

4. Copy project URL and keys from Settings > API

---

## API Reference

All endpoints require authentication via Supabase JWT token in `Authorization: Bearer <token>` header.

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts` | Create new contact |
| `GET` | `/api/contacts/:id` | Get contact by ID |
| `PUT` | `/api/contacts/:id` | Update contact |
| `DELETE` | `/api/contacts/:id` | Delete contact |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/search` | Semantic search contacts |
| `POST` | `/api/voice-search` | AI agent search with natural language |

**Example voice search:**
```json
POST /api/voice-search
{
  "query": "Find me the architect I met at the tech conference",
  "useAgent": true
}
```

### AI Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transcribe` | Convert audio to text (multipart) |
| `POST` | `/api/ocr` | Extract text from image (multipart) |
| `POST` | `/api/extract` | Extract tags from context |
| `POST` | `/api/enrich` | Enrich contact with web data |
| `POST` | `/api/websearch` | Search web for LinkedIn profiles |

**Example tag extraction:**
```json
POST /api/extract
{
  "context": "Met John at AWS conference, he's a solutions architect...",
  "cardText": "John Smith\nSolutions Architect\nAmazon Web Services"
}

Response:
{
  "name": "John Smith",
  "role": "Solutions Architect",
  "company": "Amazon Web Services",
  "industry": "Technology",
  "tags": ["aws", "cloud", "architect", "tech conference"]
}
```

### Business Cards

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/business-card` | Get user's business card |
| `POST` | `/api/business-card` | Create/update business card |
| `POST` | `/api/business-card/avatar` | Upload avatar image |
| `GET` | `/api/business-card/vcard` | Download vCard file |
| `GET` | `/card/:slug` | Public card view (no auth) |

### User & Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/me` | Get current user info |
| `GET` | `/api/preferences` | Get user preferences |
| `PUT` | `/api/preferences` | Update preferences |
| `GET` | `/api/tags` | Get all tags with counts |
| `POST` | `/api/tags` | Add custom tag |
| `DELETE` | `/api/tags/:tag` | Delete custom tag |
| `GET` | `/api/industries` | List available industries |

---

## Frontend Components

### Screens

| Screen | Purpose |
|--------|---------|
| `AddContactScreen` | Voice notes, business card scan, meeting details, AI tag extraction |
| `FindContactScreen` | Voice search, industry filter, tag cloud, contact results |
| `MeScreen` | Digital business card editor with templates and sharing |

### Key Components

| Component | Purpose |
|-----------|---------|
| `RecordButton` | Animated mic button with pulse effect |
| `ContactCard` | Contact display with avatar, tags, actions |
| `TagBadge` | Colored tag pill with variants |
| `BusinessCardPreview` | Card renderer with 3 templates |
| `ShareModal` | QR code, SMS, Email, Copy link, vCard |
| `QRCodeDisplay` | QR code generator |
| `TemplateSelector` | Horizontal template picker |
| `PrioritySlider` | Low/Medium/High slider |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAudioRecorder` | Record audio, manage state, timer |
| `useBusinessCard` | Fetch/save business card, avatar upload |
| `useImagePicker` | Camera and gallery selection |
| `useLocation` | GPS coordinates + reverse geocode |

### Navigation

Tab-based navigation with deep linking:
- **Find** - Search contacts (home)
- **Add** - Create new contact
- **Me** - Digital business card

Deep link URL scheme: `reachr://add-contact?name=John&email=john@example.com`

---

## Production Deployment

### Server Details

- **Server**: AWS EC2 (18.215.164.114)
- **API URL**: http://18.215.164.114:8080
- **Internal Port**: 5002
- **App Directory**: /mnt/data/reachr/

### Deploy Script

```bash
./deploy.sh
```

### Manual Deployment

```bash
# SSH into server
ssh ubuntu@18.215.164.114

# Copy files
scp backend/main.py ubuntu@18.215.164.114:/mnt/data/reachr/

# Install dependencies
cd /mnt/data/reachr
source venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl restart reachr
```

### Server Management

```bash
# Check status
sudo systemctl status reachr

# View logs
sudo journalctl -u reachr -f

# Restart service
sudo systemctl restart reachr
```

### Nginx Configuration

Location: `/etc/nginx/sites-available/reachr-api`

```nginx
server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Accept, Origin, Authorization' always;
    }

    client_max_body_size 20M;
}
```

### Systemd Service

Location: `/etc/systemd/system/reachr.service`

```ini
[Unit]
Description=Reachr API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/mnt/data/reachr
ExecStart=/mnt/data/reachr/venv/bin/uvicorn main:app --host 0.0.0.0 --port 5002
Restart=always
EnvironmentFile=/mnt/data/reachr/.env

[Install]
WantedBy=multi-user.target
```

---

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear watchman
watchman watch-del-all
```

### iOS Build Issues

```bash
# Clean Xcode build
cd ios && xcodebuild clean && cd ..

# Reinstall pods
cd ios && rm -rf Pods Podfile.lock && bundle exec pod install && cd ..
```

### Simulator Issues

```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 16 Pro"

# Erase simulator (fresh start)
xcrun simctl erase "iPhone 16 Pro"
```

### Backend Issues

```bash
# Check if service is running
sudo systemctl status reachr

# View recent logs
sudo journalctl -u reachr -n 100

# Test API locally
curl http://localhost:8000/
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native 0.83, TypeScript |
| Backend | FastAPI, Python 3.12 |
| Database | Supabase (PostgreSQL + pgvector) |
| AI | Claude API, OpenAI Whisper |
| OCR | Tesseract |
| Auth | Supabase Auth (LinkedIn OAuth) |
| Server | AWS EC2, Ubuntu, Nginx, Systemd |

---

## License

Proprietary - All rights reserved.
