# WhatsApp Architecture - Vanigan Platform

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Component Breakdown](#component-breakdown)
- [Message Flow](#message-flow)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Data Models](#data-models)
- [Security & Authentication](#security--authentication)
- [Scalability Considerations](#scalability-considerations)

---

## Overview

The Vanigan WhatsApp Bot is built on **Meta's WhatsApp Cloud API (v18.0)** and uses a **state machine architecture** to handle conversational flows. It enables users to discover businesses, connect with organizers, register businesses, and stay updated with local news—all within WhatsApp.

### Key Technologies
- **Backend**: Node.js + Express.js
- **API Client**: Axios
- **WhatsApp API**: Meta Cloud API v18.0
- **Session Storage**: In-memory (upgradeable to Redis/MongoDB)
- **Deployment**: Render (Backend) + Vercel (Frontend)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (WhatsApp Client)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Sends Message
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Meta WhatsApp Cloud API (v18.0)                 │
│  • Receives user messages                                    │
│  • Validates webhook signature                               │
│  • Forwards payload to webhook endpoint                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /webhook
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vanigan Bot Server (Express)                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Webhook Handler (POST /webhook)                     │   │
│  │  • Parses incoming message payload                   │   │
│  │  • Extracts message type (text, interactive, media)  │   │
│  │  • Identifies user (from phone number)               │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│                       ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Session Manager                                      │   │
│  │  • Retrieves or creates user session                 │   │
│  │  • Tracks current state & navigation history         │   │
│  │  • Stores temporary form data                        │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│                       ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Machine Controller                            │   │
│  │  • Routes to appropriate handler based on state      │   │
│  │  • Processes user input                              │   │
│  │  • Updates session state                             │   │
│  │  • Determines next response                          │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│                       ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Response Generator                                   │   │
│  │  • Formats response (text, list, buttons, media)     │   │
│  │  • Calls WhatsApp API to send message                │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        │ POST to Meta API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Meta WhatsApp Cloud API (v18.0)                 │
│  • Sends formatted message to user                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Delivers Message
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     USER (WhatsApp Client)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Webhook Handler (`POST /webhook`)
**Responsibility**: Entry point for all incoming WhatsApp messages.

**Process**:
1. Receives POST request from Meta's servers
2. Validates webhook structure (`body.object`, `body.entry`)
3. Extracts message details:
   - `message.from` → User phone number (userId)
   - `message.type` → text, interactive, location, image
   - `message.text.body` → User's text input
   - `message.interactive.list_reply.id` → Selected list option
   - `message.interactive.button_reply.id` → Clicked button

**Code Location**: `index.js` lines 200-250

---

### 2. Session Manager
**Responsibility**: Maintains user conversation state across messages.

**Data Structure**:
```javascript
sessions = {
  "919876543210": {
    state: "BUSINESS_CATEGORY",
    history: ["MAIN", "BUSINESS_LIST"],
    temp: {
      businessName: "Sri Lakshmi Textiles",
      ownerName: "Raj"
    }
  }
}
```

**Key Functions**:
- `getSession(userId)` → Retrieves or initializes session
- `updateState(session, newState)` → Pushes current state to history, sets new state
- `goBack(session)` → Pops last state from history

**Code Location**: `index.js` lines 80-95

---

### 3. State Machine Controller
**Responsibility**: Routes user input to appropriate handlers based on current state.

**State Flow Example**:
```
MAIN → BUSINESS_CATEGORY → BUSINESS_SUB_CATEGORY → BUSINESS_LIST → BUSINESS_DETAILS
```

**Handler Logic**:
```javascript
switch (session.state) {
  case 'MAIN':
    if (text === '1') {
      updateState(session, 'BUSINESS_CATEGORY');
      // Send category list
    }
    break;
  
  case 'BUSINESS_CATEGORY':
    updateState(session, 'BUSINESS_SUB_CATEGORY');
    // Send sub-category list
    break;
}
```

**Code Location**: `index.js` lines 250-350

---

### 4. Response Generator
**Responsibility**: Formats and sends messages back to users via Meta API.

**Message Types**:

#### a) Text Message
```javascript
sendTextMessage(to, text)
```
- Simple plain text responses
- Used for confirmations, errors, simple menus

#### b) Interactive List Message
```javascript
sendListMessage(to, title, body, buttonLabel, sections)
```
- Displays up to 10 options in a scrollable list
- Used for: Main Menu, Categories, District Selection
- Example:
```javascript
sections: [{
  title: 'Industries',
  rows: [
    { id: 'retail', title: 'Retail' },
    { id: 'mfg', title: 'Manufacturing' }
  ]
}]
```

#### c) Interactive Buttons Message
```javascript
sendButtonsMessage(to, body, buttons)
```
- Displays up to 3 quick-reply buttons
- Used for: Business Details (Call, Location, Back)
- Example:
```javascript
buttons: [
  { id: 'call', title: 'Call' },
  { id: 'map', title: 'Location' }
]
```

#### d) Image Message
```javascript
sendImageMessage(to, imageUrl, caption)
```
- Sends image with optional caption
- Used for: Welcome banner, business gallery photos

**Code Location**: `index.js` lines 100-180

---

## Message Flow

### Example: User Searches for a Business

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User sends "Hi"                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot Response:                                                │
│ • Sends welcome banner image                                 │
│ • Sends interactive list with Main Menu options             │
│ • State: MAIN                                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: User selects "Business List" (id: '1')              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot Response:                                                │
│ • Sends category list (Retail, Manufacturing, etc.)          │
│ • State: BUSINESS_CATEGORY                                   │
│ • History: ['MAIN']                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: User selects "Retail" (id: 'retail')                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot Response:                                                │
│ • Sends sub-category list (Clothing, Electronics, etc.)      │
│ • State: BUSINESS_SUB_CATEGORY                               │
│ • History: ['MAIN', 'BUSINESS_CATEGORY']                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: User selects "Clothing" (id: 'clothing')            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot Response:                                                │
│ • Sends list of businesses (Sri Lakshmi Textiles, etc.)     │
│ • State: BUSINESS_LIST                                       │
│ • History: ['MAIN', 'BUSINESS_CATEGORY', 'BUSINESS_SUB...'] │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: User selects "Sri Lakshmi Textiles" (id: '1')       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot Response:                                                │
│ • Sends business details with buttons (Call, Location)       │
│ • State: BUSINESS_DETAILS                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: User clicks "Call" button (id: 'call')              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Bot Response:                                                │
│ • Initiates phone call or sends phone number                 │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management

### State Definitions

| State | Description | Next Possible States |
|-------|-------------|---------------------|
| `MAIN` | Main menu | BUSINESS_CATEGORY, ORG_DISTRICT, MEMBERS_DISTRICT, ADD_BUSINESS_NAME, SUBSCRIPTION, NEWS_DISTRICT |
| `BUSINESS_CATEGORY` | Business category selection | BUSINESS_SUB_CATEGORY |
| `BUSINESS_SUB_CATEGORY` | Sub-category selection | BUSINESS_LIST |
| `BUSINESS_LIST` | List of businesses | BUSINESS_DETAILS |
| `BUSINESS_DETAILS` | Individual business info | MAIN (via back button) |
| `ORG_DISTRICT` | Organizer district selection | ORG_ASSEMBLY |
| `ORG_ASSEMBLY` | Organizer assembly selection | ORGANIZER_LIST |
| `ORGANIZER_LIST` | List of organizers | ORGANIZER_DETAILS |
| `ADD_BUSINESS_NAME` | Business registration flow | ADD_BUSINESS_OWNER |
| `ADD_BUSINESS_OWNER` | Owner name input | ADD_BUSINESS_PHONE |
| `SUBSCRIPTION` | Subscription plans | SUB_MONTHLY, SUB_YEARLY, SUB_LIFETIME |

### Navigation Controls

**Global Commands**:
- `9` → Return to MAIN menu (resets history)
- `0` → Go back one step (pops from history)

**Implementation**:
```javascript
if (text === '9') {
  session.state = 'MAIN';
  session.history = [];
} else if (text === '0') {
  goBack(session);
}
```

---

## API Integration

### Meta WhatsApp Cloud API Endpoints

#### 1. Send Message
```
POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
```

**Headers**:
```javascript
{
  'Authorization': 'Bearer {WHATSAPP_API_TOKEN}',
  'Content-Type': 'application/json'
}
```

**Payload (Text Message)**:
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "text",
  "text": {
    "body": "Welcome to Vanigan!"
  }
}
```

**Payload (Interactive List)**:
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Main Menu"
    },
    "body": {
      "text": "Select an option"
    },
    "action": {
      "button": "Open Options",
      "sections": [
        {
          "title": "Services",
          "rows": [
            {
              "id": "1",
              "title": "Business List",
              "description": "Find local businesses"
            }
          ]
        }
      ]
    }
  }
}
```

#### 2. Webhook Verification (GET)
```
GET /webhook?hub.mode=subscribe&hub.verify_token={TOKEN}&hub.challenge={CHALLENGE}
```

**Response**: Return `hub.challenge` if token matches.

#### 3. Webhook Message Receiver (POST)
```
POST /webhook
```

**Incoming Payload Structure**:
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Hi"
          }
        }]
      }
    }]
  }]
}
```

---

## Data Models

### Session Object
```javascript
{
  state: String,        // Current conversation state
  history: [String],    // Stack of previous states
  temp: {               // Temporary form data
    businessName: String,
    ownerName: String,
    phoneNumber: String,
    category: String,
    description: String,
    location: Object,
    photos: [String]
  }
}
```

### Business Entity (Future Database Schema)
```javascript
{
  id: String,
  name: String,
  ownerName: String,
  phoneNumber: String,
  category: String,
  subCategory: String,
  description: String,
  district: String,
  assembly: String,
  address: String,
  location: {
    lat: Number,
    lng: Number,
    mapUrl: String
  },
  photos: [String],
  createdAt: Date,
  status: String  // 'pending', 'approved', 'rejected'
}
```

### Organizer Entity
```javascript
{
  id: String,
  name: String,
  role: String,
  district: String,
  assembly: String,
  phoneNumber: String,
  email: String
}
```

### Member Entity
```javascript
{
  id: String,
  name: String,
  businessType: String,
  phoneNumber: String,
  district: String,
  assembly: String
}
```

---

## Security & Authentication

### Current Implementation

1. **Webhook Verification**:
   - Uses `WHATSAPP_VERIFY_TOKEN` to validate Meta's webhook setup
   - Prevents unauthorized webhook registrations

2. **API Token Security**:
   - `WHATSAPP_API_TOKEN` stored in environment variables
   - Never exposed in client-side code

3. **User Identification**:
   - Uses WhatsApp phone number as unique identifier
   - No additional authentication required (WhatsApp handles it)

### Recommended Enhancements

1. **Webhook Signature Validation**:
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', process.env.APP_SECRET)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${hash}`;
}
```

2. **Rate Limiting**:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute per user
});

app.use('/webhook', limiter);
```

