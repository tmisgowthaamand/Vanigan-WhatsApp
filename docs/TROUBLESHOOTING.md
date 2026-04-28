# 🔧 Troubleshooting Guide - Vanigan WhatsApp Bot

## Error: "Object with ID does not exist" (Error Code 100)

### Error Message
```
Error sending image message: {
  error: {
    message: "Unsupported post request. Object with ID '949977628193093' does not exist, 
             cannot be loaded due to missing permissions, or does not support this operation.",
    code: 100,
    type: 'GraphMethodException',
    error_subcode: 33,
    fbtrace_id: 'AdbpUoa0sxjTHhurFIy65ky'
  }
}
```

### Root Causes

This error occurs when:
1. ❌ **Phone Number ID is incorrect or expired**
2. ❌ **Access Token doesn't have permission for that Phone Number**
3. ❌ **WhatsApp Business Account is not properly configured**
4. ❌ **Access Token has expired** (temporary tokens expire in 24 hours)

---

## ✅ Solution Steps

### Step 1: Verify Your Phone Number ID

1. Go to **Meta Developer Dashboard**: https://developers.facebook.com/apps/
2. Select your app: **Vanigan WhatsApp Bot** (App ID: 1322186709594958)
3. Navigate to **WhatsApp > API Setup**
4. Look for **"Phone number ID"** under your test number
5. Copy the correct Phone Number ID

**Expected format**: A long numeric string (e.g., `123456789012345`)

### Step 2: Generate a New Access Token

#### Option A: Temporary Token (24 hours - for testing only)
1. In **WhatsApp > API Setup**
2. Find **"Temporary access token"**
3. Click **"Copy"**
4. Update your `.env` file with this token

⚠️ **Warning**: This expires in 24 hours!

#### Option B: Permanent System User Token (Recommended for Production)

