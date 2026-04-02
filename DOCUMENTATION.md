# 📚 WhatsApp Clone — Full Project Documentation

> **Scope:** This document covers the complete project structure, all dependency versions, and a file-by-file reference guide. No source code has been modified.

---

## 📦 Dependency Versions

### Backend (`backend/package.json`)

| Package | Version | Role |
|---|---|---|
| `express` | `^5.2.1` | HTTP server & REST API framework |
| `mongoose` | `^9.3.3` | MongoDB ODM — schema definition & DB queries |
| `socket.io` | `^4.8.3` | Real-time WebSocket server |
| `jsonwebtoken` | `^9.0.3` | JWT generation & verification |
| `bcryptjs` | `^3.0.3` | Password hashing & comparison |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing middleware |
| `dotenv` | `^17.3.1` | Environment variable loader |
| `nodemon` | `^3.1.14` | Dev server auto-restart on file changes |

**Node.js Runtime:** v20.x (recommended)
**Entry point:** `server.js`
**Dev command:** `npm run dev` → runs `nodemon server.js`
**Prod command:** `npm start` → runs `node server.js`

---

### Frontend (`frontend/package.json`)

| Package | Version | Role |
|---|---|---|
| `react` | `^19.2.4` | Core UI library |
| `react-dom` | `^19.2.4` | React DOM renderer |
| `react-router-dom` | `^7.13.2` | Client-side routing (SPA navigation) |
| `axios` | `^1.14.0` | HTTP client for REST API calls |
| `socket.io-client` | `^4.8.3` | WebSocket client (pairs with backend Socket.io) |
| `lucide-react` | `^1.7.0` | Icon library (SVG icons as React components) |
| `emoji-picker-react` | `^4.18.0` | Emoji picker UI component |
| `tailwind-merge` | `^3.5.0` | Safely merges Tailwind class strings |
| `clsx` | `^2.1.1` | Utility for conditional className joining |

**Dev Dependencies:**

| Package | Version | Role |
|---|---|---|
| `vite` | `^8.0.1` | Build tool & dev server |
| `@vitejs/plugin-react` | `^6.0.1` | Vite plugin for React/JSX |
| `tailwindcss` | `^3.4.1` | Utility-first CSS framework |
| `postcss` | `^8.4.35` | CSS post-processor (required by Tailwind) |
| `autoprefixer` | `^10.4.18` | Auto-adds CSS vendor prefixes |
| `eslint` | `^9.39.4` | JavaScript/JSX linting |

**Dev command:** `npm run dev` → `vite` (local dev at `http://localhost:5173`)

---

## 🗂️ Complete File Structure

```
whatsapp-clone/
│
├── 📄 README.md                        # Project overview & setup guide
├── 📄 DOCUMENTATION.md                 # This file — full project reference
├── 📄 package.json                     # Root package config (workspace)
├── 📄 package-lock.json
│
├── 📁 backend/                         # Node.js + Express server
│   ├── 📄 .env                         # Environment secrets (not committed)
│   ├── 📄 package.json                 # Backend dependencies
│   ├── 📄 package-lock.json
│   ├── 📄 server.js                    # App entry point — HTTP + Socket.io
│   │
│   ├── 📁 models/
│   │   ├── 📄 User.js                  # Mongoose schema: User
│   │   └── 📄 Message.js               # Mongoose schema: Message
│   │
│   ├── 📁 routes/
│   │   ├── 📄 auth.js                  # Auth API routes (register, login, users)
│   │   └── 📄 messages.js              # Message API routes (send, fetch, delete)
│   │
│   ├── 📁 controllers/
│   │   └── 📄 messageController.js     # Extracted controller: unread counts & mark-read
│   │
│   └── 📁 middleware/
│       └── 📄 auth.js                  # JWT authentication middleware
│
└── 📁 frontend/                        # React SPA (Vite)
    ├── 📄 index.html                   # HTML entry point
    ├── 📄 package.json                 # Frontend dependencies
    ├── 📄 tailwind.config.js           # Tailwind theme config
    ├── 📄 postcss.config.js            # PostCSS config
    ├── 📄 vite.config.js               # Vite config
    │
    └── 📁 src/
        ├── 📄 main.jsx                 # React DOM root render
        ├── 📄 App.jsx                  # Root router + context wrappers
        ├── 📄 App.css                  # App-level styles
        ├── 📄 index.css                # Global styles + Tailwind directives
        │
        ├── 📁 assets/                  # Static assets (images, icons)
        │
        ├── 📁 context/
        │   ├── 📄 AuthContext.jsx      # Global auth state + theme toggle
        │   └── 📄 SocketContext.jsx    # Global socket state + presence tracking
        │
        ├── 📁 hooks/
        │   ├── 📄 useVoiceRecorder.js  # MediaRecorder API wrapper
        │   ├── 📄 useSpeechToText.js   # Web Speech API: speech → text
        │   ├── 📄 useTextToSpeech.js   # SpeechSynthesis API: text → speech
        │   └── 📄 useUnreadCount.js    # Unread message count state manager
        │
        ├── 📁 components/
        │   ├── 📄 Sidebar.jsx          # Left panel: contacts, search, settings
        │   ├── 📄 ChatWindow.jsx       # Right panel: full chat interface
        │   ├── 📄 ContextMenu.jsx      # Right-click message context menu
        │   ├── 📄 DeleteModal.jsx      # Delete message confirmation modal
        │   └── 📄 UnreadBadge.jsx      # Animated green unread count badge
        │
        └── 📁 pages/
            ├── 📄 Login.jsx            # Login page (email + password)
            ├── 📄 Register.jsx         # Registration page (username, email, password)
            └── 📄 Home.jsx             # Main app shell (Sidebar + ChatWindow)
```

