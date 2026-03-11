require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vanigan-whats-app.vercel.app/';

// User session storage (In-memory for now)
const sessions = {};

const MENUS = {
    MAIN: `Welcome to Vanigan App\n\nDiscover Businesses, Members, and Organizers across your district.\n\nVisit our website: ${FRONTEND_URL}\n\nPlease choose an option below:\n\n*Main Menu Options*\n1. Business List\n2. Organizer List\n3. Members List\n4. Add Business\n5. Subscription Plans\n6. News`,
    
    BUSINESS_CATEGORY: `Please choose a Business Category:\n\n1. Retail\n2. Manufacturing\n3. Services\n4. Food & Restaurants\n5. Construction\n6. Education\n7. Health`,
    
    BUSINESS_SUB_CATEGORY: `Please choose a Sub Category:\n\n1. Clothing\n2. Electronics\n3. Grocery\n4. Furniture`,
    
    BUSINESS_LIST: `*Businesses Found*\n\n1. Sri Lakshmi Textiles\n2. Ganesh Electronics\n3. Murugan Stores\n4. Anand Furniture`,
    
    BUSINESS_DETAILS: `*Sri Lakshmi Textiles*\nOwner Name: Raj\nPhone Number: 9876543210\nAddress: 123 Main St\nDistrict: Chennai\nBusiness Description: Best retail clothing\nGoogle Map Location: https://maps.google.com/?q=13.0827,80.2707\nGallery Photos: (Coming Soon)\n\n1. Call Business\n2. View Location\n3. Back to Business List`,

    DISTRICT: `Select District\n\n1. Chennai\n2. Kanchipuram\n3. Thiruvallur\n4. Vellore`,

    ASSEMBLY: `Select Assembly\n\n1. Ambattur\n2. Avadi\n3. Tiruttani\n4. Poonamallee`,

    ORGANIZER_LIST: `*Organizers*\n\n1. Rajesh Kumar\n2. Prakash\n3. Arun Kumar`,
    
    ORGANIZER_DETAILS: `*Rajesh Kumar*\nRole: Lead Organizer\nDistrict: Chennai\nAssembly: Ambattur\nPhone Number: 9876543210`,

    MEMBER_LIST: `*Members*\n\n1. Suresh\n2. Ramesh`,
    
    MEMBER_DETAILS: `*Suresh*\nBusiness: IT Services\nPhone: 9123456780\nDistrict: Chennai\nAssembly: Ambattur`,

    SUBSCRIPTION: `Choose a plan\n\n1. Monthly Plan\n2. Yearly Plan\n3. Lifetime Plan`,

    SUB_MONTHLY: `*Monthly Plan*\n₹199 per month\n\n*Benefits*\n• Business Listing\n• Priority Visibility\n• Gallery Images\n• Contact Access\n\n1. Subscribe Now\n2. Back`,
    
    SUB_YEARLY: `*Yearly Plan*\n₹1499 per year\n\n*Benefits*\n• All Monthly Benefits\n• Featured Listing\n• Business Promotion\n\n1. Subscribe Now\n2. Back`,

    SUB_LIFETIME: `*Lifetime Plan*\n₹4999 One Time\n\n*Benefits*\n• Lifetime Business Listing\n• Premium Visibility\n• Unlimited Photos\n• Priority Support\n\n1. Subscribe Now\n2. Back`,

    NEWS_LIST: `*Latest News*\n\n1. New Business Meet in Ambattur\n2. District Business Conference\n3. Startup Support Program`,

    NEWS_DETAILS: `*New Business Meet in Ambattur*\nDescription: Join us for the tech meetup.\nDate: 25th March 2026`,

    ADD_BUSINESS_NAME: `Please enter your Business Name`,
    ADD_BUSINESS_OWNER: `Please enter Owner Name`,
    ADD_BUSINESS_PHONE: `Please enter Phone Number`,
    ADD_BUSINESS_CATEGORY: `Please enter Business Category`,
    ADD_BUSINESS_DESC: `Please enter Business Description`,
    ADD_BUSINESS_PHOTO: `Please upload business photos (max 5 images)`,
    ADD_BUSINESS_LOCATION: `Share your business location using WhatsApp location feature or Enter Google Map Link`,
    ADD_BUSINESS_CONFIRM: `Your Business has been submitted successfully.\n\nOur team will review and publish it shortly.`
};

