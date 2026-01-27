

# Chat History, API Integration & Read Receipts Implementation

This plan transforms the Voice Chat interface into a full conversation system like ChatGPT's mobile app, with persistent chat history, conversation switching, backend API integration for the "clawdbot ai" agent, and message delivery receipts.

---

## Overview

The implementation adds:
1. **Conversation History Sidebar** - ChatGPT-style sliding panel showing all past conversations
2. **Message Thread View** - Visual chat bubbles with read receipts
3. **Backend API Layer** - Edge function to communicate with "clawdbot ai" agent
4. **Read Receipts System** - Single tick (delivered to backend) and double tick (transferred to AI agent)

---

## User Experience Flow

```text
+------------------+     +-------------------+     +------------------+
|   Hamburger      | --> |  Conversation     | --> |  Active Chat     |
|   Menu Opens     |     |  History List     |     |  with Messages   |
+------------------+     +-------------------+     +------------------+
                                 |
                                 v
                         +-------------------+
                         | "New Chat" Button |
                         | at Top of List    |
                         +-------------------+
```

**Message Status Flow:**
- User sends message -> Single tick (gray) = "Sent to backend"
- Backend acknowledges -> Double tick (gray) = "Transferred to clawdbot ai"
- AI responds -> Message appears in thread

---

## Components to Create

### 1. Conversation History Sidebar
**File:** `src/components/chat/ConversationSidebar.tsx`

A slide-out panel (integrated into existing hamburger menu) showing:
- "New Chat" button at top (pill-shaped, primary color)
- List of past conversations with:
  - Title (auto-generated from first message or "New Conversation")
  - Preview of last message (truncated)
  - Timestamp (relative: "2 min ago", "Yesterday")
- Active conversation highlighted
- Swipe-to-delete gesture on mobile

### 2. Message Bubble Component
**File:** `src/components/chat/MessageBubble.tsx`

Individual message display with:
- User messages: Right-aligned, primary color background
- AI messages: Left-aligned, muted background
- Read receipt icons below user messages:
  - Single tick (Check icon) = Delivered to backend
  - Double tick (CheckCheck icon) = Transferred to AI agent
- Timestamp on long-press/hover
- Smooth fade-in animation on new messages

### 3. Chat Thread View
**File:** `src/components/chat/ChatThread.tsx`

Scrollable message area featuring:
- Auto-scroll to bottom on new messages
- "Scroll to bottom" floating button when scrolled up
- Loading indicator when AI is responding
- Empty state for new conversations

### 4. Message Input Bar
**File:** `src/components/chat/MessageInput.tsx`

Enhanced input component with:
- Text input field (rounded, expandable)
- Send button (pill-shaped)
- Voice/text toggle integrated
- Disabled state while sending

---

## Data Layer

### Conversation Hook
**File:** `src/hooks/useConversations.ts`

Manages all conversation data with localStorage persistence (upgradable to Supabase):

```typescript
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  status: 'sending' | 'delivered' | 'transferred' | 'failed';
}

interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}
```

**Functions provided:**
- `createConversation()` - Start new chat
- `getConversations()` - List all conversations
- `getMessages(conversationId)` - Get messages for a conversation
- `sendMessage(conversationId, content)` - Send and track message status
- `deleteConversation(id)` - Remove a conversation
- `updateMessageStatus(id, status)` - Update read receipt status

### API Hook
**File:** `src/hooks/useClawdbotApi.ts`

Handles communication with the backend:

```typescript
interface ApiResponse {
  success: boolean;
  messageId: string;
  status: 'delivered' | 'transferred';
  response?: string;
  error?: string;
}
```

**Functions:**
- `sendToClawdbot(message, conversationId)` - Send message to backend
- Returns status updates for read receipts

---

## Backend API

### Edge Function
**File:** `supabase/functions/clawdbot-chat/index.ts`

Secure endpoint that:
1. Receives user messages with conversation context
2. Returns immediate "delivered" acknowledgment
3. Forwards to "clawdbot ai" agent
4. Streams or returns AI response
5. Sends "transferred" status update

