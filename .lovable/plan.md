
# Business Card Scanner Feature

This plan adds a complete business card scanning system that allows you to take a photo of a business card, have it automatically extract contact information using AI vision, and save the contact to a database.

---

## How It Will Work

```text
+-------------------+     +------------------+     +----------------+     +------------------+
|  Take Photo /     | --> |  Upload to Chat  | --> |  AI Extracts   | --> |  Save Contact    |
|  Upload Image     |     |  (existing flow) |     |  Contact Info  |     |  to Database     |
+-------------------+     +------------------+     +----------------+     +------------------+
```

**User Flow:**
1. Click the "+" button in chat to attach a business card photo
2. Type "scan this business card" or similar message
3. AI analyzes the image and extracts contact details
4. Iris responds with the extracted contact information
5. Contact is automatically saved to the database
6. User sees confirmation with the saved contact details

---

## What Will Be Built

### 1. Database: Contacts Table

A new table to store scanned business card contacts:

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| first_name | text | Contact's first name |
| last_name | text | Contact's last name |
| email | text | Email address |
| phone | text | Phone number |
| company | text | Company/organization name |
| job_title | text | Job title/position |
| website | text | Website URL |
| address | text | Physical address |
| notes | text | Additional notes |
| source_image_url | text | URL to stored business card image |
| raw_extracted_text | text | Raw OCR text for reference |
| created_at | timestamp | When contact was created |
| updated_at | timestamp | Last update time |

### 2. File Storage: Business Card Images

A storage bucket to store the uploaded business card images:
- Bucket name: `business-cards`
- Public access for easy image viewing
- Images stored with unique names

### 3. Backend Function: Scan Business Card

A new Edge Function that:
- Receives the image (as base64 or URL after storage upload)
- Uses Lovable AI with vision capabilities (Gemini) to extract text
- Parses the extracted information into structured JSON
- Saves the contact to the database
- Returns the parsed contact data

### 4. Frontend: Chat Integration

Updates to the chat system to:
- Detect when an image is attached with a scan request
- Upload the image to storage first
- Call the scan function with the image URL
- Display the extracted contact in a nice format
- Show a success message with the saved contact

---

## Technical Details

### Edge Function: `scan-business-card`

```text
Input:
- imageBase64: Base64-encoded image data
- message: User's text message (for context)

Processing:
1. Upload image to Supabase Storage (business-cards bucket)
2. Send image URL to Gemini Pro Vision via Lovable AI
3. Parse response into contact JSON
4. Insert contact into database
5. Return contact data and image URL

Output:
{
  success: true,
  contact: { ...contact fields },
  imageUrl: "https://..."
}
```

### AI Prompt Strategy

The AI will receive a carefully crafted prompt to extract:
- Name (split into first/last)
- Email addresses
- Phone numbers
- Company name
- Job title
- Website
- Physical address

The prompt will instruct the AI to return a clean JSON object.

### Chat Flow Enhancement

When processing a message with an attached image:
1. Check if the message suggests business card scanning (keywords: "scan", "business card", "contact", etc.)
2. If detected, route to the scan-business-card function instead of regular chat
3. Display the extracted contact in a formatted card component

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/scan-business-card/index.ts` | Edge function for OCR and contact extraction |
| `src/components/chat/ContactCard.tsx` | Display component for extracted contacts |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/Chat.tsx` | Handle image uploads for scanning |
| `supabase/config.toml` | Add new function configuration |

### Database Migrations

| Change | Description |
|--------|-------------|
| Create `contacts` table | Store extracted contact information |
| Create `business-cards` storage bucket | Store uploaded images |

---

## Implementation Sequence

1. **Database Setup**
   - Create the `contacts` table with all fields
   - Create the `business-cards` storage bucket with public access

2. **Edge Function**
   - Create `scan-business-card` function
   - Implement image upload to storage
   - Integrate Lovable AI (Gemini) for vision OCR
   - Parse and save contact to database

3. **Frontend Components**
   - Create `ContactCard` component for nice display
   - Update markdown renderer to handle contact cards

4. **Chat Integration**
   - Modify `Chat.tsx` to detect business card scans
   - Upload image to storage before processing
   - Call scan function and display results

---

## AI Model Selection

Using **Gemini 2.5 Pro** (`google/gemini-2.5-pro`) for this feature because:
- Best-in-class vision + text capabilities
- Handles image analysis with high accuracy
- Available through Lovable AI (no API key needed)
- Excellent at structured data extraction

---

## Example Interaction

```text
User: [Attaches business card photo]
      "Scan this business card"

Iris: I've scanned the business card and saved the contact:

      ┌─────────────────────────────────────┐
      │  👤 John Smith                      │
      │  📧 john.smith@acme.com            │
      │  📱 +1 (555) 123-4567              │
      │  🏢 Acme Corporation               │
      │  💼 Senior Product Manager         │
      │  🌐 www.acme.com                   │
      └─────────────────────────────────────┘

      Contact saved successfully!
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No image attached | Prompt user to attach a business card image |
| Image too blurry | Notify user and suggest a clearer photo |
| No text detected | Inform user that no contact info was found |
| Partial extraction | Save what was found, note missing fields |
| Storage upload fails | Show error, don't proceed with scan |
| Database save fails | Show extracted data but note save failure |
