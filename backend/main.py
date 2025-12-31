import os
import json
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import io
import openai
import jwt
import httpx

load_dotenv()

# Supabase REST API configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dsljfcswyktyatennjev.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

app = FastAPI(title="Reachr API", version="1.0.0")

# CORS middleware for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory - use 'data' subdirectory relative to this file
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Supabase JWT secret (get from Supabase dashboard > Settings > API > JWT Secret)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract user_id from Supabase JWT token"""
    if not authorization:
        return None

    try:
        # Remove 'Bearer ' prefix
        token = authorization.replace("Bearer ", "")

        # Decode JWT (without verification if no secret, with verification if secret exists)
        if SUPABASE_JWT_SECRET:
            decoded = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        else:
            # Decode without verification (for development)
            decoded = jwt.decode(token, options={"verify_signature": False})

        return decoded.get("sub")  # 'sub' contains the user ID
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return None


def get_user_data_file(user_id: Optional[str]) -> str:
    """Get the data file path for a specific user"""
    if user_id:
        # Per-user contacts file
        user_dir = os.path.join(DATA_DIR, "users", user_id)
        os.makedirs(user_dir, exist_ok=True)
        return os.path.join(user_dir, "contacts.json")
    else:
        # Anonymous/shared contacts (legacy)
        return os.path.join(DATA_DIR, "contacts.json")

# OpenAI client
openai_client = None
if os.getenv("OPENAI_API_KEY"):
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# Models
class Contact(BaseModel):
    id: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    tags: Optional[List[str]] = []
    raw_context: Optional[str] = None
    met_date: Optional[str] = None
    meeting_location: Optional[str] = None
    priority: Optional[int] = 50
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    tags: Optional[List[str]] = []
    raw_context: Optional[str] = None
    met_date: Optional[str] = None
    meeting_location: Optional[str] = None
    priority: Optional[int] = 50


class SearchRequest(BaseModel):
    query: str


class ExtractRequest(BaseModel):
    context: str
    cardText: Optional[str] = None


class UserPreferences(BaseModel):
    industry: Optional[str] = None
    custom_tags: Optional[List[str]] = []
    suggested_tags: Optional[List[str]] = []


class BusinessCard(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None
    template_id: Optional[str] = "classic"
    accent_color: Optional[str] = "#7C3AED"
    share_slug: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class BusinessCardInput(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None
    template_id: Optional[str] = "classic"
    accent_color: Optional[str] = "#7C3AED"


# Industry-specific default tags
INDUSTRY_DEFAULT_TAGS = {
    "architecture": [
        "architect", "designer", "principal", "project manager", "urban planner",
        "landscape", "interior design", "sustainable", "LEED", "BIM", "CAD",
        "residential", "commercial", "mixed-use", "historic preservation", "permit"
    ],
    "automotive": [
        "dealer", "sales", "service manager", "mechanic", "parts", "fleet",
        "manufacturer", "OEM", "aftermarket", "electric vehicle", "EV", "hybrid",
        "lease", "finance", "warranty", "collision", "body shop"
    ],
    "civil_engineering": [
        "engineer", "PE", "project manager", "surveyor", "inspector", "contractor",
        "structural", "geotechnical", "environmental", "transportation", "water",
        "wastewater", "stormwater", "DOT", "municipal", "infrastructure"
    ],
    "construction": [
        "contractor", "GC", "subcontractor", "project manager", "superintendent",
        "estimator", "foreman", "developer", "builder", "architect", "engineer",
        "residential", "commercial", "industrial", "renovation", "OSHA"
    ],
    "consulting": [
        "consultant", "partner", "analyst", "advisor", "strategy", "management",
        "operations", "IT consulting", "HR consulting", "change management",
        "business development", "client"
    ],
    "education": [
        "teacher", "professor", "principal", "dean", "administrator", "coach",
        "tutor", "curriculum", "K-12", "higher ed", "university", "college",
        "online learning", "EdTech", "training", "student"
    ],
    "energy": [
        "engineer", "project manager", "analyst", "utility", "solar", "wind",
        "renewable", "oil", "gas", "nuclear", "grid", "power plant", "sustainability",
        "energy efficiency", "EV charging", "battery storage"
    ],
    "entertainment": [
        "producer", "director", "actor", "writer", "agent", "manager", "talent",
        "studio", "network", "streaming", "music", "film", "TV", "gaming",
        "live events", "venue", "promoter"
    ],
    "finance": [
        "banker", "investor", "analyst", "trader", "portfolio manager", "CFO",
        "accountant", "wealth manager", "private equity", "hedge fund", "VC",
        "angel investor", "fintech", "crypto", "insurance", "lending"
    ],
    "food_beverage": [
        "chef", "owner", "manager", "sommelier", "bartender", "caterer",
        "food service", "distributor", "supplier", "franchise", "fast casual",
        "fine dining", "brewery", "winery", "distillery", "food truck"
    ],
    "government": [
        "official", "administrator", "analyst", "director", "commissioner",
        "council member", "mayor", "senator", "representative", "staffer",
        "policy", "public affairs", "regulatory", "compliance", "grants"
    ],
    "healthcare": [
        "doctor", "physician", "nurse", "surgeon", "specialist", "hospital",
        "clinic", "pharma", "biotech", "medical device", "health tech",
        "administrator", "researcher", "patient advocate", "insurance"
    ],
    "hospitality": [
        "GM", "hotel manager", "front desk", "concierge", "housekeeping",
        "F&B director", "event planner", "revenue manager", "franchise",
        "boutique", "resort", "vacation rental", "Airbnb", "timeshare"
    ],
    "insurance": [
        "agent", "broker", "underwriter", "adjuster", "actuary", "claims",
        "risk manager", "commercial", "personal lines", "life", "health",
        "property", "casualty", "reinsurance", "InsurTech"
    ],
    "legal": [
        "attorney", "lawyer", "partner", "associate", "paralegal", "judge",
        "corporate law", "litigation", "IP", "contract", "M&A", "compliance",
        "in-house counsel", "legal tech"
    ],
    "logistics": [
        "logistics manager", "supply chain", "warehouse", "distribution",
        "freight", "shipping", "carrier", "3PL", "fulfillment", "inventory",
        "procurement", "sourcing", "import", "export", "customs"
    ],
    "manufacturing": [
        "plant manager", "operations", "quality", "engineer", "production",
        "lean", "six sigma", "supply chain", "procurement", "maintenance",
        "automation", "robotics", "CNC", "assembly", "OEM"
    ],
    "marketing": [
        "marketer", "brand manager", "CMO", "agency", "creative director",
        "content creator", "SEO", "social media", "PR", "influencer",
        "copywriter", "growth hacker", "digital marketing", "analytics"
    ],
    "media": [
        "journalist", "editor", "reporter", "producer", "publisher", "writer",
        "content", "digital media", "broadcast", "print", "podcast", "blogger",
        "social media", "communications", "PR"
    ],
    "medicine": [
        "physician", "MD", "DO", "specialist", "surgeon", "primary care",
        "pediatrician", "cardiologist", "oncologist", "orthopedic", "neurologist",
        "psychiatrist", "dermatologist", "radiologist", "anesthesiologist", "resident"
    ],
    "military": [
        "veteran", "officer", "enlisted", "contractor", "defense", "DOD",
        "Army", "Navy", "Air Force", "Marines", "Coast Guard", "National Guard",
        "security clearance", "aerospace", "intelligence"
    ],
    "nonprofit": [
        "executive director", "development", "fundraiser", "program manager",
        "volunteer", "board member", "grant writer", "donor", "foundation",
        "charity", "NGO", "advocacy", "community", "social impact"
    ],
    "pharmaceutical": [
        "pharma rep", "medical affairs", "clinical", "R&D", "regulatory",
        "FDA", "biotech", "drug development", "clinical trials", "medical science",
        "commercialization", "market access", "pricing", "generics"
    ],
    "real_estate": [
        "buyer", "seller", "investor", "broker", "agent", "property manager",
        "landlord", "tenant", "developer", "appraiser", "mortgage", "lender",
        "commercial", "residential", "industrial", "retail", "land", "flip",
        "rental", "wholesale", "REIT", "hard money", "title company"
    ],
    "restaurant": [
        "owner", "chef", "manager", "server", "bartender", "host", "sommelier",
        "franchise", "fast food", "casual dining", "fine dining", "catering",
        "food truck", "delivery", "ghost kitchen", "bar"
    ],
    "retail": [
        "store manager", "buyer", "merchandiser", "district manager", "regional",
        "e-commerce", "omnichannel", "inventory", "loss prevention", "visual",
        "customer service", "franchise", "DTC", "wholesale"
    ],
    "sales": [
        "sales rep", "account executive", "SDR", "BDR", "sales manager",
        "VP sales", "enterprise", "SMB", "inside sales", "field sales",
        "solution engineer", "sales ops", "quota", "pipeline"
    ],
    "sports": [
        "coach", "trainer", "athlete", "agent", "team", "league", "franchise",
        "fitness", "gym owner", "personal trainer", "physical therapist",
        "sports medicine", "equipment", "apparel", "sponsorship"
    ],
    "technology": [
        "developer", "engineer", "founder", "CEO", "CTO", "product manager",
        "designer", "startup", "investor", "VC", "SaaS", "AI", "machine learning",
        "mobile", "web", "cloud", "DevOps", "data scientist", "advisor"
    ],
    "telecom": [
        "engineer", "sales", "network", "wireless", "fiber", "5G", "carrier",
        "ISP", "VoIP", "unified communications", "infrastructure", "tower",
        "spectrum", "regulatory", "enterprise"
    ],
    "transportation": [
        "driver", "dispatcher", "fleet manager", "logistics", "trucking",
        "shipping", "freight", "rail", "aviation", "maritime", "public transit",
        "ride share", "delivery", "last mile", "DOT"
    ],
    "travel": [
        "travel agent", "tour operator", "hotel", "airline", "cruise",
        "destination", "corporate travel", "leisure", "adventure", "luxury",
        "booking", "OTA", "DMC", "MICE", "tourism board"
    ],
    "general": [
        "networking", "conference", "referral", "LinkedIn", "introduction",
        "follow up", "potential client", "partner", "mentor", "advisor",
        "investor", "hiring", "collaboration", "vendor", "supplier"
    ]
}


# Helper functions
def load_contacts(user_id: Optional[str] = None) -> List[dict]:
    """Load contacts from JSON file for a specific user"""
    data_file = get_user_data_file(user_id)
    try:
        if os.path.exists(data_file):
            with open(data_file, "r") as f:
                data = json.load(f)
                return data.get("contacts", [])
    except Exception as e:
        print(f"Error loading contacts for user {user_id}: {e}")
    return []


def save_contacts(contacts: List[dict], user_id: Optional[str] = None):
    """Save contacts to JSON file for a specific user"""
    data_file = get_user_data_file(user_id)
    os.makedirs(os.path.dirname(data_file), exist_ok=True)
    with open(data_file, "w") as f:
        json.dump({"contacts": contacts}, f, indent=2)


def get_user_preferences_file(user_id: str) -> str:
    """Get the preferences file path for a specific user"""
    user_dir = os.path.join(DATA_DIR, "users", user_id)
    os.makedirs(user_dir, exist_ok=True)
    return os.path.join(user_dir, "preferences.json")


def load_user_preferences(user_id: str) -> dict:
    """Load user preferences from JSON file"""
    prefs_file = get_user_preferences_file(user_id)
    try:
        if os.path.exists(prefs_file):
            with open(prefs_file, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading preferences for user {user_id}: {e}")
    return {"industry": None, "custom_tags": [], "suggested_tags": []}


def save_user_preferences(user_id: str, preferences: dict):
    """Save user preferences to JSON file"""
    prefs_file = get_user_preferences_file(user_id)
    os.makedirs(os.path.dirname(prefs_file), exist_ok=True)
    with open(prefs_file, "w") as f:
        json.dump(preferences, f, indent=2)


def get_business_card_file(user_id: str) -> str:
    """Get the business card file path for a specific user"""
    user_dir = os.path.join(DATA_DIR, "users", user_id)
    os.makedirs(user_dir, exist_ok=True)
    return os.path.join(user_dir, "business_card.json")


def load_business_card(user_id: str) -> Optional[dict]:
    """Load business card from JSON file for a specific user"""
    card_file = get_business_card_file(user_id)
    try:
        if os.path.exists(card_file):
            with open(card_file, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading business card for user {user_id}: {e}")
    return None


def save_business_card(user_id: str, card: dict):
    """Save business card to JSON file for a specific user"""
    card_file = get_business_card_file(user_id)
    os.makedirs(os.path.dirname(card_file), exist_ok=True)
    with open(card_file, "w") as f:
        json.dump(card, f, indent=2)


def generate_share_slug(name: str) -> str:
    """Generate a unique share slug from the user's name"""
    import re
    import random
    import string

    # Clean the name
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = slug[:30]  # Limit length

    # Add random suffix
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{slug}-{suffix}"