---

## 🔒 Backend — File Reference

---

### `backend/.env`

Environment configuration file. **Never commit to version control.**

| Variable | Example Value | Description |
|---|---|---|
| `PORT` | `5000` | Port on which the Express server listens |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/whatsapp-clone` | MongoDB connection string |
| `JWT_SECRET` | `your_secret_key` | Secret used to sign/verify JSON Web Tokens |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for Socket.io |

---

### `backend/server.js`

**Role:** Application entry point. Initializes Express, Socket.io, MongoDB connection, and registers all socket event handlers.

**Key Responsibilities:**
- Creates the HTTP server wrapping Express.
- Initializes `socket.io` with CORS configured from `FRONTEND_URL`.
- Mounts REST routes: `/api/auth` and `/api/messages`.
- Sets `io` on `app` (`app.set('io', io)`) so controllers can emit events.
- Manages an in-memory `users` Map (`userId → Set<socketId>`) for online presence.
- Manages an in-memory `activeCalls` Map for ongoing call sessions.

**Socket Events Handled:**

| Event (Incoming) | Payload | Action |
|---|---|---|
| `join` | `userId: string` | Adds user to their personal room; broadcasts `onlineUsers` |
| `sendMessage` | Message document fields | Saves message to DB; emits `receiveMessage` to receiver's room |
| `callUser` | `{ senderId, receiverId, type }` | Forwards `incomingCall` event to receiver |
| `callResponse` | `{ accepted, from, to, type }` | Saves declined call record or stores active call session |
| `endCall` | `{ senderId, receiverId, type, duration }` | Saves call record; emits `callEnded`; cleans up `activeCalls` |
| `typing` | `{ senderId, receiverId }` | Emits `userTyping` to receiver's room |
| `stopTyping` | `{ senderId, receiverId }` | Emits `userStoppedTyping` to receiver's room |
| `recording` | `{ senderId, receiverId }` | Emits `userRecording` to receiver's room |
| `stopRecording` | `{ senderId, receiverId }` | Emits `userStoppedRecording` to receiver's room |
| `markAsRead` | `{ senderId, receiverId }` | Bulk-updates messages to `read: true`; emits `messagesRead` to sender |
| `disconnect` | _(automatic)_ | Removes socket from `users` Map; broadcasts updated `onlineUsers` |

---

### `backend/models/User.js`

**Role:** Mongoose schema and model for registered users.

**Schema Fields:**

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `username` | String | ✅ | — | Unique across users |
| `email` | String | ✅ | — | Unique across users |
| `password` | String | ✅ | — | Hashed via bcryptjs before save |
| `avatar` | String | ❌ | Flaticon user icon URL | Profile picture URL |
| `status` | String | ❌ | `"Hey there! I am using WhatsApp Clone."` | Bio/status message |
| `online` | Boolean | ❌ | `false` | Online presence flag |
| `createdAt` | Date | — | Auto | Mongoose timestamps |
| `updatedAt` | Date | — | Auto | Mongoose timestamps |

**Pre-save Hook:** Hashes `password` using `bcrypt.hash(password, 10)` when modified.

**Instance Method:** `comparePassword(candidatePassword)` — returns `true` if candidate matches stored hash.

---

### `backend/models/Message.js`

**Role:** Mongoose schema and model for all chat messages, including text, voice, files, and call records.

**Schema Fields:**

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `senderId` | ObjectId (ref: User) | ✅ | — | Message author |
| `receiverId` | ObjectId (ref: User) | ✅ | — | Message recipient |
| `content` | String | ❌ | — | Text body or call description |
| `type` | String (enum) | ❌ | `'text'` | One of: `text`, `voice`, `image`, `file`, `call` |
| `audioData` | String | ❌ | — | Base64-encoded audio (voice messages) |
| `transcript` | String | ❌ | — | Auto-transcribed text for voice messages |
| `fileUrl` | String | ❌ | — | Base64 or URL for image/file messages |
| `fileName` | String | ❌ | — | Original filename or call duration |
| `fileType` | String | ❌ | — | MIME type or call status (e.g. `Call declined`) |
| `timestamp` | Date | — | `Date.now` | Legacy timestamp field |
| `read` | Boolean | — | `false` | Read receipt status |
| `deletedForEveryone` | Boolean | — | `false` | True when sender deletes for all |
| `deletedFor` | [ObjectId] (ref: User) | — | `[]` | Users who deleted this message for themselves |
| `createdAt` | Date | — | Auto | Mongoose timestamps |
| `updatedAt` | Date | — | Auto | Mongoose timestamps |

---

### `backend/middleware/auth.js`

**Role:** Express middleware to protect routes with JWT verification.

**How It Works:**
1. Reads `Authorization` header, strips `"Bearer "` prefix.
2. Verifies token using `jwt.verify(token, JWT_SECRET)`.
3. Attaches `req.user = { _id: verified.id }` for downstream use.
4. Returns `401` if token is missing or invalid, `500` on unexpected errors.

**Usage:** Passed as a second argument to any protected route:
```js
router.get('/users', auth, async (req, res) => { ... });
```

---

### `backend/routes/auth.js`

**Role:** Express router for user authentication and profile management.

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Creates new user. Validates fields, checks duplicates, hashes password, returns JWT |
| `POST` | `/api/auth/login` | ❌ | Validates credentials via `comparePassword`, returns JWT |
| `GET` | `/api/auth/users` | ✅ | Returns all users (id, username, email, avatar, status, online) |
| `PUT` | `/api/auth/profile` | ✅ | Updates `username`, `avatar`, or `status` for the logged-in user |

**JWT Payload:** `{ id: user._id }` — expires in `1d`.

**Register Validation Rules:**
- All three fields (`username`, `email`, `password`) required.
- `password` must be ≥ 6 characters.
- `email` must include `@`.
- Username and email must both be unique.

---

### `backend/routes/messages.js`

**Role:** Express router for all message operations.

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/unread-counts` | ✅ | Returns unread per-sender count map for logged-in user (via controller) |
| `PATCH` | `/api/messages/mark-read/:senderId` | ✅ | Marks all messages from `senderId` as read; emits `messagesRead` socket event |
| `GET` | `/api/messages/last-messages/:userId` | ✅ | Aggregation: returns the most recent message per conversation |
| `GET` | `/api/messages/:senderId/:receiverId` | ✅ | Returns full message history between two users, sorted oldest-first |
| `POST` | `/api/messages/send` | ✅ | HTTP fallback to save a message (primary path is via Socket.io) |
| `DELETE` | `/api/messages/clear/:senderId/:receiverId` | ✅ | Hard-deletes all messages between two users |
| `GET` | `/api/messages/unread/:userId` | ✅ | Alternative unread count endpoint using MongoDB aggregation |
| `POST` | `/api/messages/delete-bulk` | ✅ | Deletes multiple messages; supports `"me"` (soft) or `"everyone"` (broadcast) |

