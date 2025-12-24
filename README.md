# Reachr - Smart Contact Management

A mobile app for capturing and finding contacts using voice notes, business card scanning, and AI-powered search.

## Project Structure

```
whotocall/
├── mobile/          # React Native iOS/Android app
├── backend/         # FastAPI backend server
├── data/            # JSON data storage
├── src/             # Next.js web app (original)
└── deploy.sh        # Deployment script
```

## Mobile App (React Native)

### Requirements
- Node.js >= 20
- Xcode 15+ (for iOS)
- CocoaPods

### Development
```bash
cd mobile
npm install
cd ios && pod install && cd ..
npm run ios
```

### Build for App Store
```bash
cd mobile/ios
# Ensure Node 20+ is configured in .xcode.env.local
open Reachr.xcworkspace
# Product > Archive
```

## Backend API (FastAPI)

### Local Development
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY to .env
uvicorn main:app --reload --port 8000
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/contacts` | GET | List all contacts |
| `/api/contacts` | POST | Create contact |
| `/api/contacts/{id}` | GET | Get contact by ID |
| `/api/contacts/{id}` | PUT | Update contact |
| `/api/contacts/{id}` | DELETE | Delete contact |
| `/api/search` | POST | Search contacts |
| `/api/ocr` | POST | Extract text from business card |
| `/api/extract` | POST | AI tag extraction |
| `/api/transcribe` | POST | Audio transcription |
| `/api/voice-search` | POST | Voice search |

## Production Deployment

### Server Requirements
- Ubuntu 20.04+
- Python 3.10+
- Tesseract OCR
- Nginx

### Current Deployment
- **Server**: 18.215.164.114
- **API URL**: http://18.215.164.114:8080
- **Internal Port**: 5002
- **App Directory**: /mnt/data/reachr/

### Deploy Script
```bash
# From project root
./deploy.sh
```

### Manual Deployment Steps

1. **SSH into server**
```bash
ssh ubuntu@18.215.164.114
```

2. **Copy files**
```bash
scp backend/main.py backend/requirements.txt ubuntu@18.215.164.114:/mnt/data/reachr/
scp data/contacts.json ubuntu@18.215.164.114:/mnt/data/reachr/data/
```

3. **Install dependencies**
```bash
cd /mnt/data/reachr
source venv/bin/activate
pip install -r requirements.txt
```

4. **Restart service**
```bash
sudo systemctl restart reachr
```

### Server Management Commands

```bash
# Check status
sudo systemctl status reachr

# View logs
sudo journalctl -u reachr -f

# Restart service
sudo systemctl restart reachr

# Stop service
sudo systemctl stop reachr

# Start service
sudo systemctl start reachr
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
        proxy_set_header X-Forwarded-Proto $scheme;

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
RestartSec=5
Environment=PATH=/mnt/data/reachr/venv/bin:/usr/bin
EnvironmentFile=/mnt/data/reachr/.env

[Install]
WantedBy=multi-user.target
```

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Mobile App
Update API base URL in `mobile/src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://18.215.164.114:8080';
```

## Features

- **Voice Notes**: Record meeting context, transcribed via OpenAI Whisper
- **Business Card Scanning**: OCR extraction via Tesseract
- **AI Tag Extraction**: Automatic tagging using GPT-4o-mini
- **Smart Search**: Find contacts by name, company, tags, or context
- **Priority System**: Rank contacts by importance

## Tech Stack

- **Mobile**: React Native 0.83, TypeScript
- **Backend**: FastAPI, Python 3.12
- **AI**: OpenAI GPT-4o-mini, Whisper
- **OCR**: Tesseract
- **Storage**: JSON file (contacts.json)
- **Server**: Ubuntu, Nginx, Systemd
