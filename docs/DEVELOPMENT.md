# 🛠️ Development & Upgrading Guide

This guide is for developers looking to extend or upgrade the **Vanigan WhatsApp Bot**. Following these patterns will ensure consistent user experiences and a stable codebase.

---

## 🏗️ Adding a New Menu (Feature)

Suppose you want to add a "Help & Support" section. Follow these steps:

### 1. Update the `MENUS` Object
Add the static text for the new menu at the top of `index.js`:

```javascript
const MENUS = {
    // ... existings menus
    HELP: `Need help? Choose an option:\n\n1. Technical Support\n2. Billing Questions\n3. Report a Bug`
    // ...
};
```

### 2. Update the `MAIN` Menu List
Update the `sendListMessage` call for the `MAIN` state to include the new option:

```javascript
// Inside the MAIN MENU HANDLER:
rows: [
    // ... existing rows
    { id: '7', title: 'Help & Support', description: 'Get assistance with Vanigan' }
]
```

### 3. Handle the State Transition
In the `switch (session.state)` block for the `MAIN` cases, add a listener for the new ID:

```javascript
case 'MAIN':
    // ... existing logic
    else if (text === '7') {
        updateState(session, 'HELP_MENU');
        response = MENUS.HELP + COMMON_NAV;
    }
    break;
```

---

## 📈 Database Integration (Major Upgrade)

The current implementation uses hardcoded menus. To upgrade to a real database:

### 1. Define Your Schema
You'll need collections for `Businesses`, `Organizers`, `Members`, and `News`.

### 2. Connect to the DB
Install Mongoose (for MongoDB) or Sequelize/Knex (for SQL):
```bash
npm install mongoose
```

### 3. Replace Static Menu Logic
Instead of `response = MENUS.BUSINESS_LIST`, you'll query the database:

```javascript
case 'BUSINESS_SUB_CATEGORY':
    const businesses = await Business.find({ category: session.temp.category });
    let listText = "*Businesses Found*\n\n";
    businesses.forEach((b, i) => {
        listText += `${i+1}. ${b.name}\n`;
    });
    response = listText + COMMON_NAV;
    updateState(session, 'BUSINESS_LIST');
    break;
```

---

## ⚙️ Session Logic Upgrades

Currently, the navigation history is an array of strings. This is simple but has limitations.

### Handling Multi-Step Forms
If you're building a form (like `ADD_BUSINESS`), use `session.temp` to store data as you go:

```javascript
case 'ADD_BUSINESS_NAME':
    session.temp.businessName = text; // Save the name
    updateState(session, 'ADD_BUSINESS_OWNER'); // Move to next step
    response = MENUS.ADD_BUSINESS_OWNER + COMMON_NAV;
    break;
```

---

## 🚀 Deploying Updates

Consistent deployment is key to avoiding downtime.

1.  **Test Locally with Ngrok**:
    ```bash
    ngrok http 3000
    ```
    Update your Meta App Webhook URL to the Ngrok URL.
2.  **Commit Changes**:
    Use descriptive commit messages (e.g., `feat: add help menu`, `fix: business registration flow`).
3.  **Push to main**:
    Render will auto-deploy the changes if you've enabled "Auto-Deploy".

---

## 🧪 Testing Your Bot

The easiest way to test is to send a "Hi" to your registered WhatsApp Business number.
- **Visual Check**: Ensure interactive list and button elements appear and work as expected.
- **Reset Logic**: Test '9' (Main Menu) and '0' (Back) from various parts of the bot to ensure no "Dead Ends".
- **Timeout Monitoring**: WhatsApp expects a 200 OK within 2 to 5 seconds. Avoid heavy processing inside the webhook handler; use `res.sendStatus(200)` as early as possible.