3. **Input Sanitization**:
```javascript
function sanitizeInput(text) {
  return text.trim().replace(/[<>]/g, '');
}
```

---

## Scalability Considerations

### Current Limitations

1. **In-Memory Sessions**:
   - Lost on server restart
   - Not suitable for multiple server instances
   - Limited by server RAM

2. **Hardcoded Data**:
   - Business/member lists are static
   - No dynamic updates

3. **Single Server**:
   - No load balancing
   - Single point of failure

### Recommended Upgrades

#### 1. Persistent Session Storage (Redis)
```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

async function getSession(userId) {
  const data = await client.get(`session:${userId}`);
  return data ? JSON.parse(data) : { state: 'MAIN', history: [], temp: {} };
}

async function saveSession(userId, session) {
  await client.set(`session:${userId}`, JSON.stringify(session), {
    EX: 3600 // Expire after 1 hour
  });
}
```

#### 2. Database Integration (MongoDB)
```javascript
const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  name: String,
  ownerName: String,
  phoneNumber: String,
  category: String,
  district: String,
  location: {
    lat: Number,
    lng: Number
  },
  status: { type: String, default: 'pending' }
});

const Business = mongoose.model('Business', BusinessSchema);

// Dynamic business listing
async function getBusinessesByCategory(category) {
  return await Business.find({ category, status: 'approved' });
}
```

