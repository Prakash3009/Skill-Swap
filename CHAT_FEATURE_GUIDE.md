# CHAT & SCHEDULE FEATURE - IMPLEMENTATION GUIDE

## ✅ FEATURE STATUS: **FULLY IMPLEMENTED**

This document describes the complete implementation of the Chat & Schedule feature for SkillSwap.

---

## 📋 OVERVIEW

**Feature Type:** Request-based messaging (NOT real-time)
**Scope:** Per mentorship request
**Access:** Only available for ACCEPTED requests
**Tech:** Fetch API (no Socket.io, no WebSockets)

---

## 🗄️ DATABASE SCHEMAS

### 1. Message Model
**Location:** `server/models/Message.js`

```javascript
const messageSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorshipRequest',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
```

**Key Points:**
- Messages are scoped to a specific mentorship request
- Sender is tracked via `senderId`
- Simple text-based messages (max 1000 chars)
- Chronological ordering via `createdAt`

---

## 🔌 BACKEND ROUTES

**Location:** `server/routes/requestRoutes.js`

### 1. POST /api/requests/:id/message
**Purpose:** Send a message in a mentorship request thread

**Request Body:**
```json
{
  "senderId": "userId",
  "message": "Hello, when can we meet?"
}
```

**Validation:**
- Verifies request exists
- Checks sender is part of the request (learner or mentor)
- Requires both senderId and message

**Response:**
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "_id": "messageId",
    "requestId": "requestId",
    "senderId": { "name": "John", "email": "john@example.com" },
    "message": "Hello, when can we meet?",
    "createdAt": "2026-01-29T00:00:00.000Z"
  }
}
```

---

### 2. GET /api/requests/:id/messages
**Purpose:** Get all messages for a mentorship request

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "messageId",
      "senderId": { "name": "John", "email": "john@example.com" },
      "message": "Hello!",
      "createdAt": "2026-01-29T00:00:00.000Z"
    }
  ]
}
```

**Features:**
- Messages sorted chronologically (oldest first)
- Sender info populated automatically
- Returns empty array if no messages

---

### 3. POST /api/requests/:id/schedule
**Purpose:** Propose a meeting schedule (mentor only)

**Request Body:**
```json
{
  "date": "2026-02-01",
  "time": "14:00",
  "note": "Google Meet link: https://meet.google.com/xyz"
}
```

**Validation:**
- Requires date and time
- Note is optional (for meeting details)

**Response:**
```json
{
  "success": true,
  "message": "Schedule proposed successfully",
  "data": {
    "suggestedDate": "2026-02-01",
    "suggestedTime": "14:00",
    "sessionNotes": "Google Meet link: https://meet.google.com/xyz"
  }
}
```

**Implementation Note:**
- Schedule is stored in the `MentorshipRequest` model
- Uses existing `suggestedDate`, `suggestedTime`, and `sessionNotes` fields
- Simple text-based storage (no calendar integration)

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. Messages Page
**Location:** `client/messages.html`

**Features:**
- Request info display (mentor & learner names)
- Message thread with sender identification
- Send message form
- Meeting schedule proposal form
- Auto-refresh every 10 seconds (simple polling)

**URL Format:**
```
http://localhost:3000/messages.html?id=REQUEST_ID
```

**Key Components:**

#### Message Thread Display
```javascript
function displayMessages(messages) {
    const container = document.getElementById('messages-thread');
    
    container.innerHTML = messages.map(msg => {
        const isOwn = msg.senderId._id === currentUserId;
        return `
            <div class="message-item ${isOwn ? 'own' : 'other'}">
                <div class="message-sender">${msg.senderId.name}</div>
                <div class="message-text">${msg.message}</div>
                <div class="message-time">${timeAgo(msg.createdAt)}</div>
            </div>
        `;
    }).join('');
}
```