**Endpoints:**
- `POST /clawdbot-chat` - Send message
  - Request: `{ conversationId, message, history[] }`
  - Response: `{ messageId, status, response }`

**Error Handling:**
- 429 Rate limit -> Show toast, retry with backoff
- 402 Payment required -> Show upgrade prompt
- 500 Server error -> Show retry option

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/components/chat/ConversationSidebar.tsx` | History panel in hamburger menu |
| `src/components/chat/MessageBubble.tsx` | Individual message with receipts |
| `src/components/chat/ChatThread.tsx` | Scrollable message container |
| `src/components/chat/MessageInput.tsx` | Enhanced text/voice input |
| `src/components/chat/ReadReceipt.tsx` | Tick icons component |
| `src/hooks/useConversations.ts` | Conversation state management |
| `src/hooks/useClawdbotApi.ts` | Backend API integration |
| `supabase/functions/clawdbot-chat/index.ts` | Backend edge function |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/VoiceChat.tsx` | Integrate chat thread, use new hooks |
| `src/components/layout/MobileNav.tsx` | Add conversation history section |
| `src/components/layout/AppLayout.tsx` | Pass conversation context |
| `supabase/config.toml` | Register new edge function |

---

## Read Receipt Visual Design

```text
User Message Bubble
+----------------------------------+
|  "Schedule a meeting for        |
|   tomorrow at 3pm"              |
+----------------------------------+
                            ✓      <- Single tick (gray) = Delivered
                           ✓✓      <- Double tick (gray) = Transferred
```

**Icon States:**
- `pending` - No ticks (message sending)
- `delivered` - Single gray tick (Check icon, 12px)
- `transferred` - Double gray tick (CheckCheck icon, 12px)
- `failed` - Red exclamation with "Tap to retry"

---

## Mobile Navigation Updates

The hamburger menu will be enhanced to show:

```text
+---------------------------+
|  Menu                  X  |
+---------------------------+
|  [+ New Chat]             |  <- Primary action button
+---------------------------+
|  Conversations            |  <- Section header
|  -------------------------+
|  > Meeting notes...       |  <- Conversation item
|    2 min ago              |
|  -------------------------+
|  > Project ideas for...   |
|    Yesterday              |
+---------------------------+
|  Voice Chat          (*)  |  <- Navigation items
|  Dashboard                |
|  Settings                 |
+---------------------------+
```

---

## Technical Implementation Notes

### Message Status Flow
1. User presses send -> Status: `sending` (no tick)
2. Backend receives message -> Status: `delivered` (single tick)
3. Backend confirms AI transfer -> Status: `transferred` (double tick)
4. AI response arrives -> New assistant message appears

### localStorage Structure
```json
{
  "clawdbot-conversations": [
    { "id": "...", "title": "...", "updatedAt": "..." }
  ],
  "clawdbot-messages-{conversationId}": [
    { "id": "...", "role": "user", "content": "...", "status": "transferred" }
  ]
}
```

### API Request Format
```json
POST /functions/v1/clawdbot-chat
{
  "conversationId": "uuid",
  "message": "User's message text",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

---

## Implementation Order

1. **Data Layer First** - Create `useConversations.ts` hook with localStorage
2. **UI Components** - Build MessageBubble, ReadReceipt, ChatThread
3. **Integrate VoiceChat** - Replace current UI with chat thread
4. **Sidebar Enhancement** - Add conversation list to hamburger menu
5. **Backend Edge Function** - Create clawdbot-chat endpoint
6. **API Hook** - Connect frontend to backend with status updates
7. **Polish** - Animations, error states, empty states

---

## Dependencies

No new npm packages required - uses existing:
- `lucide-react` for Check/CheckCheck icons
- `@radix-ui/react-scroll-area` for chat thread scrolling
- `date-fns` for relative timestamps
- `@tanstack/react-query` for API state management

