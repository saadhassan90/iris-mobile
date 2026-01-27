
# ElevenLabs Voice Agent Mobile App

A mobile-first web app serving as the frontend for your ElevenLabs voice agent connected to Claude, featuring a hamburger navigation menu, a Dashboard with task management, and voice/text chat capabilities.

---

## 🎯 App Structure & Navigation

### Hamburger Menu Navigation
- **Slide-out side drawer** accessible from a menu icon in the header
- **Smooth animations** when opening/closing
- **Pill-shaped menu items** with icons for each section
- **Current page indicator** to show active section

### Three Main Sections

1. **Voice Chat** (Home)
   - Primary voice conversation interface
   - Large animated voice orb/visualizer
   - Voice + text input options

2. **Dashboard**
   - Task management with list/kanban toggle
   - Email summaries and actions
   - Overview of pending items

3. **Settings**
   - Adjust voice preferences
   - Toggle between voice/text modes
   - About/help information

---

## 🎤 Voice Chat Interface

### Voice Visualizer
- **Animated central orb** that pulses and reacts to audio levels
- Different visual states:
  - 🎧 Listening (calm pulse)
  - 🧠 Processing (loading animation)
  - 🗣️ Agent speaking (active wave animation)
  - ⏸️ Idle (subtle breathing effect)

### Voice Controls
- **Large mic button** at bottom center (pill-shaped, prominent)
- **Status text** below orb ("Listening...", "Speaking...", etc.)

### Text Input Option
- **Expandable text field** that slides up from bottom
- **Send button** with pill design
- **Toggle switch** to switch between voice/text modes

---

## 📊 Dashboard Page

### View Toggle
- **Pill-shaped toggle** at top to switch between List and Kanban views
- Smooth transition animation between views

### List View
- **Card-based vertical layout** showing all tasks
- Each task card displays: title, status badge, due date, source (voice command)
- Quick actions: mark complete, edit, delete
- Sort/filter options

### Kanban View
- **Horizontal columns** for task stages:
  - To Do
  - In Progress
  - Done
- **Drag-and-drop** cards between columns (touch-friendly)
- Swipe gestures on mobile to navigate columns
- Visual progress indicators

### Email Section
- Collapsible section showing email-related actions
- Subject/recipient preview
- Status badges (sent, pending, draft)

---

## ⚙️ Settings Page

### Preferences
- **Voice mode toggle** - enable/disable voice input
- **Auto-listen toggle** - start listening automatically
- **Theme preference** - light/dark mode

### About Section
- App version info
- How to use guide

---

## 🎨 Design System

### Mobile-First Layout
- **Safe area awareness** for modern phones
- **Touch-optimized** - minimum 44px tap targets
- **Bottom-heavy controls** - easy thumb reach
- **Horizontal scroll** for kanban on mobile

### Visual Style (Claude/OpenAI/Gemini inspired)
- **Pill-shaped buttons** with generous border-radius
- **Soft gradients** for the voice orb
- **Subtle shadows** and depth
- **Clean typography** with good hierarchy
- **Accent color** for interactive elements
- **Dark mode support**

---

## 🔧 Technical Setup

### Backend Requirements
- **Supabase Edge Function** to securely generate ElevenLabs conversation tokens
- Your **ElevenLabs API key** stored as a secret
- Your **ElevenLabs Agent ID** for connection

### Data Storage
- Tasks stored locally in browser (can upgrade to Supabase later if needed)
- Sync capability for cross-device access (future enhancement)

---

## 📱 Mobile Optimizations

- **Microphone permission handling** with friendly prompts
- **Touch gestures** - swipe to open menu, drag tasks in kanban
- **Responsive kanban** - horizontal scroll with snap points
- **PWA-ready** for home screen installation