const COMMON_NAV = `\n\n0. Back\n9. Main Menu`;

function getSession(userId) {
    if (!sessions[userId]) {
        sessions[userId] = { state: 'MAIN', history: [], temp: {} };
    }
    return sessions[userId];
}

function updateState(session, newState) {
    session.history.push(session.state);
    session.state = newState;
}

function goBack(session) {
    if (session.history.length > 0) {
        session.state = session.history.pop();
    } else {
        session.state = 'MAIN';
    }
}

// Root Endpoint
app.get('/', (req, res) => {
    res.status(200).send({
        status: 'Online',
        message: 'Vanigan WhatsApp Bot API is active and running',
        version: '1.0.0'
    });
});

// Basic text message
async function sendTextMessage(to, text) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            headers: { 'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' },
            data: { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }
        });
    } catch (error) { console.error('Error sending text message:', error.response?.data || error.message); }
}

// Media message (Image)
async function sendImageMessage(to, imageUrl, caption) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            headers: { 'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' },
            data: { 
                messaging_product: 'whatsapp', to, type: 'image', 
                image: { link: imageUrl, caption: caption } 
            }
        });
    } catch (error) { console.error('Error sending image message:', error.response?.data || error.message); }
}

// Interactive List message
async function sendListMessage(to, title, body, buttonLabel, sections) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            headers: { 'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' },
            data: {
                messaging_product: 'whatsapp', to, type: 'interactive',
                interactive: {
                    type: 'list',
                    header: { type: 'text', text: title },
                    body: { text: body },
                    footer: { text: 'Select an option to proceed' },
                    action: { button: buttonLabel, sections: sections }
                }
            }
        });
    } catch (error) { console.error('Error sending list message:', error.response?.data || error.message); }
}

// Interactive Buttons message
async function sendButtonsMessage(to, body, buttons) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            headers: { 'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' },
            data: {
                messaging_product: 'whatsapp', to, type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { text: body },
                    action: { buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) }
                }
            }
        });
    } catch (error) { console.error('Error sending buttons message:', error.response?.data || error.message); }
}


// Webhook verification for Facebook
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});