**`delete-bulk` Logic:**
- `type === 'everyone'`: Only sender can trigger; sets `deletedForEveryone: true`, clears media fields, emits `messageDeleted` to both participants via Socket.io.
- `type === 'me'`: Adds `userId` to `deletedFor` array (soft delete visible only to requester).

---

### `backend/controllers/messageController.js`

**Role:** Extracted controller functions used by the messages router for unread count operations.

**Exported Functions:**

#### `getUnreadCounts(req, res)`
- Aggregates `Message` collection: groups by `senderId` where `receiverId === req.user._id` and `read === false`.
- Returns `{ unreadCounts: { [senderId]: count } }`.

#### `markMessagesAsRead(req, res)`
- Updates all messages from `req.params.senderId` to the logged-in user setting `read: true`.
- Emits `messagesRead` socket event to the sender's room so their UI updates read ticks.
- Returns `{ message: "Messages marked as read" }`.

---

## 🎨 Frontend — File Reference

---

### `frontend/src/main.jsx`

**Role:** React application bootstrap. Renders `<App />` into `#root` DOM node using `ReactDOM.createRoot`.

---

### `frontend/src/App.jsx`

**Role:** Root component. Sets up context providers and defines client-side routes.

**Provider nesting order:** `AuthProvider` → `SocketProvider` → `BrowserRouter` → `Routes`

