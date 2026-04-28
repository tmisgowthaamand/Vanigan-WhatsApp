# 📨 Message Flow Architecture - Vanigan WhatsApp Bot

## Complete Message Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (WhatsApp App)                          │
│                    Phone: +91 9876543210                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ User types "Hi" and sends
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Meta WhatsApp Cloud API                           │
│                  (graph.facebook.com/v18.0)                          │
│                                                                       │
│  1. Receives message from user's WhatsApp                            │
│  2. Validates phone number & business account                        │
│  3. Creates webhook payload                                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ POST /webhook
                               │ Content-Type: application/json
                               │
                               │ Payload:
                               │ {
                               │   "object": "whatsapp_business_account",
                               │   "entry": [{
                               │     "changes": [{
                               │       "value": {
                               │         "messages": [{
                               │           "from": "919876543210",
                               │           "type": "text",
                               │           "text": { "body": "Hi" }
                               │         }]
                               │       }
                               │     }]
                               │   }]
                               │ }
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    YOUR SERVER (Render/ngrok)                        │
│                         index.js                                     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: Webhook Handler (POST /webhook)                   │    │
│  │  Line ~200-250                                              │    │
│  │                                                              │    │
│  │  • Extracts: body.entry[0].changes[0].value.messages[0]    │    │
│  │  • Gets userId: message.from → "919876543210"              │    │
│  │  • Gets message type: message.type → "text"                │    │
│  │  • Gets text: message.text.body → "Hi"                     │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: Session Manager (getSession)                      │    │
│  │  Line ~80-95                                                │    │
│  │                                                              │    │
│  │  sessions["919876543210"] = {                              │    │
│  │    state: "MAIN",                                           │    │
│  │    history: [],                                             │    │
│  │    temp: {}                                                 │    │
│  │  }                                                           │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: Check Global Navigation                           │    │
│  │  Line ~250-260                                              │    │
│  │                                                              │    │
│  │  if (text === '9') → Reset to MAIN                         │    │
│  │  if (text === '0') → Go back one state                     │    │
│  │  if (text === 'Hi') → Show MAIN menu                       │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 4: State Machine Controller                          │    │
│  │  Line ~260-350                                              │    │
│  │                                                              │    │
│  │  switch (session.state) {                                   │    │
│  │    case 'MAIN':                                             │    │
│  │      if (text === 'Hi') {                                   │    │
│  │        // Send welcome banner image                         │    │
│  │        // Send interactive list menu                        │    │
│  │      }                                                       │    │
│  │  }                                                           │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 5: Response Generator                                │    │
│  │  Line ~100-180                                              │    │
│  │                                                              │    │
│  │  A) sendImageMessage(userId, bannerUrl, caption)           │    │
│  │     → Sends welcome banner                                  │    │
│  │                                                              │    │
│  │  B) sendListMessage(userId, title, body, button, sections) │    │
│  │     → Sends main menu with 6 options                        │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                           │
                           │ POST to Meta API
                           │ https://graph.facebook.com/v18.0/
                           │   {PHONE_NUMBER_ID}/messages
                           │
                           │ Headers:
                           │ Authorization: Bearer {WHATSAPP_API_TOKEN}
                           │
                           │ Payload 1 (Image):
                           │ {
                           │   "messaging_product": "whatsapp",
                           │   "to": "919876543210",
                           │   "type": "image",
                           │   "image": {
                           │     "link": "https://...banner.png",
                           │     "caption": "Welcome to Vanigan!"
                           │   }
                           │ }
                           │
                           │ Payload 2 (List):
                           │ {
                           │   "messaging_product": "whatsapp",
                           │   "to": "919876543210",
                           │   "type": "interactive",
                           │   "interactive": {
                           │     "type": "list",
                           │     "body": { "text": "Select a service" },
                           │     "action": {
                           │       "button": "Open Options",
                           │       "sections": [...]
                           │     }
                           │   }
                           │ }
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Meta WhatsApp Cloud API                           │
│                                                                       │
│  1. Receives message request from your server                        │
│  2. Validates API token                                              │
│  3. Formats message for WhatsApp protocol                            │
│  4. Delivers to user's phone                                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ Message delivered
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (WhatsApp App)                          │
│                                                                       │
│  Sees:                                                               │
│  1. Banner image with welcome text                                   │
│  2. Interactive list button "Open Options"                           │
│  3. When clicked, shows 6 menu items                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow: User Selects "Business List"

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (WhatsApp App)                          │
│                                                                       │
│  User clicks on "Business List" from the menu                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ Sends list_reply interaction
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Meta WhatsApp Cloud API                           │
│                                                                       │
│  Creates webhook payload with interactive response                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ POST /webhook
                               │
                               │ Payload:
                               │ {
                               │   "object": "whatsapp_business_account",
                               │   "entry": [{
                               │     "changes": [{
                               │       "value": {
                               │         "messages": [{
                               │           "from": "919876543210",
                               │           "type": "interactive",
                               │           "interactive": {
                               │             "type": "list_reply",
                               │             "list_reply": {
                               │               "id": "1",
                               │               "title": "Business List"
                               │             }
                               │           }
                               │         }]
                               │       }
                               │     }]
                               │   }]
                               │ }
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    YOUR SERVER (index.js)                            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: Extract Interactive Response                      │    │
│  │                                                              │    │
│  │  if (message.type === 'interactive') {                      │    │
│  │    if (message.interactive.type === 'list_reply') {        │    │
│  │      text = message.interactive.list_reply.id;  // "1"     │    │
│  │    }                                                         │    │
│  │  }                                                           │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: Get Session                                        │    │
│  │                                                              │    │
│  │  session = sessions["919876543210"]                        │    │
│  │  // Current state: "MAIN"                                   │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: State Machine Processing                          │    │
│  │                                                              │    │
│  │  switch (session.state) {                                   │    │
│  │    case 'MAIN':                                             │    │
│  │      if (text === '1') {  // Business List selected        │    │
│  │        updateState(session, 'BUSINESS_CATEGORY');          │    │
│  │        // Send category list                                │    │
│  │      }                                                       │    │
│  │  }                                                           │    │
│  │                                                              │    │
│  │  After updateState:                                         │    │
│  │  session.history = ['MAIN']                                │    │
│  │  session.state = 'BUSINESS_CATEGORY'                       │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  STEP 4: Send Category List                                │    │
│  │                                                              │    │
│  │  sendListMessage(userId, 'Categories', 'Choose...', [      │    │
│  │    {                                                         │    │
│  │      title: 'Industries',                                   │    │
│  │      rows: [                                                 │    │
│  │        { id: 'retail', title: 'Retail' },                  │    │
│  │        { id: 'mfg', title: 'Manufacturing' },              │    │
│  │        { id: 'svc', title: 'Services' },                   │    │
│  │        { id: 'food', title: 'Food & Restaurants' }         │    │
│  │      ]                                                       │    │
│  │    }                                                         │    │
│  │  ])                                                          │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                           │
                           │ POST to Meta API
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Meta WhatsApp Cloud API                           │
│                                                                       │
│  Delivers category list to user                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (WhatsApp App)                          │
│                                                                       │
│  Sees list of business categories:                                   │
│  • Retail                                                            │
│  • Manufacturing                                                     │
│  • Services                                                          │
│  • Food & Restaurants                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Complete User Journey: Finding a Business

