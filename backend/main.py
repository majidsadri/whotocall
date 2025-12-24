import os
import json
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import io
import openai

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

# Data file path - use 'data' subdirectory relative to this file
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "contacts.json")

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


# Helper functions
def load_contacts() -> List[dict]:
    """Load contacts from JSON file"""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                return data.get("contacts", [])
    except Exception as e:
        print(f"Error loading contacts: {e}")
    return []


def save_contacts(contacts: List[dict]):
    """Save contacts to JSON file"""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump({"contacts": contacts}, f, indent=2)


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


@app.get("/api/contacts")
async def get_contacts(
    industry: Optional[str] = None,
    location: Optional[str] = None,
    limit: Optional[int] = None
):
    """Get all contacts with optional filters"""
    contacts = load_contacts()

    if industry:
        contacts = [c for c in contacts if c.get("industry", "").lower() == industry.lower()]

    if location:
        contacts = [c for c in contacts if c.get("location", "").lower() == location.lower()]

    if limit:
        contacts = contacts[:limit]

    return {"contacts": contacts}


@app.post("/api/contacts")
async def create_contact(contact: ContactCreate):
    """Create a new contact"""
    contacts = load_contacts()

    new_contact = contact.model_dump()
    new_contact["id"] = str(uuid.uuid4())
    new_contact["created_at"] = datetime.now().isoformat()
    new_contact["updated_at"] = datetime.now().isoformat()

    contacts.append(new_contact)
    save_contacts(contacts)

    return {"success": True, "contact": new_contact}


@app.get("/api/contacts/{contact_id}")
async def get_contact(contact_id: str):
    """Get a single contact by ID"""
    contacts = load_contacts()

    for contact in contacts:
        if contact.get("id") == contact_id:
            return {"contact": contact}

    raise HTTPException(status_code=404, detail="Contact not found")


@app.put("/api/contacts/{contact_id}")
async def update_contact(contact_id: str, updates: ContactCreate):
    """Update a contact"""
    contacts = load_contacts()

    for i, contact in enumerate(contacts):
        if contact.get("id") == contact_id:
            updated = {**contact, **updates.model_dump(exclude_unset=True)}
            updated["updated_at"] = datetime.now().isoformat()
            contacts[i] = updated
            save_contacts(contacts)
            return {"success": True, "contact": updated}

    raise HTTPException(status_code=404, detail="Contact not found")


@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact"""
    contacts = load_contacts()

    for i, contact in enumerate(contacts):
        if contact.get("id") == contact_id:
            contacts.pop(i)
            save_contacts(contacts)
            return {"success": True}

    raise HTTPException(status_code=404, detail="Contact not found")


@app.post("/api/search")
async def search(request: SearchRequest):
    """Search contacts"""
    contacts = load_contacts()
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
async def voice_search(request: SearchRequest):
    """Search contacts using voice query"""
    contacts = load_contacts()
    results = search_contacts(request.query, contacts)

    # Return contacts from results
    contact_list = [r["contact"] for r in results[:10]]

    return {
        "success": True,
        "results": contact_list,
        "explanation": f"Found {len(contact_list)} contacts matching '{request.query}'",
        "source": "simple"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