**Routes:**

| Path | Component | Guard |
|---|---|---|
| `/login` | `<Login />` | Public |
| `/register` | `<Register />` | Public |
| `/` | `<Home />` | `PrivateRoute` (redirects to `/login` if not authenticated) |

**`PrivateRoute`:** Reads `user` and `loading` from `AuthContext`. Shows `"Loading..."` during initial auth hydration; redirects to `/login` if unauthenticated.

---

### `frontend/src/context/AuthContext.jsx`

**Role:** Global state container for authentication and UI theme.

**State:**

| State | Type | Description |
|---|---|---|
| `user` | `object \| null` | Logged-in user data (`id`, `username`, `email`, `avatar`) |
| `loading` | `boolean` | True during initial localStorage hydration |
| `theme` | `'light' \| 'dark'` | Current theme, persisted to `localStorage` |

**Context Values Exposed:** `{ user, login, register, logout, loading, theme, toggleTheme, updateUser }`

**Functions:**

| Function | Description |
|---|---|
| `login(email, password)` | POSTs to `/api/auth/login`; stores token & user in localStorage |
| `register(username, email, password)` | POSTs to `/api/auth/register`; stores token & user |
| `logout()` | Clears `chat-token` and `chat-user` from localStorage; nulls `user` state |
| `updateUser(updatedUser)` | Syncs updated user object to localStorage and state |
| `toggleTheme()` | Switches between `'light'` and `'dark'`; applies `dark` class to `<html>` |

**Side Effects:**
- On mount: hydrates `user` from `localStorage` (`chat-user` + `chat-token`); applies saved chat wallpaper CSS variable.
- On `theme` change: adds/removes `dark` class from `document.documentElement`; sets `data-theme` attribute.

---

### `frontend/src/context/SocketContext.jsx`

**Role:** Manages the Socket.io client connection and all real-time state derived from socket events.

**State:**

| State | Type | Description |
|---|---|---|
| `socket` | `Socket \| null` | Active Socket.io client instance |
| `onlineUsers` | `string[]` | Array of currently online user IDs |
| `typingUsers` | `{ [senderId]: boolean }` | Map of who is currently typing |
| `recordingUsers` | `{ [senderId]: boolean }` | Map of who is currently recording audio |
| `unreadCounts` | `{ [senderId]: number }` | Per-sender unread message counts |

**Context Values Exposed:** `{ socket, onlineUsers, typingUsers, recordingUsers, unreadCounts, setUnreadCounts }`

**Lifecycle:**
- When `user` logs in: creates `io('http://localhost:5000')`, emits `join` with `user.id`, fetches initial unread counts from `/api/messages/unread/:userId`.
- When `user` logs out: closes socket, resets to `null`.

**Real-time Subscriptions:**

| Event | Effect |
|---|---|
| `onlineUsers` | Updates `onlineUsers` state |
| `userTyping` | Sets `typingUsers[senderId] = true` |
| `userStoppedTyping` | Sets `typingUsers[senderId] = false` |
| `userRecording` | Sets `recordingUsers[senderId] = true` |
| `userStoppedRecording` | Sets `recordingUsers[senderId] = false` |
| `receiveMessage` | Increments `unreadCounts[senderId]` if message is not from self |
| `messagesRead` | Resets `unreadCounts[readerId]` to `0` |
| `disconnect` | Clears `typingUsers` and `recordingUsers` |