### Timeline View

```
TIME    USER ACTION              SERVER STATE           SERVER RESPONSE
────────────────────────────────────────────────────────────────────────
T0      Sends "Hi"               MAIN                   • Banner image
                                                        • Main menu list

T1      Selects "Business List"  MAIN → BUSINESS_       • Category list
        (id: "1")                CATEGORY               (Retail, Mfg...)
                                 history: ['MAIN']

T2      Selects "Retail"         BUSINESS_CATEGORY →    • Sub-category list
        (id: "retail")           BUSINESS_SUB_CATEGORY  (Clothing, Electronics...)
                                 history: ['MAIN', 
                                          'BUSINESS_CATEGORY']

T3      Selects "Clothing"       BUSINESS_SUB_CATEGORY  • Business list
        (id: "clothing")         → BUSINESS_LIST        (Sri Lakshmi Textiles,
                                 history: ['MAIN',       Ganesh Electronics...)
                                          'BUSINESS_CATEGORY',
                                          'BUSINESS_SUB_CATEGORY']

T4      Selects "Sri Lakshmi     BUSINESS_LIST →        • Business details
        Textiles" (id: "1")      BUSINESS_DETAILS       • Buttons: Call, Location, Back
                                 history: ['MAIN',
                                          'BUSINESS_CATEGORY',
                                          'BUSINESS_SUB_CATEGORY',
                                          'BUSINESS_LIST']

T5      Clicks "Call" button     BUSINESS_DETAILS       • "Calling business..."
        (id: "call")                                    • Phone number link

T6      Clicks "Back" (id: "0")  BUSINESS_DETAILS →     • Business list again
                                 BUSINESS_LIST
                                 history: ['MAIN',
                                          'BUSINESS_CATEGORY',
                                          'BUSINESS_SUB_CATEGORY']

T7      Sends "9"                ANY_STATE → MAIN       • Main menu list
                                 history: []
```