def get_card_from_supabase(share_slug: str) -> Optional[dict]:
    """Look up a card from Supabase user_business_cards table using REST API"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Supabase not configured")
        return None

    try:
        url = f"{SUPABASE_URL}/rest/v1/user_business_cards"
        params = {
            "select": "*",
            "share_slug": f"eq.{share_slug}",
            "limit": "1"
        }
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

        with httpx.Client() as client:
            response = client.get(url, params=params, headers=headers)

        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                print(f"Found card for share_slug: {share_slug}")
                return data[0]
            else:
                print(f"No card found for share_slug: {share_slug}")
        else:
            print(f"Supabase API error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Supabase lookup error: {e}")
    return None


def generate_vcard(card: dict) -> str:
    """Generate vCard 3.0 format from business card data"""
    lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
    ]

    # Name
    if card.get("full_name"):
        parts = card["full_name"].split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""
        lines.append(f"FN:{card['full_name']}")
        lines.append(f"N:{last_name};{first_name};;;")

    # Organization and title
    if card.get("company"):
        lines.append(f"ORG:{card['company']}")
    if card.get("title"):
        lines.append(f"TITLE:{card['title']}")

    # Contact info
    if card.get("phone"):
        lines.append(f"TEL;TYPE=CELL:{card['phone']}")
    if card.get("email"):
        lines.append(f"EMAIL:{card['email']}")
    if card.get("website"):
        lines.append(f"URL:{card['website']}")
    if card.get("linkedin_url"):
        lines.append(f"URL;TYPE=LinkedIn:{card['linkedin_url']}")

    # Photo
    if card.get("avatar_url"):
        lines.append(f"PHOTO;VALUE=URI:{card['avatar_url']}")

    lines.append("END:VCARD")
    return "\r\n".join(lines)


def extract_text_from_image(image_bytes: bytes) -> str:
    """Extract text from business card using OpenAI Vision API"""
    import base64

    # First try OpenAI Vision (much better for business cards)
    if openai_client:
        try:
            # Convert image to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')

            # Detect image type
            image = Image.open(io.BytesIO(image_bytes))
            img_format = image.format.lower() if image.format else 'jpeg'
            if img_format == 'jpg':
                img_format = 'jpeg'

            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Extract ALL text from this business card. Include:
- Full name
- Job title/role
- Company name
- Email address(es)
- Phone number(s)
- Website
- Address
- Any other text visible

Return the extracted text in a clean, readable format. If you can't read something clearly, make your best guess."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/{img_format};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )

            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI Vision error: {e}, falling back to Tesseract")

    # Fallback to Tesseract
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


def extract_info_with_ai(context: str, card_text: Optional[str] = None) -> dict:
    """Use OpenAI to extract structured info from text"""
    if not openai_client:
        # Fallback: basic extraction without AI
        return {
            "name": "Unknown",
            "tags": ["contact"],
            "raw_context": context,
        }

    combined_text = context
    if card_text:
        combined_text += f"\n\nBusiness Card Text:\n{card_text}"

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert at extracting contact information and generating comprehensive, searchable tags.

Extract the following fields from the provided text:
- name: Full name of the person
- email: Email address
- phone: Phone number
- company: Company name
- role: Job title/role
- industry: Industry they work in (e.g., "Technology", "Finance", "Healthcare", "Real Estate", "Marketing")
- location: City/location

For the "tags" field, generate 10-20 highly relevant, searchable keywords. Include tags from ALL these categories:

1. **Professional Role Tags**: Job function, seniority level, department
   Examples: "CEO", "founder", "engineer", "sales", "marketing", "executive", "manager", "developer"

2. **Industry & Sector Tags**: Specific industry, sub-sectors, market focus
   Examples: "fintech", "SaaS", "e-commerce", "B2B", "startup", "enterprise", "consulting"

3. **Skills & Expertise Tags**: Technical skills, specializations, tools
   Examples: "AI", "machine learning", "product management", "design", "strategy", "analytics"

4. **Company Type Tags**: Company stage, size, type
   Examples: "startup", "fortune500", "agency", "VC", "investor", "accelerator"

5. **Meeting Context Tags**: Where/how you met, event type, connection source
   Examples: "conference", "networking", "referral", "LinkedIn", "coffee meeting", "demo day"

6. **Potential Value Tags**: Why this contact might be useful
   Examples: "potential client", "advisor", "mentor", "partner", "investor", "hiring", "collaboration"

7. **Topic & Interest Tags**: Discussion topics, shared interests
   Examples: "AI enthusiast", "growth hacking", "sustainability", "crypto", "remote work"

Return a JSON object with all fields. Use null for missing fields.
Make tags lowercase, single words or short phrases (2-3 words max).
Be generous with tags - more relevant tags = better searchability."""
                },
                {"role": "user", "content": combined_text}
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"AI extraction error: {e}")
        return {
            "name": "Unknown",
            "tags": ["contact"],
            "raw_context": context,
        }