---

### `frontend/src/pages/Home.jsx`

**Role:** Main application shell. Orchestrates the `Sidebar` and `ChatWindow` components and manages top-level application state.

**State:**

| State | Type | Description |
|---|---|---|
| `contacts` | `User[]` | All registered users except the logged-in user |
| `lastMessages` | `{ [contactId]: { content, timestamp } }` | Most recent message per conversation |
| `selectedContact` | `User \| null` | Currently active chat contact |
| `blockedContacts` | `string[]` | List of blocked user IDs (in-memory) |
| `mutedContacts` | `string[]` | List of muted user IDs (in-memory) |

**Data Fetching:**
1. Fetches all users from `/api/auth/users`, filters out self.
2. Fetches last messages for the sidebar preview from `/api/messages/last-messages/:userId`.
3. Listens to `receiveMessage` socket event to update `lastMessages` in real time without re-fetching.

**Functions:**

| Function | Description |
|---|---|
| `toggleBlockContact(id)` | Adds/removes contact ID from `blockedContacts` |
| `toggleMuteContact(id)` | Adds/removes contact ID from `mutedContacts` |
| `clearChat()` | DELETEs conversation via `/api/messages/clear/:userId/:contactId`, then reloads |

**Layout:**
- Outer `div`: full-viewport flex container with WhatsApp teal header bar (`127px` decor div at `z-0`).
- Inner container: max-width `1600px`, centered, `shadow-2xl`, with responsive margin on `lg` screens.

---

### `frontend/src/pages/Login.jsx`

**Role:** Authentication login page.

- Controlled form with `email` and `password` fields, toggleable password visibility.
- Calls `login()` from `AuthContext` on submit.
- Navigates to `/` on success; displays error message on failure.
- Link to `/register` for new users.

---

### `frontend/src/pages/Register.jsx`

**Role:** User registration page.

- Controlled form with `username`, `email`, `password`, and `confirm password` fields with toggleable visibility.
- Client-side validation: passwords must match before submission.
- Calls `register()` from `AuthContext`.
- Navigates to `/` on success; displays error message on failure.
- Link to `/login` for existing users.

---

### `frontend/src/components/Sidebar.jsx`

**Role:** Left panel of the WhatsApp UI. One of the two largest components in the project.

**Features:**
- Contact list with avatar, last message preview, and unread badge.
- Search bar to filter contacts by name.
- "Unread Only" filter toggle.
- Top menu with access to Settings and Profile panels.
- Nested Settings panel: Privacy Settings, Desktop Notifications, Chat Settings, Wallpaper selector.
- Profile panel: editable username, status, and avatar.
- Light/Dark theme toggle.
- Logout button.
- Displays online/offline status, typing indicators, and recording indicators for each contact.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `contacts` | `User[]` | All available users to chat with |
| `lastMessages` | `object` | Last message map per contact |
| `selectedContact` | `User \| null` | Currently active chat |
| `setSelectedContact` | `function` | Callback to select a contact |
| `clearChat` | `function` | Callback to clear current conversation |
| `mutedContacts` | `string[]` | IDs of muted contacts |

---

### `frontend/src/components/ChatWindow.jsx`

**Role:** Right panel of the WhatsApp UI. The largest component in the project.

**Features:**
- Full message thread with date separators.
- Message bubbles with type-aware rendering: text, voice (with audio player), image, file attachment, call record.
- Message read status indicator: single tick (sent), double tick (delivered), blue ticks (read).
- Typing and recording indicator in the header.
- Emoji picker (via `emoji-picker-react`).
- Voice recording bar with live timer and Socket.io `recording`/`stopRecording` events.
- File/image picker and clipboard paste support.
- Context menu (right-click) on messages for copy, delete, or forward actions.
- Contact Info sliding panel (right side): avatar, name, status, mute/block toggles.
- Voice and Video call UI with ringing modal, active call overlay, and call timer.
- Message search within the current chat.
- "Delete for Me" / "Delete for Everyone" via `DeleteModal`.
- Clear chat integration.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `selectedContact` | `User \| null` | The contact being chatted with |
| `contacts` | `User[]` | Full contact list (for call routing, etc.) |
| `clearChat` | `function` | Clears the current conversation |
| `setSelectedContact` | `function` | Deselects contact (back navigation) |
| `blockedContacts` | `string[]` | Blocked user IDs |
| `mutedContacts` | `string[]` | Muted user IDs |
| `toggleBlockContact` | `function` | Toggles block status for a contact |
| `toggleMuteContact` | `function` | Toggles mute status for a contact |