---

## Message Type Handling

### 1. Text Message Flow
```
User types: "Hi"
    ↓
Webhook receives: message.type = "text"
    ↓
Extract: text = message.text.body = "Hi"
    ↓
Process in state machine
    ↓
Send response via sendTextMessage() or sendListMessage()
```

### 2. Interactive List Reply Flow
```
User selects from list: "Business List"
    ↓
Webhook receives: message.type = "interactive"
                  message.interactive.type = "list_reply"
    ↓
Extract: text = message.interactive.list_reply.id = "1"
    ↓
Process in state machine
    ↓
Send response via sendListMessage()
```

### 3. Interactive Button Reply Flow
```
User clicks button: "Call"
    ↓
Webhook receives: message.type = "interactive"
                  message.interactive.type = "button_reply"
    ↓
Extract: text = message.interactive.button_reply.id = "call"
    ↓
Process in state machine
    ↓
Send response via sendTextMessage() or initiate action
```

### 4. Location Message Flow
```
User shares location
    ↓
Webhook receives: message.type = "location"
    ↓
Extract: text = "location_received"
         lat = message.location.latitude
         lng = message.location.longitude
    ↓
Store in session.temp.location
    ↓
Process in state machine (e.g., ADD_BUSINESS_LOCATION)
    ↓
Send confirmation
```

### 5. Image Message Flow
```
User uploads image
    ↓
Webhook receives: message.type = "image"
    ↓
Extract: text = "image_received"
         imageId = message.image.id
    ↓
Store in session.temp.photos[]
    ↓
Process in state machine (e.g., ADD_BUSINESS_PHOTO)
    ↓
Send confirmation or request more images
```

---

## API Call Details

### Outgoing Message to Meta API

**Endpoint**:
```
POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
```

**Headers**:
```javascript
{
  'Authorization': 'Bearer EAANAWoZA8vz8BQ...',
  'Content-Type': 'application/json'
}
```

**Example Payloads**:

#### Text Message
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

#### Interactive List
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Vanigan Main Menu"
    },
    "body": {
      "text": "Select a service to proceed:"
    },
    "footer": {
      "text": "Select an option to proceed"
    },
    "action": {
      "button": "Open Options",
      "sections": [
        {
          "title": "Networking & Search",
          "rows": [
            {
              "id": "1",
              "title": "Business List",
              "description": "Find local shops & factories"
            },
            {
              "id": "2",
              "title": "Organizer List",
              "description": "Connect with district leads"
            }
          ]
        }
      ]
    }
  }
}
```

#### Interactive Buttons
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Sri Lakshmi Textiles\nOwner: Raj\nPhone: 9876543210"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "call",
            "title": "Call"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "map",
            "title": "Location"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "0",
            "title": "Back"
          }
        }
      ]
    }
  }
}
```