def search_contacts(query: str, contacts: List[dict]) -> List[dict]:
    """Search contacts by query"""
    query_lower = query.lower()
    results = []

    for contact in contacts:
        score = 0
        match_reason = []

        # Check name
        if contact.get("name") and query_lower in contact["name"].lower():
            score += 100
            match_reason.append("name")

        # Check company
        if contact.get("company") and query_lower in contact["company"].lower():
            score += 80
            match_reason.append("company")

        # Check role
        if contact.get("role") and query_lower in contact["role"].lower():
            score += 70
            match_reason.append("role")

        # Check industry
        if contact.get("industry") and query_lower in contact["industry"].lower():
            score += 60
            match_reason.append("industry")

        # Check location
        if contact.get("location") and query_lower in contact["location"].lower():
            score += 50
            match_reason.append("location")

        # Check tags
        if contact.get("tags"):
            for tag in contact["tags"]:
                if query_lower in tag.lower():
                    score += 40
                    match_reason.append(f"tag:{tag}")
                    break

        # Check raw context
        if contact.get("raw_context") and query_lower in contact["raw_context"].lower():
            score += 20
            match_reason.append("notes")

        if score > 0:
            results.append({
                "contact": contact,
                "score": score,
                "matchReason": ", ".join(match_reason)
            })

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