#### Send Message
```javascript
document.getElementById('send-message-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = document.getElementById('message-input').value;
    
    const response = await fetch(`${API_URL}/requests/${requestId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            senderId: currentUserId,
            message
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        document.getElementById('message-input').value = '';
        loadMessages(); // Reload messages
    }
});
```

#### Schedule Meeting
```javascript
document.getElementById('schedule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        date: document.getElementById('meeting-date').value,
        time: document.getElementById('meeting-time').value,
        note: document.getElementById('meeting-note').value
    };
    
    const response = await fetch(`${API_URL}/requests/${requestId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
        showAlert('Meeting schedule proposed successfully!', 'success');
    }
});
```

#### Auto-Refresh (Polling)
```javascript
// Refresh messages every 10 seconds
setInterval(loadMessages, 10000);
```

---

### 2. Integration with Requests Page
**Location:** `client/requests.html`

**Message Button Added:**
- Appears for ACCEPTED requests only
- Available in both incoming (mentor) and outgoing (learner) views
- Links to `messages.html?id=REQUEST_ID`

**Mentor View (Incoming Requests):**
```javascript
${req.status === 'accepted'
    ? `<button class="btn btn-success btn-sm" onclick="completeRequest('${req._id}')">Mark as Completed</button>
       <a href="messages.html?id=${req._id}" class="btn btn-secondary btn-sm">💬 Message</a>`
    : ''
}
```

**Learner View (Outgoing Requests):**
```javascript
${req.status === 'accepted'
    ? `<div class="d-flex gap-2">
         <p class="text-muted">Mentorship in progress...</p>
         <a href="messages.html?id=${req._id}" class="btn btn-secondary btn-sm">💬 Message</a>
       </div>`
    : ''
}
```

---

## 🔒 SECURITY & VALIDATION

### Backend Validation
1. **Request Existence:** Verifies mentorship request exists
2. **User Authorization:** Checks sender is part of the request
3. **Input Validation:** Validates required fields
4. **Message Length:** Limits message to 1000 characters

### Frontend Validation
1. **User Authentication:** Checks localStorage for userId
2. **Request ID:** Validates requestId from URL params
3. **Form Validation:** HTML5 required attributes
4. **Error Handling:** Try-catch blocks with user feedback

---

## 📊 USER FLOW

### Complete Messaging Flow:

1. **Learner sends mentorship request** → Status: `pending`
2. **Mentor accepts request** → Status: `accepted`
3. **💬 Message button appears** for both users
4. **Click Message button** → Opens `messages.html?id=REQUEST_ID`
5. **Send messages** → Fetch API POST request
6. **View messages** → Auto-refresh every 10 seconds
7. **Mentor proposes schedule** → Date, time, meeting link
8. **Continue communication** until mentorship complete

---

## 🚫 CONSTRAINTS (AS REQUIRED)

✅ **NO Socket.io** - Using simple fetch API
✅ **NO WebSockets** - Polling-based updates
✅ **NO real-time chat** - 10-second refresh interval
✅ **NO video/audio** - Text-based only
✅ **NO external APIs** - Self-contained
✅ **Hackathon MVP** - Simple and reliable

---

## 🧪 TESTING GUIDE

### Test Scenario:
1. Create two users (User A and User B)
2. User A sends mentorship request to User B
3. User B accepts the request
4. Both users see "💬 Message" button
5. Click button → Opens messages page
6. Send messages from both sides
7. Verify messages appear in chronological order
8. Propose a meeting schedule (as mentor)
9. Verify schedule appears in session notes

### API Testing (Postman/cURL):

**Send Message:**
```bash
curl -X POST http://localhost:3000/api/requests/REQUEST_ID/message \
  -H "Content-Type: application/json" \
  -d '{"senderId":"USER_ID","message":"Hello!"}'
```

**Get Messages:**
```bash
curl http://localhost:3000/api/requests/REQUEST_ID/messages
```

**Propose Schedule:**
```bash
curl -X POST http://localhost:3000/api/requests/REQUEST_ID/schedule \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-02-01","time":"14:00","note":"Google Meet"}'
```

---

## 📁 FILE STRUCTURE

```
SkillSwap/
├── server/
│   ├── models/
│   │   └── Message.js          ✅ Message schema
│   └── routes/
│       └── requestRoutes.js    ✅ Messaging routes (lines 389-519)
└── client/
    ├── messages.html            ✅ Messaging UI
    └── requests.html            ✅ Updated with Message buttons
```

---

## 🎯 KEY FEATURES SUMMARY

| Feature | Status | Description |
|---------|--------|-------------|
| Message Model | ✅ | MongoDB schema for messages |
| Send Message API | ✅ | POST endpoint with validation |
| Get Messages API | ✅ | GET endpoint with population |
| Schedule API | ✅ | POST endpoint for meeting proposal |
| Messages UI | ✅ | Full page with thread display |
| Message Buttons | ✅ | Added to accepted requests |
| Auto-Refresh | ✅ | 10-second polling |
| User Validation | ✅ | Authorization checks |

---

## 🚀 DEPLOYMENT STATUS

✅ **All features committed and pushed to GitHub**
✅ **Server running on http://localhost:3000**
✅ **Ready for hackathon demo**

---

## 💡 FUTURE ENHANCEMENTS (Post-Hackathon)

- Real-time messaging with Socket.io
- Read receipts
- File/image sharing
- Calendar integration
- Push notifications
- Message search
- Delete/edit messages

---

**Last Updated:** 2026-01-29
**Implementation Status:** COMPLETE ✅