1. Go to **Business Settings**: https://business.facebook.com/settings/
2. Click **"System Users"** in the left menu
3. Click **"Add"** to create a new system user (or select existing)
4. Name it: `Vanigan Bot System User`
5. Role: **Admin**
6. Click **"Add Assets"**
7. Select **"Apps"** → Choose your app → Enable **"Full Control"**
8. Click **"Generate New Token"**
9. Select permissions:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
10. Copy the token (it won't be shown again!)
11. Update your `.env` file

### Step 3: Update Your .env File

```env
# Use the NEW values from Meta Dashboard
WHATSAPP_API_TOKEN=EAANAWoZA8vz8BRU1MWcrIQGo7BI0EWu7bC1y9rYgS134R2dM6uWW040LlOtDWqjkqHjOOcQAOoXZCiEZCqwVknDQZApgNZChOghUiHl42Jx7crv4nhCBdhdOeyxlHBac8SRgW0rU7HyjzsjWY1RTt4ZCiU24VPEpNkVjQDO17sIUpB7ED98iCOobwZATZBoUEHyXyQZDZD
WHATSAPP_PHONE_NUMBER_ID=949977628193093
WHATSAPP_WEBHOOK_URL=https://vanigan-whatsapp-n2c1.onrender.com/webhook
```

### Step 4: Verify Token Permissions

Test your token using this command:

```bash
curl -X GET "https://graph.facebook.com/v18.0/949977628193093?access_token=YOUR_TOKEN_HERE"
```

**Expected Response** (if working):
```json
{
  "verified_name": "Vanigan",
  "display_phone_number": "+1 555-0123",
  "quality_rating": "GREEN",
  "id": "949977628193093"
}
```

**Error Response** (if not working):
```json
{
  "error": {
    "message": "Unsupported get request...",
    "code": 100
  }
}
```

### Step 5: Configure Webhook on Render

1. Go to your **Render Dashboard**: https://dashboard.render.com/
2. Select your service: **vanigan-whatsapp-bot**
3. Go to **Environment** tab
4. Update these variables:
   ```
   WHATSAPP_API_TOKEN = [Your new token]
   WHATSAPP_PHONE_NUMBER_ID = [Verified Phone Number ID]
   WHATSAPP_WEBHOOK_URL = https://vanigan-whatsapp-n2c1.onrender.com/webhook
   ```
5. Click **"Save Changes"**
6. Service will auto-redeploy

### Step 6: Update Webhook in Meta Dashboard

1. Go to **WhatsApp > Configuration** in Meta Dashboard
2. Under **Webhook**:
   - **Callback URL**: `https://vanigan-whatsapp-n2c1.onrender.com/webhook`
   - **Verify Token**: `vanigan-whatsapp-2026` (must match your .env)
3. Click **"Verify and Save"**
4. Subscribe to webhook fields:
   - ✅ `messages`
   - ✅ `message_status` (optional)

### Step 7: Test the Connection

Send a test message from your WhatsApp:

```bash
curl -X POST "https://graph.facebook.com/v18.0/949977628193093/messages" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "text",
    "text": {
      "body": "Test message from Vanigan Bot"
    }
  }'
```

Replace:
- `YOUR_TOKEN_HERE` with your actual token
- `YOUR_PHONE_NUMBER` with your WhatsApp number (format: `919876543210`)

---

## Common Issues & Fixes

### Issue 1: Token Expired
**Symptom**: Error code 190
```json
{
  "error": {
    "code": 190,
    "message": "Error validating access token"
  }
}
```

**Fix**: Generate a new permanent token (see Step 2, Option B above)

---

### Issue 2: Phone Number Not Verified
**Symptom**: Error code 100, subcode 33

**Fix**:
1. Go to **WhatsApp > API Setup**
2. Verify your phone number is showing as **"Connected"**
3. If not, click **"Add phone number"** and complete verification

---

### Issue 3: Webhook Not Receiving Messages
**Symptom**: No POST requests to `/webhook`

**Fix**:
1. Check Render logs:
   ```bash
   # In Render dashboard, go to Logs tab
   ```
2. Verify webhook is subscribed:
   - Meta Dashboard → WhatsApp → Configuration
   - Ensure `messages` field is checked
3. Test webhook manually:
   ```bash
   curl -X POST https://vanigan-whatsapp-n2c1.onrender.com/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

---

### Issue 4: "Cannot send messages to this user"
**Symptom**: Error code 131026

**Fix**:
- User must message your WhatsApp Business number first
- You have 24 hours to reply after user's last message
- After 24 hours, you can only send template messages

---

### Issue 5: Rate Limiting
**Symptom**: Error code 4 or 80007

**Fix**:
- Free tier: 1000 messages/day
- Upgrade to paid tier for higher limits
- Implement message queuing to avoid bursts

---

## Verification Checklist

Before going live, verify:

- [ ] Phone Number ID is correct and active
- [ ] Access Token is permanent (not temporary)
- [ ] Token has `whatsapp_business_messaging` permission
- [ ] Webhook URL is publicly accessible (not localhost/ngrok)
- [ ] Webhook verify token matches `.env` file
- [ ] Webhook is subscribed to `messages` field
- [ ] Test message sends successfully
- [ ] Test message receives successfully
- [ ] Environment variables are set on Render
- [ ] `.env` file is in `.gitignore` (security)

---

## Testing Commands

### 1. Test Webhook Verification (GET)
```bash
curl "https://vanigan-whatsapp-n2c1.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=vanigan-whatsapp-2026&hub.challenge=test123"
```

**Expected**: Returns `test123`

### 2. Test Send Text Message
```bash
curl -X POST "https://graph.facebook.com/v18.0/949977628193093/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "text",
    "text": {"body": "Hello from Vanigan!"}
  }'
```

### 3. Test Send Interactive List
```bash
curl -X POST "https://graph.facebook.com/v18.0/949977628193093/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "interactive",
    "interactive": {
      "type": "list",
      "body": {"text": "Choose an option"},
      "action": {
        "button": "Menu",
        "sections": [{
          "title": "Options",
          "rows": [{"id": "1", "title": "Option 1"}]
        }]
      }
    }
  }'
