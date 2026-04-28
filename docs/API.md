# 🔌 Vanigan API & Webhook Reference

This document outlines the API structure and the flow for interacting with the **Meta WhatsApp Cloud API**.

---

## 🌩️ Webhook Integration

The bot must be configured with a publicly accessible URL (e.g., via **Render**, **Heroku**, or **Ngrok**) to receive messages from Meta.

### 📝 Webhook Verification (`GET /webhook`)
When you connect your bot in the Meta Developer Dashboard, Meta sends a GET request to verify your endpoint.

- **URL**: `https://your-bot.render.com/webhook`
- **Query Params**:
  - `hub.mode`: Should be `subscribe`.
  - `hub.verify_token`: Must match your `WHATSAPP_VERIFY_TOKEN` env var.
  - `hub.challenge`: A random string that the bot must return.

### 📩 Receiving Messages (`POST /webhook`)
Meta sends a JSON payload whenever a user interacts with the bot.

- **Payload Structure (Text Message)**:
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "type": "text",
          "text": { "body": "Hello" }
        }]
      }
    }]
  }]
}
```

- **Payload Structure (Interactive List/Button Reply)**:
```json
"interactive": {
  "type": "list_reply", // or "button_reply"
  "list_reply": {
    "id": "1",
    "title": "Business List"
  }
}
```

---

## 📤 Outbound Messaging

The bot sends messages back to the user by making a POST request to the **Meta Graph API**.

### Endpoint
`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`

### Headers
- `Authorization: Bearer ${WHATSAPP_API_TOKEN}`
- `Content-Type: application/json`

### Supported Message Types

#### 1. Text Message
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "USER_PHONE_NUMBER",
  "type": "text",
  "text": { "body": "Your text here" }
}
```

#### 2. Interactive List Message
Used for the main menu and category selection. Displays "Select" options.
- **Max Items**: 10 rows per list.

#### 3. Interactive Button Message
Used for binary or simple choices (e.g., Call, Map, Back).
- **Max Items**: 3 buttons per message.

---

## ⚠️ Common API Issues & Solutions

| Issue | Potential Cause | Solution |
| :--- | :--- | :--- |
| **Messages not arriving** | Incorrect `PHONE_NUMBER_ID` | Double-check the Meta App dashboard. |
| **401 Unauthorized**| Expired Access Token | Use a **Permanent System User Token**. |
| **400 Bad Request** | Invalid JSON or mismatched type | Validate payload against Meta's v18.0 documentation. |
| **500 Internal Error** | Bot took too long to respond | Ensure `res.sendStatus(200)` is called quickly. |

---

## 🔗 Useful Links
- [Meta WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Interactive Messages Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages/interactive-messages)
- [Render Dashboard](https://dashboard.render.com/)
