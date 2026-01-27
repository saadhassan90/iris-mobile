

# ElevenLabs "Talk to Iris" Voice Agent Integration

This plan integrates the ElevenLabs Conversational AI SDK to create a real-time voice experience on the "Talk to Iris" page, mirroring the ElevenLabs "Talk to Agent" UI.

---

## Configuration

| Setting | Value |
|---------|-------|
| **Agent ID** | `agent_6901kf76kat3e6m9y7tmn3g76yea` |
| **API Key** | `ELEVENLABS_API_KEY` (already connected) |

---

## User Experience

```text
TEXT MODE (Default)                 VOICE MODE (Active Call)
+---------------------------+       +---------------------------+
|     Chat Messages         |       |                           |
|     (scrollable)          |       |   [Audio-Reactive Orb]    |
|                           |       |                           |
|                           |       |    "Listening..." or      |
|                           |       |    "Iris is speaking..."  |
|                           |       |                           |
+---------------------------+       +---------------------------+
| [Text input] [Mic] [Send] |       |      [End Call Button]    |
+---------------------------+       +---------------------------+
```

**Voice Flow:**
1. User taps microphone button
2. Microphone permission requested
3. Edge function generates WebRTC token
4. Real-time conversation with Iris begins
5. Transcriptions appear in chat thread
6. User can end call anytime and continue via text

---

## Implementation Steps

### Step 1: Install ElevenLabs React SDK

Add the `@elevenlabs/react` package to enable the `useConversation` hook for WebRTC-based voice conversations.

### Step 2: Create Token Generation Edge Function

**New File:** `supabase/functions/elevenlabs-conversation-token/index.ts`

Secure endpoint that:
- Receives requests from the client
- Uses `ELEVENLABS_API_KEY` to call ElevenLabs API
- Returns a single-use WebRTC conversation token
- Handles CORS for browser requests

### Step 3: Create Voice Agent Hook

**New File:** `src/hooks/useIrisVoice.ts`

Custom hook wrapping `useConversation` that:
- Manages connection state (idle, connecting, connected)
- Handles microphone permission requests
- Fetches tokens from edge function
- Processes transcription events to add messages to chat
- Exposes audio levels for orb visualization
- Provides `startCall()` and `endCall()` methods

### Step 4: Enhance Voice Orb Component

**Modified File:** `src/components/voice/VoiceOrb.tsx`

Add real-time audio visualization:
- Accept `inputVolume` and `outputVolume` props
- Scale orb size based on voice activity levels
- Smooth animations using CSS transitions
- Different visual states for user speaking vs Iris speaking

### Step 5: Refactor Talk to Iris Page

**Modified File:** `src/pages/VoiceChat.tsx`

Two-mode interface:
- **Text Mode**: Current chat interface with mic button
- **Voice Mode**: Full-screen orb with end call button
- Automatic new conversation creation when voice session starts
- Real-time transcription integration
- Seamless switching between modes

### Step 6: Update Message Input

**Modified File:** `src/components/chat/MessageInput.tsx`

Enhanced mic button behavior:
- Starts voice session via `useIrisVoice` hook
- Visual feedback during connection
- Disabled state during active voice session

---

## Architecture

```text
+------------------+     WebRTC      +------------------+
|   React Client   | <-------------> |  ElevenLabs API  |
|  useConversation |                 |  (Iris Agent)    |
+------------------+                 +------------------+
        |
        | POST /elevenlabs-conversation-token
        v
+------------------+
| Supabase Edge    |
| Function         |
+------------------+
        |
        | Uses ELEVENLABS_API_KEY
        v
+------------------+
| ElevenLabs API   |
| /convai/conversation/token
+------------------+
```

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Secure token generation |
| `src/hooks/useIrisVoice.ts` | Voice conversation management |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/VoiceChat.tsx` | Two-mode UI, real voice integration |
| `src/components/voice/VoiceOrb.tsx` | Audio-reactive visualization |
| `src/components/chat/MessageInput.tsx` | Voice session trigger |

### New Dependency

| Package | Version |
|---------|---------|
| `@elevenlabs/react` | Latest |

---

## Technical Details

### Token Generation Edge Function

```typescript
// Key logic
const response = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`,
  {
    headers: { "xi-api-key": ELEVENLABS_API_KEY }
  }
);
const { token } = await response.json();
```

### Voice Hook Integration

```typescript
// Key callbacks
const conversation = useConversation({
  onConnect: () => { /* Set voice mode active */ },
  onDisconnect: () => { /* Return to text mode */ },
  onMessage: (message) => {
    if (message.type === "user_transcript") {
      addMessage(message.user_transcription_event.user_transcript, 'user');
    }
    if (message.type === "agent_response") {
      addMessage(message.agent_response_event.agent_response, 'assistant');
    }
  }
});
```

### Audio-Reactive Orb

```typescript
// Real-time visualization
const inputLevel = conversation.getInputVolume();   // User speaking
const outputLevel = conversation.getOutputVolume(); // Iris speaking
const scale = 1 + Math.max(inputLevel, outputLevel) * 0.3;
```

---

## Chat Integration

All voice interactions sync with the existing conversation system:

- **New voice session** → Creates new conversation if none active
- **User speech** → Transcribed → Added as user message with "transferred" status
- **Iris response** → Added as assistant message
- **End call** → Continue conversation via text
- **Persisted** → All messages saved to localStorage

---

## Error Handling

| Scenario | User Experience |
|----------|-----------------|
| Microphone denied | Toast: "Microphone access required" |
| Token fetch failed | Toast: "Connection failed, please retry" |
| Connection dropped | Auto-return to text mode + toast notification |
| Agent unavailable | Toast: "Iris is currently unavailable" |

