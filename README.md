# 💬 WhatsApp Clone

A full-stack real-time messaging application built with **React**, **Node.js**, **Socket.io**, and **MongoDB** — replicating core WhatsApp features including live chat, voice messages, calls, read receipts, and more.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based register & login with bcrypt password hashing
- 💬 **Real-time Messaging** — Instant delivery via Socket.io with typing & recording indicators
- 🎙️ **Voice Messages** — Record, send, and auto-transcribe audio using the Web Speech API
- 📁 **File & Image Sharing** — Send images and files with clipboard paste support
- ✅ **Read Receipts** — Single tick → double tick → blue ticks
- 📞 **Voice & Video Calls** — Ringing modal, active call overlay, and call duration timer
- 🟢 **Online Presence** — Live online/offline status for all contacts
- 🔔 **Unread Badges** — Animated per-contact unread message counts
- 🗑️ **Delete Messages** — Delete for me or delete for everyone
- 🌙 **Dark / Light Theme** — Persistent theme toggle
- 🖼️ **Chat Wallpapers** — Customizable chat background
- 🔇 **Mute & Block** — Mute notifications or block contacts
- 🔍 **Message Search** — Search within any conversation
- 👤 **Profile Editing** — Update username, avatar, and status

---

## 🛠️ Tech Stack

### Backend
| Technology | Role |
|---|---|
| Node.js + Express 5 | HTTP server & REST API |
| Socket.io 4 | Real-time WebSocket layer |
| MongoDB + Mongoose 9 | Database & ODM |
| JSON Web Tokens | Auth & session management |
| bcryptjs | Password hashing |

### Frontend
| Technology | Role |
|---|---|
| React 19 + Vite 8 | UI framework & build tool |
| React Router 7 | Client-side routing |
| Tailwind CSS 3 | Utility-first styling |
| Socket.io-client 4 | WebSocket client |
| Axios | HTTP client |
| emoji-picker-react | Emoji picker |
| lucide-react | SVG icon library |

---

## 📁 Project Structure

```
whatsapp-clone/
├── backend/
│   ├── server.js              # Entry point — HTTP + Socket.io
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Message.js         # Message schema (text, voice, file, call)
│   ├── routes/
│   │   ├── auth.js            # Register, login, profile
│   │   └── messages.js        # Send, fetch, delete, mark-read
│   ├── controllers/
│   │   └── messageController.js
│   └── middleware/
│       └── auth.js            # JWT verification middleware
│
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx    # Auth state + theme
        │   └── SocketContext.jsx  # Socket state + presence
        ├── hooks/
        │   ├── useVoiceRecorder.js
        │   ├── useSpeechToText.js
        │   ├── useTextToSpeech.js
        │   └── useUnreadCount.js
        ├── components/
        │   ├── Sidebar.jsx        # Contact list, search, settings
        │   ├── ChatWindow.jsx     # Full chat interface
        │   ├── ContextMenu.jsx    # Right-click message menu
        │   ├── DeleteModal.jsx    # Delete confirmation
        │   └── UnreadBadge.jsx    # Animated unread count
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            └── Home.jsx
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- MongoDB (local or Atlas)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/whatsapp-clone
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

Install dependencies and start:

```bash
npm install
npm run dev
```

### 3. Configure the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🌐 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Create a new account |
| POST | `/login` | ❌ | Login and receive JWT |
| GET | `/users` | ✅ | List all users |
| PUT | `/profile` | ✅ | Update username, avatar, or status |

### Messages — `/api/messages`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:senderId/:receiverId` | ✅ | Fetch full conversation history |
| POST | `/send` | ✅ | Send a message (HTTP fallback) |
| GET | `/unread-counts` | ✅ | Per-sender unread count map |
| PATCH | `/mark-read/:senderId` | ✅ | Mark messages as read |
| GET | `/last-messages/:userId` | ✅ | Last message per conversation |
| DELETE | `/clear/:senderId/:receiverId` | ✅ | Clear a conversation |
| POST | `/delete-bulk` | ✅ | Delete for me / delete for everyone |

---

## ⚡ Socket.io Events

### Client → Server

| Event | Description |
|---|---|
| `join` | Register user's personal room |
| `sendMessage` | Send a new message |
| `typing` / `stopTyping` | Typing indicators |
| `recording` / `stopRecording` | Voice recording indicators |
| `markAsRead` | Mark messages as read |
| `callUser` | Initiate a call |
| `callResponse` | Accept or decline a call |
| `endCall` | End an active call |

### Server → Client

| Event | Description |
|---|---|
| `receiveMessage` | New incoming message |
| `onlineUsers` | Updated list of online user IDs |
| `userTyping` / `userStoppedTyping` | Typing status |
| `userRecording` / `userStoppedRecording` | Recording status |
| `messagesRead` | Read receipt update |
| `messageDeleted` | Message deleted for everyone |
| `incomingCall` | Incoming call notification |
| `callEnded` | Active call was terminated |

---

## 🔒 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `FRONTEND_URL` | Allowed CORS origin for Socket.io |

---

## 🏁 Conclusion

This WhatsApp Clone is a comprehensive demonstration of building a production-grade, real-time full-stack application from scratch. It goes beyond a simple chat app — covering the full spectrum of modern web development challenges:

- **Real-time architecture** using Socket.io for bidirectional event-driven communication, handling everything from message delivery to live presence and call signaling.
- **Secure authentication** with JWT tokens, bcrypt hashing, and protected API routes that mirror industry standards.
- **Rich media support** including voice recording via the MediaRecorder API, speech-to-text transcription, text-to-speech playback, and file/image sharing with Base64 encoding.
- **Thoughtful UX details** like read receipts, typing indicators, unread badges, soft/hard message deletion, and per-user theme and wallpaper persistence.
- **Scalable data modeling** with Mongoose schemas designed to support multiple message types, soft deletes, and efficient aggregation for unread counts and conversation previews.

Whether you're using this as a learning resource, a portfolio project, or a foundation to build upon — the codebase is structured to be readable, modular, and easy to extend. Future enhancements could include group chats, push notifications, end-to-end encryption, cloud media storage (e.g. AWS S3), or a React Native mobile client.

Contributions, issues, and feature requests are welcome. If this project helped you, consider giving it a ⭐ on GitHub!

---

