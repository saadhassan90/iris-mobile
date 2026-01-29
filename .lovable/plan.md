

# Hold-to-Talk Voice Input Feature

This plan adds a WhatsApp-style voice input button to the chat input area. Hold the button to record, release to transcribe and send, or swipe left to cancel.

---

## User Experience

```text
IDLE STATE                          RECORDING STATE
+---------------------------+       +---------------------------+
| [+] [___input___] [⬆][🎤] |  -->  | [◀ Swipe to cancel] [🔴] |
+---------------------------+       +---------------------------+
                                          Hold and speak...
                                    
                                    RELEASE: Send transcribed text
                                    SWIPE LEFT: Cancel recording
```

**Interaction Flow:**
1. User presses and holds the microphone button
2. Microphone permission requested (if not already granted)
3. Recording starts with visual feedback (red pulsing indicator)
4. Live partial transcription shown above input area
5. **Release** → Final transcription sent as chat message
6. **Swipe left** → Recording cancelled, no message sent

---

## Technical Approach

### Speech-to-Text Integration

The project already has ElevenLabs Scribe v2 integration set up:
- Edge function exists: `elevenlabs-scribe-token`
- `@elevenlabs/react` package already installed
- `ELEVENLABS_API_KEY` secret configured

We'll reuse the existing Scribe infrastructure but create a new hook specifically for this dictation use case (simpler than the full voice agent flow).

---

## Implementation Steps

### Step 1: Create Dictation Hook

**New File:** `src/hooks/useDictation.ts`

A focused hook for hold-to-talk transcription:
- Connects to ElevenLabs Scribe v2 on press
- Streams partial transcripts in real-time
- Returns final committed transcript on release
- Handles microphone permissions and errors
- Tracks recording state for UI feedback

Key functionality:
- `startRecording()` - Begin capturing audio and streaming to Scribe
- `stopRecording()` - Disconnect and return final transcript
- `cancelRecording()` - Disconnect without returning transcript
- `isRecording` - Boolean state for UI
- `partialTranscript` - Live preview text

### Step 2: Create Voice Input UI Component

**New File:** `src/components/chat/VoiceInputButton.tsx`

A standalone component handling the hold-to-talk interaction:
- Touch/pointer event handling for hold gestures
- Swipe-left detection for cancellation (threshold ~80px)
- Visual states:
  - **Idle**: Standard mic icon button
  - **Recording**: Red pulsing indicator with slide-to-cancel hint
  - **Transcribing**: Brief loading state before send
- Haptic feedback via navigator.vibrate (where supported)

### Step 3: Create Recording Overlay

**New File:** `src/components/chat/RecordingOverlay.tsx`

Overlay shown during recording:
- Displayed above the input area when recording
- Shows partial transcript in real-time
- "Slide to cancel" indicator with arrow
- Recording duration timer
- Red recording pulse animation

### Step 4: Integrate into MessageInput

**Modified File:** `src/components/chat/MessageInput.tsx`

Changes:
- Add `VoiceInputButton` next to the send button
- Show `RecordingOverlay` when recording is active
- Pass `onSendMessage` callback to send transcribed text
- Manage recording state at the component level

Layout adjustment:
```text
CURRENT:  [+] [input field with ⬆] [🎤 optional]
UPDATED:  [+] [input field with ⬆] [🎤 always]
```

The mic button will be always visible (not conditionally rendered based on `onVoiceClick`).

---

## Component Architecture

```text
MessageInput
├── VoiceInputButton (new)
│   └── useDictation hook (new)
└── RecordingOverlay (new)
    └── Displays partialTranscript
    └── Swipe-to-cancel indicator
```

---

## Gesture Handling Details

### Hold-to-Talk Logic

```typescript
// Pointer events for cross-platform support
onPointerDown → Start recording, track start position
onPointerMove → If deltaX < -80px while recording → show cancel state
onPointerUp → If in cancel zone → cancelRecording(), else → sendTranscript()
onPointerLeave → If recording → treat as release (send)
```

### Cancel Swipe Detection

- Track initial touch/pointer X position
- Calculate horizontal delta during move
- Threshold: -80px (swipe left)
- Visual feedback: Button slides left, cancel text appears
- Release in cancel zone discards recording

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useDictation.ts` | Scribe-based hold-to-talk transcription |
| `src/components/chat/VoiceInputButton.tsx` | Hold/release/swipe gesture button |
| `src/components/chat/RecordingOverlay.tsx` | Recording status + partial transcript display |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/chat/MessageInput.tsx` | Integrate VoiceInputButton, show overlay |

---

## Visual Design

### Recording States

| State | Visual |
|-------|--------|
| Idle | Gray mic icon button |
| Recording | Red pulsing mic, "Slide to cancel ◀" text appears |
| Cancel Zone | Button slides left, red X icon, "Release to cancel" |
| Processing | Brief spinner before message sends |

### Recording Overlay

```text
┌─────────────────────────────────┐
│  "Hello, I want to schedule..." │  ← Partial transcript
│                                 │
│  ◀ Slide to cancel    ● 0:03   │  ← Controls
└─────────────────────────────────┘
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Microphone denied | Toast: "Microphone access required for voice input" |
| Token fetch failed | Toast: "Voice unavailable, please type instead" |
| Scribe connection lost | Auto-cancel, toast notification |
| Empty transcript | Don't send, show brief "No speech detected" |

---

## Technical Notes

- Uses ElevenLabs Scribe v2 (`scribe_v2_realtime`) with VAD commit strategy
- Token fetched from existing `elevenlabs-scribe-token` edge function
- Recording auto-commits via Voice Activity Detection (silence detection)
- Maximum recording duration: 60 seconds (auto-stop with warning)
- Supports both touch (mobile) and mouse (desktop) interactions