#### Image Message
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "image",
  "image": {
    "link": "https://raw.githubusercontent.com/.../banner.png",
    "caption": "Welcome to Vanigan App! 🚀"
  }
}
```

---

## Error Handling Flow

```
User sends message
    ↓
Webhook receives payload
    ↓
Try to parse message
    ↓
    ├─ Success → Process normally
    │
    └─ Error → Catch block
           ↓
           Log error to console
           ↓
           Send generic error message to user
           ↓
           Return 200 OK to Meta (prevent retries)
```

**Current Error Handling** (Line ~100-180):
```javascript
try {
  await axios({
    method: 'POST',
    url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    headers: { ... },
    data: { ... }
  });
} catch (error) {
  console.error('Error sending message:', error.response?.data || error.message);
}
```

---

## Session State Transitions

```
┌──────┐
│ MAIN │ ◄─────────────────────────────────┐
└───┬──┘                                    │
    │                                       │
    ├─ 1 → BUSINESS_CATEGORY                │
    │      └─→ BUSINESS_SUB_CATEGORY        │
    │          └─→ BUSINESS_LIST            │
    │              └─→ BUSINESS_DETAILS ────┘ (0 or 9)
    │
    ├─ 2 → ORG_DISTRICT
    │      └─→ ORG_ASSEMBLY
    │          └─→ ORGANIZER_LIST
    │              └─→ ORGANIZER_DETAILS
    │
    ├─ 3 → MEMBERS_DISTRICT
    │      └─→ MEMBERS_ASSEMBLY
    │          └─→ MEMBER_LIST
    │              └─→ MEMBER_DETAILS
    │
    ├─ 4 → ADD_BUSINESS_NAME
    │      └─→ ADD_BUSINESS_OWNER
    │          └─→ ADD_BUSINESS_PHONE
    │              └─→ ADD_BUSINESS_CATEGORY
    │                  └─→ ADD_BUSINESS_DESC
    │                      └─→ ADD_BUSINESS_PHOTO
    │                          └─→ ADD_BUSINESS_LOCATION
    │                              └─→ ADD_BUSINESS_CONFIRM
    │
    ├─ 5 → SUBSCRIPTION
    │      ├─→ SUB_MONTHLY
    │      ├─→ SUB_YEARLY
    │      └─→ SUB_LIFETIME
    │
    └─ 6 → NEWS_DISTRICT
           └─→ NEWS_ASSEMBLY
               └─→ NEWS_LIST
                   └─→ NEWS_DETAILS
```

---

## Performance Metrics

**Current Message Flow Timing**:
```
User sends message → Meta receives → Webhook called → Response sent → User receives
     ~100ms            ~200ms          ~50ms           ~200ms          ~100ms
                                                                    
Total Round Trip: ~650ms
```

**Bottlenecks**:
1. Meta API latency (200-300ms per call)
2. Network latency (varies by user location)
3. In-memory session lookup (negligible, <1ms)

**Optimization Opportunities**:
1. Cache frequently accessed data
2. Use webhooks for async operations
3. Implement message queuing for high traffic
4. Add CDN for media files

---

## Summary

Your message flow follows this pattern:

1. **User → WhatsApp → Meta API** (User sends message)
2. **Meta API → Your Server** (Webhook POST with payload)
3. **Your Server** (Parse → Get Session → State Machine → Generate Response)
4. **Your Server → Meta API** (POST formatted message)
5. **Meta API → WhatsApp → User** (Message delivered)

The entire cycle takes ~650ms on average, with most time spent on API calls to Meta's servers.