---

### `frontend/src/components/ContextMenu.jsx`

**Role:** Right-click context menu overlay for individual messages.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `x` | `number` | Horizontal position (px) |
| `y` | `number` | Vertical position (px) |
| `onCopy` | `function` | Copies message text to clipboard |
| `onDeleteForMe` | `function` | Triggers soft delete for current user |
| `onDeleteForEveryone` | `function` | Triggers broadcast delete |
| `onClose` | `function` | Dismisses the context menu |
| `isSender` | `boolean` | Controls whether "Delete for Everyone" option is shown |

---

### `frontend/src/components/DeleteModal.jsx`

**Role:** Confirmation modal for bulk or single message deletion.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `count` | `number` | Number of selected messages |
| `onDeleteForMe` | `function` | Confirms soft delete |
| `onDeleteForEveryone` | `function` | Confirms broadcast delete |
| `onCancel` | `function` | Cancels and closes the modal |
| `isSender` | `boolean` | Whether the user is the sender (shows "Delete for Everyone") |

---

### `frontend/src/components/UnreadBadge.jsx`

**Role:** Animated green badge displaying unread message count. Renders `null` if count is zero.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `count` | `number` | — | Unread message count |
| `size` | `'sm' \| 'md'` | `'md'` | Controls badge dimensions and text size |

**Behavior:**
- Caps display at `"99+"` for counts above 99.
- Uses `animate-badge-pop` (Tailwind custom animation) for a pop-in entrance effect.
- Styled with WhatsApp green (`#25D366`).

---

## 🪝 Hooks — File Reference

---

### `frontend/src/hooks/useVoiceRecorder.js`

**Role:** Custom hook wrapping the browser `MediaRecorder` API for in-app audio recording.

**Parameters:**
- `onStop(base64Audio: string)` — callback fired with Base64-encoded audio data when recording stops.

**Returns:**

| Value | Type | Description |
|---|---|---|
| `isRecording` | `boolean` | True while recording is active |
| `recordingTime` | `number` | Elapsed recording seconds |
| `startRecording()` | `function` | Requests microphone access and starts recording |
| `stopRecording()` | `function` | Stops recording and triggers `onStop` |
| `formatTime(seconds)` | `function` | Formats seconds as `M:SS` string |

**Implementation Notes:**
- Audio is captured as `audio/webm` blobs.
- On stop, blobs are combined and converted to Base64 via `FileReader.readAsDataURL`.
- All media tracks are stopped after recording to release the microphone.

---

### `frontend/src/hooks/useSpeechToText.js`

**Role:** Custom hook wrapping the `Web Speech API` (`SpeechRecognition`) for live speech transcription.

**Parameters:**
- `onTextFound(finalTranscript: string)` — callback fired when a final (committed) transcript is available.

**Returns:**

| Value | Type | Description |
|---|---|---|
| `isRecording` | `boolean` | True while recognition is active |
| `transcript` | `string` | Current transcription (interim or final) |
| `isFinal` | `boolean` | True when the current result is a committed final transcript |
| `startRecording()` | `function` | Starts speech recognition |
| `stopRecording()` | `function` | Stops recognition session |

**Configuration:** `lang: 'en-US'`, `interimResults: true`, `continuous: true`.

---

### `frontend/src/hooks/useTextToSpeech.js`

**Role:** Custom hook wrapping the browser `SpeechSynthesis` API to read messages aloud.

**Returns:**

| Value | Type | Description |
|---|---|---|
| `speak(text)` | `function` | Cancels any active speech, then speaks the given text |
| `stop()` | `function` | Immediately cancels ongoing speech synthesis |
| `isPlaying` | `boolean` | True while synthesis is active |

**Configuration:** `lang: 'en-US'`, `rate: 1`, `pitch: 1`.