```

### 4. Check Server Status
```bash
curl https://vanigan-whatsapp-n2c1.onrender.com/
```

**Expected**:
```json
{
  "status": "Online",
  "message": "Vanigan WhatsApp Bot API is active and running",
  "version": "1.0.0"
}
```

---

## Debug Mode

Add this to your `index.js` to see detailed logs:

```javascript
// Add after line 1
const DEBUG = process.env.DEBUG === 'true';

// Add in webhook handler (after line 200)
if (DEBUG) {
  console.log('=== INCOMING WEBHOOK ===');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('========================');
}

// Add before sending messages (after line 100)
if (DEBUG) {
  console.log('=== OUTGOING MESSAGE ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('========================');
}
```

Then set in `.env`:
```env
DEBUG=true
```

---

## Getting Help

### Meta Support Resources
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Error Code Reference**: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes

### Check Your Configuration
1. **Meta Dashboard**: https://developers.facebook.com/apps/1322186709594958
2. **Render Dashboard**: https://dashboard.render.com/
3. **Vercel Dashboard**: https://vercel.com/dashboard

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 100 | Invalid Phone Number ID | Verify Phone Number ID in Meta Dashboard |
| 190 | Token expired | Generate new permanent token |
| 131026 | Cannot message user | User must message you first |
| 131047 | Re-engagement message required | Send template message |
| 4 | Rate limit exceeded | Implement message queuing |
| 33 | Missing permissions | Add permissions to system user token |

---

## Production Deployment Checklist

Before deploying to production:

### Security
- [ ] Use permanent system user token (not temporary)
- [ ] Store tokens in environment variables (never in code)
- [ ] Add `.env` to `.gitignore`
- [ ] Enable webhook signature validation
- [ ] Implement rate limiting

### Reliability
- [ ] Replace in-memory sessions with Redis
- [ ] Add database for business listings
- [ ] Implement error logging (Winston/Sentry)
- [ ] Set up monitoring (Uptime Robot/Pingdom)
- [ ] Configure auto-scaling on Render

### Testing
- [ ] Test all menu flows
- [ ] Test image uploads
- [ ] Test location sharing
- [ ] Test error scenarios
- [ ] Load test with multiple users

---

## Quick Fix Summary

**Your current error is likely due to:**
1. ❌ Expired temporary access token
2. ❌ Wrong Phone Number ID

**Immediate fix:**
1. Go to Meta Dashboard → WhatsApp → API Setup
2. Copy the **Phone Number ID** (verify it's correct)
3. Generate a **new temporary token** (for quick testing)
4. Update `.env` file with both values
5. Restart your server
6. Test with a simple message

**For production:**
- Create a **permanent system user token** (see Step 2, Option B)
- Update Render environment variables
- Never use temporary tokens in production

---

## Current Configuration

Based on your provided values:

```env
WHATSAPP_API_TOKEN=EAANAWoZA8vz8BRU1MWcrIQGo7BI0EWu7bC1y9rYgS134R2dM6uWW040LlOtDWqjkqHjOOcQAOoXZCiEZCqwVknDQZApgNZChOghUiHl42Jx7crv4nhCBdhdOeyxlHBac8SRgW0rU7HyjzsjWY1RTt4ZCiU24VPEpNkVjQDO17sIUpB7ED98iCOobwZATZBoUEHyXyQZDZD
WHATSAPP_PHONE_NUMBER_ID=949977628193093
WHATSAPP_WEBHOOK_URL=https://vanigan-whatsapp-n2c1.onrender.com/webhook
```

✅ **Token updated** (new token provided)
✅ **Webhook URL updated** (Render deployment)
⚠️ **Phone Number ID** - Verify this is correct in Meta Dashboard

---

## Next Steps

1. **Verify Phone Number ID** in Meta Dashboard
2. **Test the token** using the curl command in Step 4
3. **Update Render environment variables**
4. **Test sending a message**
5. If still failing, generate a **permanent system user token**

Need more help? Check the Meta Developer Community: https://developers.facebook.com/community/
