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

async function sendMessage(to, text) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            }
        });
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
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
            const userId = message.from; // Sender's phone number
            
            // Extract text or other interactive message types
            let text = '';
            if (message.type === 'text') {
                text = message.text.body.trim();
            } else if (message.type === 'interactive' && message.interactive.type === 'list_reply') {
                text = message.interactive.list_reply.id;
            } else if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
                text = message.interactive.button_reply.id;
            } else if (message.type === 'location') {
                text = 'location_received'; // Special handling below
            } else if (message.type === 'image') {
                text = 'image_received'; // Special handling below
            }

            if (!text) return res.sendStatus(200);

            const session = getSession(userId);

            if (text === '9') {
                session.state = 'MAIN';
                session.history = [];
                await sendMessage(userId, MENUS.MAIN);
                return res.sendStatus(200);
            }

            if (text === '0') {
                goBack(session);
            }

            let response = '';

            switch (session.state) {
                case 'MAIN':
                    if (text === '1') {
                        updateState(session, 'BUSINESS_CATEGORY');
                        response = MENUS.BUSINESS_CATEGORY + COMMON_NAV;
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
                    } else if (text !== '0' && text !== '9') {
                        // Start of interaction or invalid input on main menu
                        session.state = 'MAIN';
                        session.history = [];
                        response = MENUS.MAIN; // Initial menu without back option usually
                    }
                    break;
    
                case 'BUSINESS_CATEGORY':
                    if (parseInt(text) >= 1 && parseInt(text) <= 7) {
                        updateState(session, 'BUSINESS_SUB_CATEGORY');
                        response = MENUS.BUSINESS_SUB_CATEGORY + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.BUSINESS_CATEGORY + COMMON_NAV;
                    }
                    break;
    
                case 'BUSINESS_SUB_CATEGORY':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'BUSINESS_LIST');
                        response = MENUS.BUSINESS_LIST + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.BUSINESS_SUB_CATEGORY + COMMON_NAV;
                    }
                    break;
    
                case 'BUSINESS_LIST':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'BUSINESS_DETAILS');
                        response = MENUS.BUSINESS_DETAILS + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.BUSINESS_LIST + COMMON_NAV;
                    }
                    break;
    
                case 'BUSINESS_DETAILS':
                    if (text === '1' || text === '2' || text === '3') {
                        if (text === '3') {
                             goBack(session);
                             // After going back perfectly handle the render, we will handle that at the end
                        } else {
                             // Mock action
                             response = (text === '1' ? "Redirecting to call..." : "Opening map...") + COMMON_NAV;
                        }
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.BUSINESS_DETAILS + COMMON_NAV;
                    }
                    break;
    
                // ORGANIZER
                case 'ORG_DISTRICT':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'ORG_ASSEMBLY');
                        response = MENUS.ASSEMBLY + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.DISTRICT + COMMON_NAV;
                    }
                    break;
                case 'ORG_ASSEMBLY':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'ORGANIZER_LIST');
                        response = MENUS.ORGANIZER_LIST + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.ASSEMBLY + COMMON_NAV;
                    }
                    break;
                case 'ORGANIZER_LIST':
                    if (parseInt(text) >= 1 && parseInt(text) <= 3) {
                        updateState(session, 'ORGANIZER_DETAILS');
                        response = MENUS.ORGANIZER_DETAILS + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.ORGANIZER_LIST + COMMON_NAV;
                    }
                    break;
                case 'ORGANIZER_DETAILS':
                    if(text !== '0'){
                         response = "*Invalid input.*\n\n" + MENUS.ORGANIZER_DETAILS + COMMON_NAV;
                    }
                    break;
    
                // MEMBERS
                case 'MEMBERS_DISTRICT':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'MEMBERS_ASSEMBLY');
                        response = MENUS.ASSEMBLY + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.DISTRICT + COMMON_NAV;
                    }
                    break;
                case 'MEMBERS_ASSEMBLY':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'MEMBER_LIST');
                        response = MENUS.MEMBER_LIST + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.ASSEMBLY + COMMON_NAV;
                    }
                    break;
                case 'MEMBER_LIST':
                    if (parseInt(text) >= 1 && parseInt(text) <= 2) {
                        updateState(session, 'MEMBER_DETAILS');
                        response = MENUS.MEMBER_DETAILS + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.MEMBER_LIST + COMMON_NAV;
                    }
                    break;
                case 'MEMBER_DETAILS':
                    if(text !== '0'){
                         response = "*Invalid input.*\n\n" + MENUS.MEMBER_DETAILS + COMMON_NAV;
                    }
                    break;
    
                // ADD BUSINESS
                case 'ADD_BUSINESS_NAME':
                    if (text !== '0') {
                        updateState(session, 'ADD_BUSINESS_OWNER');
                        response = MENUS.ADD_BUSINESS_OWNER + COMMON_NAV;
                    }
                    break;
                case 'ADD_BUSINESS_OWNER':
                    if (text !== '0') {
                        updateState(session, 'ADD_BUSINESS_PHONE');
                        response = MENUS.ADD_BUSINESS_PHONE + COMMON_NAV;
                    }
                    break;
                case 'ADD_BUSINESS_PHONE':
                    if (text !== '0') {
                        updateState(session, 'ADD_BUSINESS_CATEGORY');
                        response = MENUS.ADD_BUSINESS_CATEGORY + COMMON_NAV;
                    }
                    break;
                case 'ADD_BUSINESS_CATEGORY':
                    if (text !== '0') {
                        updateState(session, 'ADD_BUSINESS_DESC');
                        response = MENUS.ADD_BUSINESS_DESC + COMMON_NAV;
                    }
                    break;
                case 'ADD_BUSINESS_DESC':
                    if (text !== '0') {
                        updateState(session, 'ADD_BUSINESS_PHOTO');
                        response = MENUS.ADD_BUSINESS_PHOTO + COMMON_NAV;
                    }
                    break;
                case 'ADD_BUSINESS_PHOTO':
                    if (text !== '0' || text === 'image_received') {
                        updateState(session, 'ADD_BUSINESS_LOCATION');
                        response = MENUS.ADD_BUSINESS_LOCATION + COMMON_NAV;
                    }
                    break;
                case 'ADD_BUSINESS_LOCATION':
                    if (text !== '0' || text === 'location_received') {
                        updateState(session, 'ADD_BUSINESS_CONFIRM');
                        session.history = []; // Reset after submission
                        session.state = 'MAIN'; // Go back to main
                        response = MENUS.ADD_BUSINESS_CONFIRM + "\n\n" + MENUS.MAIN;
                    }
                    break;
    
                // SUBSCRIPTIONS
                case 'SUBSCRIPTION':
                    if (text === '1') {
                        updateState(session, 'SUB_MONTHLY');
                        response = MENUS.SUB_MONTHLY + COMMON_NAV;
                    } else if (text === '2') {
                        updateState(session, 'SUB_YEARLY');
                        response = MENUS.SUB_YEARLY + COMMON_NAV;
                    } else if (text === '3') {
                        updateState(session, 'SUB_LIFETIME');
                        response = MENUS.SUB_LIFETIME + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.SUBSCRIPTION + COMMON_NAV;
                    }
                    break;
                case 'SUB_MONTHLY':
                case 'SUB_YEARLY':
                case 'SUB_LIFETIME':
                    if (text === '1') {
                        response = "Redirecting to payment..." + COMMON_NAV;
                    } else if (text === '2') {
                        goBack(session);
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + (session.state === 'SUB_MONTHLY' ? MENUS.SUB_MONTHLY : session.state === 'SUB_YEARLY' ? MENUS.SUB_YEARLY : MENUS.SUB_LIFETIME) + COMMON_NAV;
                    }
                    break;
    
                // NEWS
                case 'NEWS_DISTRICT':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'NEWS_ASSEMBLY');
                        response = MENUS.ASSEMBLY + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.DISTRICT + COMMON_NAV;
                    }
                    break;
                case 'NEWS_ASSEMBLY':
                    if (parseInt(text) >= 1 && parseInt(text) <= 4) {
                        updateState(session, 'NEWS_LIST');
                        response = MENUS.NEWS_LIST + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.ASSEMBLY + COMMON_NAV;
                    }
                    break;
                case 'NEWS_LIST':
                    if (parseInt(text) >= 1 && parseInt(text) <= 3) {
                        updateState(session, 'NEWS_DETAILS');
                        response = MENUS.NEWS_DETAILS + COMMON_NAV;
                    } else if (text !== '0') {
                        response = "*Invalid input.*\n\n" + MENUS.NEWS_LIST + COMMON_NAV;
                    }
                    break;
                case 'NEWS_DETAILS':
                    if(text !== '0'){
                         response = "*Invalid input.*\n\n" + MENUS.NEWS_DETAILS + COMMON_NAV;
                    }
                    break;
            }

            // If they pressed '0' or '2' (in some cases) to go back, render the target state correctly.
            if (text === '0' || (response === '' && text === '2' && session.state.startsWith('SUB_'))) {
                let menuString = '';
                
                // Re-map state to its menu literal
                const mapStateToMenu = {
                    'MAIN': MENUS.MAIN,
                    'BUSINESS_CATEGORY': MENUS.BUSINESS_CATEGORY,
                    'BUSINESS_SUB_CATEGORY': MENUS.BUSINESS_SUB_CATEGORY,
                    'BUSINESS_LIST': MENUS.BUSINESS_LIST,
                    'BUSINESS_DETAILS': MENUS.BUSINESS_DETAILS,
                    'ORG_DISTRICT': MENUS.DISTRICT,
                    'ORG_ASSEMBLY': MENUS.ASSEMBLY,
                    'ORGANIZER_LIST': MENUS.ORGANIZER_LIST,
                    'ORGANIZER_DETAILS': MENUS.ORGANIZER_DETAILS,
                    'MEMBERS_DISTRICT': MENUS.DISTRICT,
                    'MEMBERS_ASSEMBLY': MENUS.ASSEMBLY,
                    'MEMBER_LIST': MENUS.MEMBER_LIST,
                    'MEMBER_DETAILS': MENUS.MEMBER_DETAILS,
                    'ADD_BUSINESS_NAME': MENUS.ADD_BUSINESS_NAME,
                    'ADD_BUSINESS_OWNER': MENUS.ADD_BUSINESS_OWNER,
                    'ADD_BUSINESS_PHONE': MENUS.ADD_BUSINESS_PHONE,
                    'ADD_BUSINESS_CATEGORY': MENUS.ADD_BUSINESS_CATEGORY,
                    'ADD_BUSINESS_DESC': MENUS.ADD_BUSINESS_DESC,
                    'ADD_BUSINESS_PHOTO': MENUS.ADD_BUSINESS_PHOTO,
                    'ADD_BUSINESS_LOCATION': MENUS.ADD_BUSINESS_LOCATION,
                    'SUBSCRIPTION': MENUS.SUBSCRIPTION,
                    'SUB_MONTHLY': MENUS.SUB_MONTHLY,
                    'SUB_YEARLY': MENUS.SUB_YEARLY,
                    'SUB_LIFETIME': MENUS.SUB_LIFETIME,
                    'NEWS_DISTRICT': MENUS.DISTRICT,
                    'NEWS_ASSEMBLY': MENUS.ASSEMBLY,
                    'NEWS_LIST': MENUS.NEWS_LIST,
                    'NEWS_DETAILS': MENUS.NEWS_DETAILS
                };

                menuString = mapStateToMenu[session.state] || MENUS.MAIN;
                response = session.state === 'MAIN' ? menuString : menuString + COMMON_NAV;
            }

            if (response) {
                await sendMessage(userId, response);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

app.listen(PORT, () => {
    console.log(`Vanigan WhatsApp Bot Webhook listening on port ${PORT}`);
});