#### 3. Message Queue (Bull/RabbitMQ)
```javascript
const Queue = require('bull');
const messageQueue = new Queue('whatsapp-messages', process.env.REDIS_URL);

// Producer
messageQueue.add({ userId, message });

// Consumer
messageQueue.process(async (job) => {
  const { userId, message } = job.data;
  await processMessage(userId, message);
});
```

#### 4. Load Balancing Architecture
```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Nginx)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
         │ Server 1│    │ Server 2│   │ Server 3│
         └────┬────┘    └────┬────┘   └────┬────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Cluster  │
                    │  (Shared State) │
                    └─────────────────┘
```

#### 5. Monitoring & Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Message received', { userId, messageType });
logger.error('API call failed', { error: err.message });
```

---

## Performance Metrics

### Current Capacity
- **Concurrent Users**: ~100 (limited by in-memory storage)
- **Response Time**: 200-500ms (depends on Meta API latency)
- **Message Throughput**: ~10 messages/second

### Target Capacity (With Upgrades)
- **Concurrent Users**: 10,000+
- **Response Time**: <300ms
- **Message Throughput**: 100+ messages/second
- **Uptime**: 99.9%

---

## Deployment Architecture

### Current Setup
```
┌──────────────────────────────────────────────────────────┐
│                    Meta WhatsApp API                      │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Render (Bot Backend)                         │
│  • Node.js + Express                                      │
│  • In-memory sessions                                     │
│  • Auto-deploy from GitHub                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              Vercel (Frontend)                            │
│  • React + Vite                                           │
│  • Static site hosting                                    │
└──────────────────────────────────────────────────────────┘
```

### Recommended Production Setup
```
┌──────────────────────────────────────────────────────────┐
│                    Meta WhatsApp API                      │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              AWS Application Load Balancer                │
└────────────────────────┬─────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
┌─────────────────────┐   ┌─────────────────────┐
│   ECS/Fargate       │   │   ECS/Fargate       │
│   (Bot Instance 1)  │   │   (Bot Instance 2)  │
└──────────┬──────────┘   └──────────┬──────────┘
           │                         │
           └────────────┬────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   ElastiCache (Redis)  │
           │   (Session Storage)    │
           └────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   RDS (PostgreSQL)     │
           │   (Business Data)      │
           └────────────────────────┘
```

---

## Conclusion

The Vanigan WhatsApp Bot architecture is designed for rapid prototyping and MVP deployment. The current in-memory state management and hardcoded data work well for small-scale testing but should be upgraded to Redis/MongoDB for production use.

Key strengths:
- ✅ Clean state machine design
- ✅ Modular message handlers
- ✅ Easy to extend with new features
- ✅ Fast deployment pipeline

Recommended next steps:
1. Implement Redis for session persistence
2. Add MongoDB for dynamic business listings
3. Set up proper logging and monitoring
4. Implement webhook signature validation
5. Add rate limiting and input sanitization

This architecture provides a solid foundation for scaling to thousands of concurrent users while maintaining code clarity and maintainability.