# API Endpoints

@app.get("/")
async def root():
    return {"message": "Reachr API", "version": "1.0.0"}


@app.get("/api/me")
async def get_current_user(user_id: Optional[str] = Depends(get_user_id_from_token)):
    """Get current user info from auth token"""
    if not user_id:
        return {"authenticated": False, "user_id": None}
    return {"authenticated": True, "user_id": user_id}


@app.post("/api/migrate-contacts")
async def migrate_contacts(user_id: Optional[str] = Depends(get_user_id_from_token)):
    """Migrate contacts from shared file to user-specific file"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Load contacts from shared/legacy file
    legacy_file = os.path.join(DATA_DIR, "contacts.json")
    legacy_contacts = []

    if os.path.exists(legacy_file):
        try:
            with open(legacy_file, "r") as f:
                data = json.load(f)
                legacy_contacts = data.get("contacts", [])
        except Exception as e:
            print(f"Error loading legacy contacts: {e}")

    if not legacy_contacts:
        return {"success": True, "message": "No contacts to migrate", "migrated": 0}

    # Load existing user contacts
    user_contacts = load_contacts(user_id)

    # Get existing contact IDs to avoid duplicates
    existing_ids = {c.get("id") for c in user_contacts}

    # Migrate contacts that don't already exist
    migrated = 0
    for contact in legacy_contacts:
        if contact.get("id") not in existing_ids:
            contact["user_id"] = user_id
            user_contacts.append(contact)
            migrated += 1

    # Save to user file
    save_contacts(user_contacts, user_id)

    return {
        "success": True,
        "message": f"Migrated {migrated} contacts to your account",
        "migrated": migrated,
        "total_contacts": len(user_contacts)
    }


@app.get("/api/contacts")
async def get_contacts(
    industry: Optional[str] = None,
    location: Optional[str] = None,
    limit: Optional[int] = None,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Get all contacts with optional filters (per-user)"""
    contacts = load_contacts(user_id)

    if industry:
        contacts = [c for c in contacts if c.get("industry", "").lower() == industry.lower()]

    if location:
        contacts = [c for c in contacts if c.get("location", "").lower() == location.lower()]

    if limit:
        contacts = contacts[:limit]

    return {"contacts": contacts}