---

### `frontend/src/hooks/useUnreadCount.js`

**Role:** Custom hook that manages unread message count state with both HTTP initialization and real-time Socket.io sync.

**Returns:**

| Value | Type | Description |
|---|---|---|
| `unreadCounts` | `{ [senderId]: number }` | Per-contact unread counts |
| `totalUnread` | `number` | Sum of all unread counts |
| `markAsRead(senderId)` | `async function` | PATCHes mark-read API and removes sender from local count map |

**Lifecycle:**
1. On mount: fetches initial counts from `/api/messages/unread-counts`.
2. On `receiveMessage` socket event: increments count for that sender.
3. On `messagesRead` socket event: removes sender from counts (resets to 0).

---

## 🌐 API Reference Summary

### Authentication (`/api/auth`)

| Method | Endpoint | Body/Params | Auth | Response |
|---|---|---|---|---|
| POST | `/register` | `{ username, email, password }` | ❌ | `{ token, user }` |
| POST | `/login` | `{ email, password }` | ❌ | `{ token, user }` |
| GET | `/users` | — | ✅ | `User[]` |
| PUT | `/profile` | `{ username?, avatar?, status? }` | ✅ | Updated user object |

### Messages (`/api/messages`)

| Method | Endpoint | Auth | Response |
|---|---|---|---|
| GET | `/unread-counts` | ✅ | `{ unreadCounts: { [senderId]: count } }` |
| PATCH | `/mark-read/:senderId` | ✅ | `{ message: "Messages marked as read" }` |
| GET | `/last-messages/:userId` | ✅ | `Message[]` (one per conversation) |
| GET | `/:senderId/:receiverId` | ✅ | `Message[]` (full history, sorted asc) |
| POST | `/send` | ✅ | Created `Message` document |
| DELETE | `/clear/:senderId/:receiverId` | ✅ | `{ message: "Conversation cleared successfully" }` |
| GET | `/unread/:userId` | ✅ | `[{ _id: senderId, count }]` |
| POST | `/delete-bulk` | ✅ | `{ success: true, count }` |

---

## ⚡ Socket.io Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join` | `userId: string` | Joins personal room for targeted events |
| `sendMessage` | Message fields | Saves and delivers a new message |
| `callUser` | `{ senderId, receiverId, type }` | Initiates a call |
| `callResponse` | `{ accepted, from, to, type }` | Accepts or declines an incoming call |
| `endCall` | `{ senderId, receiverId, type, duration }` | Ends active call |
| `typing` | `{ senderId, receiverId }` | Notifies recipient of typing activity |
| `stopTyping` | `{ senderId, receiverId }` | Clears typing notification |
| `recording` | `{ senderId, receiverId }` | Notifies recipient of voice recording |
| `stopRecording` | `{ senderId, receiverId }` | Clears recording notification |
| `markAsRead` | `{ senderId, receiverId }` | Marks messages as read in DB |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `onlineUsers` | `string[]` | Updated list of online user IDs |
| `receiveMessage` | Message document | New message delivered to recipient |
| `incomingCall` | `{ from, type }` | Incoming call notification |
| `callResponse` | `{ accepted, from }` | Call acceptance/rejection result |
| `callEnded` | — | Active call was terminated |
| `userTyping` | `{ senderId }` | A user started typing |
| `userStoppedTyping` | `{ senderId }` | A user stopped typing |
| `userRecording` | `{ senderId }` | A user started recording audio |
| `userStoppedRecording` | `{ senderId }` | A user stopped recording audio |
| `messagesRead` | `{ readerId }` | Messages were read — update ticks |
| `messageDeleted` | `{ messageId, deletedForEveryone }` | A message was deleted for everyone |

---

## 🗄️ MongoDB Collections

### `users` Collection
Managed by `User.js` model. Stores user accounts.

### `messages` Collection
Managed by `Message.js` model. Stores all message types including text, voice, image, file, and call records.

**Useful Aggregation Patterns used in the codebase:**
- **Last message per conversation:** Groups by normalized sender/receiver pair; picks `$first` after `$sort` by `createdAt` descending.
- **Unread counts per sender:** Matches `{ receiverId, read: false }`; groups by `senderId` with `$sum: 1`.

---

*Documentation generated from source code. No code was modified during this process.*