// Accept messages from WhatsApp API
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]) {
            
            const message = body.entry[0].changes[0].value.messages[0];
            const userId = message.from;
            
            let text = '';
            if (message.type === 'text') {
                text = message.text.body.trim();
            } else if (message.type === 'interactive') {
                if (message.interactive.type === 'list_reply') {
                    text = message.interactive.list_reply.id;
                } else if (message.interactive.type === 'button_reply') {
                    text = message.interactive.button_reply.id;
                }
            } else if (message.type === 'location') {
                text = 'location_received';
            } else if (message.type === 'image') {
                text = 'image_received';
            }

            if (!text) return res.sendStatus(200);

            const session = getSession(userId);

            // Handle Reset or Global Navigation
            if (text === '9') {
                session.state = 'MAIN';
                session.history = [];
            } else if (text === '0') {
                goBack(session);
            }

            let response = '';

            // ──────────────────────────────────────────────
            // MAIN MENU HANDLER (Media + List)
            // ──────────────────────────────────────────────
            if (session.state === 'MAIN' && (text === '9' || text === 'Hi' || text === 'hi' || text === 'Hello' || text === '0' || !session.history.length)) {
                const bannerUrl = 'https://raw.githubusercontent.com/tmisgowthaamand/Vanigan-WhatsApp/main/vanigan-frontend/public/banner.png'; 
                const introMessage = `*Welcome to Vanigan App!* 🚀\n\nConnect, Network, and Grow your professional community in your district.\n\n🌐 *Visit our Website for more details:*\n${FRONTEND_URL}\n\n*Features at your fingertips:* ✨\n• Business Directory\n• Organizer Search\n• Member Networking\n• Real-time News Updates\n\n👇 *Ready to start? Select an option below:*`;
                
                await sendImageMessage(userId, bannerUrl, introMessage);
                
                await sendListMessage(userId, 'Vanigan Main Menu', 'Select a service to proceed:', 'Open Options', [
                    {
                        title: 'Networking & Search',
                        rows: [
                            { id: '1', title: 'Business List', description: 'Find local shops & factories' },
                            { id: '2', title: 'Organizer List', description: 'Connect with district leads' },
                            { id: '3', title: 'Members List', description: 'Browse community members' }
                        ]
                    },
                    {
                        title: 'Manage Your Presence',
                        rows: [
                            { id: '4', title: 'Add Business', description: 'Register your shop on Vanigan' },
                            { id: '5', title: 'Subscriptions', description: 'View professional plans' },
                            { id: '6', title: 'District News', description: 'Stay updated on local events' }
                        ]
                    }
                ]);
                return res.sendStatus(200);
            }

            // ──────────────────────────────────────────────
            // STATE MACHINE
            // ──────────────────────────────────────────────
            switch (session.state) {
                case 'MAIN':
                    if (text === '1') {
                        updateState(session, 'BUSINESS_CATEGORY');
                        await sendListMessage(userId, 'Categories', 'Choose a category:', 'Select', [{
                            title: 'Industries',
                            rows: [
                                { id: 'retail', title: 'Retail' }, { id: 'mfg', title: 'Manufacturing' },
                                { id: 'svc', title: 'Services' }, { id: 'food', title: 'Food & Restaurants' }
                            ]
                        }]);
                        return res.sendStatus(200);
                    } else if (text === '2') {
                        updateState(session, 'ORG_DISTRICT');
                        response = MENUS.DISTRICT + COMMON_NAV;
                    } else if (text === '3') {
                        updateState(session, 'MEMBERS_DISTRICT');
                        response = MENUS.DISTRICT + COMMON_NAV;
                    } else if (text === '4') {
                        updateState(session, 'ADD_BUSINESS_NAME');
                        response = MENUS.ADD_BUSINESS_NAME + COMMON_NAV;
                    } else if (text === '5') {
                        updateState(session, 'SUBSCRIPTION');
                        response = MENUS.SUBSCRIPTION + COMMON_NAV;
                    } else if (text === '6') {
                        updateState(session, 'NEWS_DISTRICT');
                        response = MENUS.DISTRICT + COMMON_NAV;
                    }
                    break;

                case 'BUSINESS_CATEGORY':
                    updateState(session, 'BUSINESS_SUB_CATEGORY');
                    response = MENUS.BUSINESS_SUB_CATEGORY + COMMON_NAV;
                    break;
                
                case 'BUSINESS_SUB_CATEGORY':
                    updateState(session, 'BUSINESS_LIST');
                    response = MENUS.BUSINESS_LIST + COMMON_NAV;
                    break;

                case 'BUSINESS_LIST':
                    updateState(session, 'BUSINESS_DETAILS');
                    await sendButtonsMessage(userId, MENUS.BUSINESS_DETAILS, [
                        { id: 'call', title: 'Call' },
                        { id: 'map', title: 'Location' },
                        { id: '0', title: 'Back' }
                    ]);
                    return res.sendStatus(200);

                case 'BUSINESS_DETAILS':
                    if (text === 'call') response = "Calling business...";
                    else if (text === 'map') response = "Opening location...";
                    break;

                // Simple fallbacks for other states (can be upgraded later)
                default:
                    response = "Checking your request..." + COMMON_NAV;
            }

            if (response) {
                await sendTextMessage(userId, response);
            }
        }
        // If no specific return res.sendStatus(200) was hit, and no response was sent,
        // or if a response was sent via sendTextMessage, we still need to acknowledge the webhook.
        // This ensures the webhook is always acknowledged if body.object is present.
        res.sendStatus(200); 
    } else {
        res.sendStatus(404);
    }
});

app.listen(PORT, () => {
    console.log(`Vanigan WhatsApp Bot Webhook listening on port ${PORT}`);
});