@app.post("/api/contacts")
async def create_contact(
    contact: ContactCreate,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Create a new contact (per-user)"""
    contacts = load_contacts(user_id)

    new_contact = contact.model_dump()
    new_contact["id"] = str(uuid.uuid4())
    new_contact["user_id"] = user_id  # Store user_id with contact
    new_contact["created_at"] = datetime.now().isoformat()
    new_contact["updated_at"] = datetime.now().isoformat()

    contacts.append(new_contact)
    save_contacts(contacts, user_id)

    return {"success": True, "contact": new_contact}


@app.get("/api/contacts/{contact_id}")
async def get_contact(
    contact_id: str,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Get a single contact by ID (per-user)"""
    contacts = load_contacts(user_id)

    for contact in contacts:
        if contact.get("id") == contact_id:
            return {"contact": contact}

    raise HTTPException(status_code=404, detail="Contact not found")


@app.put("/api/contacts/{contact_id}")
async def update_contact(
    contact_id: str,
    updates: ContactCreate,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Update a contact (per-user)"""
    contacts = load_contacts(user_id)

    for i, contact in enumerate(contacts):
        if contact.get("id") == contact_id:
            updated = {**contact, **updates.model_dump(exclude_unset=True)}
            updated["updated_at"] = datetime.now().isoformat()
            contacts[i] = updated
            save_contacts(contacts, user_id)
            return {"success": True, "contact": updated}

    raise HTTPException(status_code=404, detail="Contact not found")


@app.delete("/api/contacts/{contact_id}")
async def delete_contact(
    contact_id: str,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Delete a contact (per-user)"""
    contacts = load_contacts(user_id)

    for i, contact in enumerate(contacts):
        if contact.get("id") == contact_id:
            contacts.pop(i)
            save_contacts(contacts, user_id)
            return {"success": True}

    raise HTTPException(status_code=404, detail="Contact not found")


@app.post("/api/search")
async def search(
    request: SearchRequest,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Search contacts (per-user)"""
    contacts = load_contacts(user_id)
    results = search_contacts(request.query, contacts)

    top_score = results[0]["score"] if results else 0

    return {
        "results": results,
        "topScore": top_score,
        "query": request.query
    }


@app.post("/api/ocr")
async def extract_card_text(image: UploadFile = File(...)):
    """Extract text from business card image using OCR"""
    try:
        contents = await image.read()
        text = extract_text_from_image(contents)
        return {"text": text, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/extract")
async def extract_tags(request: ExtractRequest):
    """Extract structured info and tags from context"""
    result = extract_info_with_ai(request.context, request.cardText)
    return result


@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio file (placeholder - uses OpenAI Whisper)"""
    if not openai_client:
        return {"text": "", "success": False, "error": "OpenAI API key not configured"}

    try:
        contents = await audio.read()

        # Save temp file for OpenAI
        temp_path = f"/tmp/{audio.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)

        with open(temp_path, "rb") as f:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=f
            )

        os.remove(temp_path)

        return {"text": transcript.text, "success": True}
    except Exception as e:
        return {"text": "", "success": False, "error": str(e)}


@app.post("/api/voice-search")
async def voice_search(
    request: SearchRequest,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Search contacts using voice query (per-user)"""
    contacts = load_contacts(user_id)
    results = search_contacts(request.query, contacts)

    # Return contacts from results
    contact_list = [r["contact"] for r in results[:10]]

    return {
        "success": True,
        "results": contact_list,
        "explanation": f"Found {len(contact_list)} contacts matching '{request.query}'",
        "source": "simple"
    }


@app.get("/api/preferences")
async def get_preferences(user_id: Optional[str] = Depends(get_user_id_from_token)):
    """Get user preferences"""
    if not user_id:
        return {"industry": None, "custom_tags": [], "suggested_tags": []}

    prefs = load_user_preferences(user_id)
    return prefs


@app.put("/api/preferences")
async def update_preferences(
    preferences: UserPreferences,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Update user preferences"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    current_prefs = load_user_preferences(user_id)

    # Update with new values
    if preferences.industry is not None:
        current_prefs["industry"] = preferences.industry
        # Set suggested tags based on industry
        industry_key = preferences.industry.lower().replace(" ", "_")
        current_prefs["suggested_tags"] = INDUSTRY_DEFAULT_TAGS.get(
            industry_key, INDUSTRY_DEFAULT_TAGS.get("general", [])
        )

    if preferences.custom_tags is not None:
        current_prefs["custom_tags"] = preferences.custom_tags

    save_user_preferences(user_id, current_prefs)
    return {"success": True, "preferences": current_prefs}


@app.get("/api/tags")
async def get_all_tags(user_id: Optional[str] = Depends(get_user_id_from_token)):
    """Get all tags for autocomplete - combines custom, contact-derived, and industry defaults"""
    all_tags = {}

    # 1. Get industry default tags if user is logged in
    if user_id:
        prefs = load_user_preferences(user_id)

        # Add custom tags (highest priority)
        for tag in prefs.get("custom_tags", []):
            tag_lower = tag.lower()
            if tag_lower not in all_tags:
                all_tags[tag_lower] = {"tag": tag_lower, "count": 0, "source": "custom"}

        # Add suggested/industry tags
        for tag in prefs.get("suggested_tags", []):
            tag_lower = tag.lower()
            if tag_lower not in all_tags:
                all_tags[tag_lower] = {"tag": tag_lower, "count": 0, "source": "suggested"}

    # 2. Get tags from contacts
    contacts = load_contacts(user_id)
    for contact in contacts:
        if contact.get("tags"):
            for tag in contact["tags"]:
                tag_lower = tag.lower()
                if tag_lower in all_tags:
                    all_tags[tag_lower]["count"] += 1
                else:
                    all_tags[tag_lower] = {"tag": tag_lower, "count": 1, "source": "contact"}

    # 3. Add general default tags if user has no preferences set
    if user_id:
        prefs = load_user_preferences(user_id)
        if not prefs.get("industry") and not prefs.get("suggested_tags"):
            for tag in INDUSTRY_DEFAULT_TAGS.get("general", []):
                tag_lower = tag.lower()
                if tag_lower not in all_tags:
                    all_tags[tag_lower] = {"tag": tag_lower, "count": 0, "source": "default"}

    # Sort by count (desc) then alphabetically
    sorted_tags = sorted(
        all_tags.values(),
        key=lambda x: (-x["count"], x["tag"])
    )

    return {"tags": sorted_tags}


@app.get("/api/industries")
async def get_industries():
    """Get list of available industries for user selection"""
    industries = [
        {"id": "architecture", "name": "Architecture", "icon": "layout"},
        {"id": "automotive", "name": "Automotive", "icon": "truck"},
        {"id": "civil_engineering", "name": "Civil Engineering", "icon": "tool"},
        {"id": "construction", "name": "Construction", "icon": "hard-hat"},
        {"id": "consulting", "name": "Consulting", "icon": "users"},
        {"id": "education", "name": "Education", "icon": "book"},
        {"id": "energy", "name": "Energy & Utilities", "icon": "zap"},
        {"id": "entertainment", "name": "Entertainment", "icon": "film"},
        {"id": "finance", "name": "Finance & Banking", "icon": "dollar-sign"},
        {"id": "food_beverage", "name": "Food & Beverage", "icon": "coffee"},
        {"id": "government", "name": "Government", "icon": "flag"},
        {"id": "healthcare", "name": "Healthcare", "icon": "heart"},
        {"id": "hospitality", "name": "Hospitality & Hotels", "icon": "home"},
        {"id": "insurance", "name": "Insurance", "icon": "shield"},
        {"id": "legal", "name": "Legal", "icon": "briefcase"},
        {"id": "logistics", "name": "Logistics & Supply Chain", "icon": "package"},
        {"id": "manufacturing", "name": "Manufacturing", "icon": "settings"},
        {"id": "marketing", "name": "Marketing & Advertising", "icon": "trending-up"},
        {"id": "media", "name": "Media & Publishing", "icon": "tv"},
        {"id": "medicine", "name": "Medicine & Physician", "icon": "activity"},
        {"id": "military", "name": "Military & Defense", "icon": "shield"},
        {"id": "nonprofit", "name": "Nonprofit", "icon": "heart"},
        {"id": "pharmaceutical", "name": "Pharmaceutical", "icon": "thermometer"},
        {"id": "real_estate", "name": "Real Estate", "icon": "home"},
        {"id": "restaurant", "name": "Restaurant & Dining", "icon": "coffee"},
        {"id": "retail", "name": "Retail", "icon": "shopping-bag"},
        {"id": "sales", "name": "Sales", "icon": "shopping-cart"},
        {"id": "sports", "name": "Sports & Fitness", "icon": "award"},
        {"id": "technology", "name": "Technology", "icon": "cpu"},
        {"id": "telecom", "name": "Telecommunications", "icon": "phone"},
        {"id": "transportation", "name": "Transportation", "icon": "navigation"},
        {"id": "travel", "name": "Travel & Tourism", "icon": "map"},
        {"id": "general", "name": "Other", "icon": "grid"},
    ]
    return {"industries": industries}


@app.post("/api/tags")
async def add_custom_tag(
    tag: dict,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Add a custom tag to user preferences"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    tag_name = tag.get("tag", "").strip().lower()
    if not tag_name:
        raise HTTPException(status_code=400, detail="Tag name is required")

    prefs = load_user_preferences(user_id)
    custom_tags = prefs.get("custom_tags", [])

    if tag_name not in [t.lower() for t in custom_tags]:
        custom_tags.append(tag_name)
        prefs["custom_tags"] = custom_tags
        save_user_preferences(user_id, prefs)

    return {"success": True, "custom_tags": custom_tags}


@app.delete("/api/tags/{tag_name}")
async def delete_custom_tag(
    tag_name: str,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Remove a custom tag from user preferences"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    prefs = load_user_preferences(user_id)
    custom_tags = prefs.get("custom_tags", [])

    # Remove tag (case-insensitive)
    custom_tags = [t for t in custom_tags if t.lower() != tag_name.lower()]
    prefs["custom_tags"] = custom_tags
    save_user_preferences(user_id, prefs)

    return {"success": True, "custom_tags": custom_tags}


# Business Card Endpoints

@app.get("/api/business-card")
async def get_business_card(user_id: Optional[str] = Depends(get_user_id_from_token)):
    """Get the current user's business card"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    card = load_business_card(user_id)
    return {"card": card}


@app.post("/api/business-card")
async def save_business_card_endpoint(
    card_input: BusinessCardInput,
    user_id: Optional[str] = Depends(get_user_id_from_token)
):
    """Create or update the user's business card"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Load existing card or create new
    existing_card = load_business_card(user_id)

    if existing_card:
        # Update existing card
        card = existing_card
        card.update(card_input.model_dump(exclude_unset=True))
        card["updated_at"] = datetime.now().isoformat()
    else:
        # Create new card
        card = card_input.model_dump()
        card["id"] = str(uuid.uuid4())
        card["user_id"] = user_id
        card["share_slug"] = generate_share_slug(card_input.full_name)
        card["created_at"] = datetime.now().isoformat()
        card["updated_at"] = datetime.now().isoformat()

    save_business_card(user_id, card)

    return {"success": True, "card": card}


@app.get("/api/business-card/vcard")
async def get_business_card_vcard(user_id: Optional[str] = Depends(get_user_id_from_token)):
    """Generate and return vCard for the user's business card"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    card = load_business_card(user_id)
    if not card:
        raise HTTPException(status_code=404, detail="Business card not found")

    vcard_content = generate_vcard(card)

    from fastapi.responses import Response
    return Response(
        content=vcard_content,
        media_type="text/vcard",
        headers={
            "Content-Disposition": f"attachment; filename={card.get('full_name', 'contact').replace(' ', '_')}.vcf"
        }
    )


@app.get("/card/{share_slug}")
async def get_public_business_card(share_slug: str):
    """Get a business card by its public share slug (no auth required)"""
    from fastapi.responses import HTMLResponse

    card_data = None

    # First check Supabase for multi-card support
    card_data = get_card_from_supabase(share_slug)

    # Fallback to file-based storage for legacy cards
    if not card_data:
        users_dir = os.path.join(DATA_DIR, "users")
        if os.path.exists(users_dir):
            for user_id in os.listdir(users_dir):
                user_dir = os.path.join(users_dir, user_id)
                card_file = os.path.join(user_dir, "business_card.json")

                if os.path.exists(card_file):
                    try:
                        with open(card_file, "r") as f:
                            card = json.load(f)
                            if card.get("share_slug") == share_slug:
                                card_data = card
                                break
                    except Exception as e:
                        print(f"Error reading card file: {e}")
                        continue

    if not card_data:
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Card Not Found - Reachr</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f0f13; color: #e5e5e5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                .container { text-align: center; padding: 40px; }
                h1 { color: #9ca3af; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Card Not Found</h1>
                <p>This business card doesn't exist or has been removed.</p>
            </div>
        </body>
        </html>
        """, status_code=404)

    # Generate HTML business card page
    name = card_data.get("full_name", "") or card_data.get("card_label", "Business Card")
    title = card_data.get("title", "")
    company = card_data.get("company", "")
    email = card_data.get("email", "")
    phone = card_data.get("phone", "")
    website = card_data.get("website", "")
    linkedin = card_data.get("linkedin_url", "")
    avatar = card_data.get("avatar_url", "")
    card_type = card_data.get("card_type", "digital")
    scanned_image_url = card_data.get("scanned_image_url", "")
    card_label = card_data.get("card_label", "")

    # Check if this is a scanned card
    is_scanned = card_type == "scanned" and scanned_image_url

    avatar_html = f'<img src="{avatar}" alt="{name}" class="avatar">' if avatar else f'<div class="avatar-placeholder">{name[:2].upper() if name else "?"}</div>'

    contact_html = ""
    if email:
        contact_html += f'<a href="mailto:{email}" class="contact-item"><span class="icon">✉️</span>{email}</a>'
    if phone:
        contact_html += f'<a href="tel:{phone}" class="contact-item"><span class="icon">📱</span>{phone}</a>'
    if website:
        contact_html += f'<a href="{website}" target="_blank" class="contact-item"><span class="icon">🌐</span>{website}</a>'
    if linkedin:
        contact_html += f'<a href="{linkedin}" target="_blank" class="contact-item"><span class="icon">💼</span>LinkedIn</a>'

    # Build deep link URL for adding to Reachr app
    import urllib.parse
    # Only include non-empty params to avoid routing issues
    deep_link_params = {"name": name}
    if email:
        deep_link_params["email"] = email
    if phone:
        deep_link_params["phone"] = phone
    if title:
        deep_link_params["title"] = title
    if company:
        deep_link_params["company"] = company
    if linkedin:
        deep_link_params["linkedin"] = linkedin
    # Use quote_via to ensure spaces are %20 not +
    encoded_params = urllib.parse.urlencode(deep_link_params, quote_via=urllib.parse.quote)
    deep_link = f"reachr://add-contact?{encoded_params}"

    # Generate different HTML for scanned cards
    if is_scanned:
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{card_label or name} - Scanned Business Card</title>
            <meta property="og:title" content="{card_label or name}">
            <meta property="og:image" content="{scanned_image_url}">
            <style>
                * {{ box-sizing: border-box; margin: 0; padding: 0; }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #0A1815 0%, #163530 100%);
                    color: #e5e5e5;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }}
                .card {{
                    background: linear-gradient(135deg, #1A3A35 0%, #2A524A 100%);
                    border-radius: 24px;
                    padding: 24px;
                    max-width: 450px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(91, 154, 139, 0.25);
                    border: 1px solid rgba(255,255,255,0.1);
                }}
                .label {{
                    font-size: 18px;
                    font-weight: 600;
                    color: #ffffff;
                    margin-bottom: 16px;
                    text-align: center;
                }}
                .scanned-image {{
                    width: 100%;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }}
                .add-button {{
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 20px;
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #5B9A8B, #4A8578);
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 14px;
                    text-decoration: none;
                    box-shadow: 0 8px 24px rgba(91, 154, 139, 0.4);
                }}
                .footer {{
                    margin-top: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: rgba(255,255,255,0.4);
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <p class="label">{card_label or "Scanned Business Card"}</p>
                <img src="{scanned_image_url}" alt="{card_label}" class="scanned-image">
                <a href="{deep_link}" class="add-button">
                    <span>+</span> Add to Reachr
                </a>
                <div class="footer">Shared via Reachr</div>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{name} - Digital Business Card</title>
        <meta property="og:title" content="{name}'s Business Card">
        <meta property="og:description" content="{title} at {company}" if title and company else "{name}'s digital business card">
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #0A1815 0%, #1A3A35 100%);
                color: #e5e5e5;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .card {{
                background: linear-gradient(135deg, #1A3A35 0%, #2A524A 50%, #3A6B60 100%);
                border-radius: 24px;
                padding: 32px;
                max-width: 400px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(91, 154, 139, 0.3);
                border: 1px solid rgba(255,255,255,0.1);
                position: relative;
                overflow: hidden;
            }}
            .accent-line {{
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #7FC4B5, #5B9A8B, #A8D8CE);
            }}
            .header {{
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 24px;
                margin-top: 8px;
            }}
            .avatar {{
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid rgba(127, 196, 181, 0.5);
            }}
            .avatar-placeholder {{
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #5B9A8B, #4A8578);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                font-weight: 700;
                color: white;
            }}
            .info h1 {{
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 4px;
                color: #ffffff;
            }}
            .info .title {{
                font-size: 16px;
                color: #7FC4B5;
                margin-bottom: 2px;
            }}
            .info .company {{
                font-size: 14px;
                color: rgba(255,255,255,0.6);
            }}
            .contacts {{
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding-top: 20px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }}
            .contact-item {{
                display: flex;
                align-items: center;
                gap: 12px;
                color: rgba(255,255,255,0.8);
                text-decoration: none;
                padding: 12px 16px;
                background: rgba(91, 154, 139, 0.15);
                border-radius: 12px;
                transition: all 0.2s;
            }}
            .contact-item:hover {{
                background: rgba(91, 154, 139, 0.25);
                transform: translateX(4px);
            }}
            .icon {{
                font-size: 18px;
            }}
            .footer {{
                margin-top: 24px;
                text-align: center;
                font-size: 12px;
                color: rgba(255,255,255,0.4);
            }}
            .footer a {{
                color: #5B9A8B;
                text-decoration: none;
            }}
            .add-button {{
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-top: 24px;
                padding: 16px 24px;
                background: linear-gradient(135deg, #5B9A8B, #4A8578);
                color: white;
                font-size: 16px;
                font-weight: 600;
                border-radius: 14px;
                text-decoration: none;
                box-shadow: 0 8px 24px rgba(91, 154, 139, 0.4);
                transition: all 0.2s;
            }}
            .add-button:hover {{
                transform: translateY(-2px);
                box-shadow: 0 12px 32px rgba(91, 154, 139, 0.5);
            }}
            .add-button span {{
                font-size: 20px;
                font-weight: 700;
            }}
            .app-hint {{
                text-align: center;
                margin-top: 12px;
                font-size: 14px;
                color: rgba(255,255,255,0.5);
            }}
            .app-hint a {{
                color: #7FC4B5;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="accent-line"></div>
            <div class="header">
                {avatar_html}
                <div class="info">
                    <h1>{name}</h1>
                    {"<p class='title'>" + title + "</p>" if title else ""}
                    {"<p class='company'>" + company + "</p>" if company else ""}
                </div>
            </div>
            <div class="contacts">
                {contact_html}
            </div>
            <a href="{deep_link}" class="add-button" id="addButton" onclick="handleAddClick(event)">
                <span>+</span> Add to Reachr
            </a>
            <p class="app-hint" id="appHint" style="display: none;">
                Don't have Reachr? <a href="#">Download the app</a>
            </p>
            <div class="footer">
                Shared via <a href="#">Reachr</a>
            </div>
        </div>
        <script>
            function handleAddClick(e) {{
                // Try to open the app
                var deepLink = "{deep_link}";
                var start = Date.now();

                // Set a timeout to show hint if app didn't open
                setTimeout(function() {{
                    // If we're still here after 1.5s, app probably isn't installed
                    if (Date.now() - start < 2000) {{
                        document.getElementById('appHint').style.display = 'block';
                    }}
                }}, 1500);

                // Try opening the deep link
                window.location.href = deepLink;
                e.preventDefault();
            }}
        </script>
    </body>
    </html>
    """

    return HTMLResponse(content=html)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
