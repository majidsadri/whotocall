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

load_dotenv()

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


# Industry-specific default tags
INDUSTRY_DEFAULT_TAGS = {
    "real_estate": [
        "buyer", "seller", "investor", "broker", "agent", "property manager",
        "landlord", "tenant", "developer", "appraiser", "mortgage", "lender",
        "commercial", "residential", "industrial", "retail", "land", "flip",
        "rental", "wholesale", "REIT", "hard money", "title company"
    ],
    "technology": [
        "developer", "engineer", "founder", "CEO", "CTO", "product manager",
        "designer", "startup", "investor", "VC", "SaaS", "AI", "machine learning",
        "mobile", "web", "cloud", "DevOps", "data scientist", "advisor"
    ],
    "finance": [
        "banker", "investor", "analyst", "trader", "portfolio manager", "CFO",
        "accountant", "wealth manager", "private equity", "hedge fund", "VC",
        "angel investor", "fintech", "crypto", "insurance", "lending"
    ],
    "healthcare": [
        "doctor", "physician", "nurse", "surgeon", "specialist", "hospital",
        "clinic", "pharma", "biotech", "medical device", "health tech",
        "administrator", "researcher", "patient advocate", "insurance"
    ],
    "marketing": [
        "marketer", "brand manager", "CMO", "agency", "creative director",
        "content creator", "SEO", "social media", "PR", "influencer",
        "copywriter", "growth hacker", "digital marketing", "analytics"
    ],
    "legal": [
        "attorney", "lawyer", "partner", "associate", "paralegal", "judge",
        "corporate law", "litigation", "IP", "contract", "M&A", "compliance",
        "in-house counsel", "legal tech"
    ],
    "consulting": [
        "consultant", "partner", "analyst", "advisor", "strategy", "management",
        "operations", "IT consulting", "HR consulting", "change management",
        "business development", "client"
    ],
    "sales": [
        "sales rep", "account executive", "SDR", "BDR", "sales manager",
        "VP sales", "enterprise", "SMB", "inside sales", "field sales",
        "solution engineer", "sales ops", "quota", "pipeline"
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
        {"id": "real_estate", "name": "Real Estate", "icon": "home"},
        {"id": "technology", "name": "Technology", "icon": "cpu"},
        {"id": "finance", "name": "Finance", "icon": "dollar-sign"},
        {"id": "healthcare", "name": "Healthcare", "icon": "heart"},
        {"id": "marketing", "name": "Marketing", "icon": "trending-up"},
        {"id": "legal", "name": "Legal", "icon": "briefcase"},
        {"id": "consulting", "name": "Consulting", "icon": "users"},
        {"id": "sales", "name": "Sales", "icon": "shopping-cart"},
        {"id": "general", "name": "General / Other", "icon": "grid"},
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
