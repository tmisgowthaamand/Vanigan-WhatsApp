const User = require('../models/User');
const wa = require('../services/whatsapp');
const { trackAction } = require('../services/leadTracker');
const en = require('../i18n/en');
const ta = require('../i18n/ta');

const { handleBusinessList, startBusinessListFlow } = require('./businessListHandler');
const { handleOrganizer, startOrganizerFlow } = require('./organizerHandler');
const { handleMember, startMemberFlow } = require('./memberHandler');
const { handleAddBusiness, startAddBusinessFlow } = require('./addBusinessHandler');
const { handleSubscription, startSubscriptionFlow } = require('./subscriptionHandler');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vanigan-whats-app.vercel.app/';

// State → previous state mapping for "back" navigation
const BACK_MAP = {
  'business_list': 'choose_service',
  'business_details': 'business_list',
  'organizer_district': 'choose_service',
  'organizer_assembly': 'organizer_district',
  'organizer_list': 'organizer_assembly',
  'member_district': 'choose_service',
  'member_assembly': 'member_district',
  'member_list': 'member_assembly',
  'add_business_name': 'choose_service',
  'add_business_address': 'add_business_name',
  'add_business_district': 'add_business_address',
  'add_business_assembly': 'add_business_district',
  'add_business_contact': 'add_business_assembly',
  'add_business_photo': 'add_business_contact',
  'subscription_plans': 'choose_service',
  'waiting_for_payment': 'subscription_plans'
};

async function handleMessage(messageData) {
  const { from, text, message } = messageData;

  // Find or create user
  let user = await User.findOne({ whatsappNumber: from });
  if (!user) {
    user = new User({ whatsappNumber: from, currentState: 'choose_service' });
    await user.save();
  }

  const lang = user.language === 'ta' ? ta : en;

  // ── Global commands ──
  // "9" or "menu" → back to main menu
  if (text === '9' || text.toLowerCase() === 'menu') {
    user.currentState = 'choose_service';
    user.tempData = {};
    await user.save();
    await sendMainMenu(user, lang);
    await trackAction(from, 'choose_service', 'main_menu', text, {});
    return;
  }

  // "0" or "back" → go back one step
  if (text === '0' || text.toLowerCase() === 'back') {
    const prevState = BACK_MAP[user.currentState] || 'choose_service';
    user.currentState = prevState;
    // Clear tempData only if going back to main menu
    if (prevState === 'choose_service') user.tempData = {};
    await user.save();

    if (prevState === 'choose_service') {
      await sendMainMenu(user, lang);
    } else {
      // Re-enter the previous state's prompt
      await reEnterState(user, lang);
    }
    await trackAction(from, prevState, 'back', text, {});
    return;
  }

  // "lang" → toggle language
  if (text.toLowerCase() === 'lang' || text.toLowerCase() === 'language') {
    user.language = user.language === 'en' ? 'ta' : 'en';
    await user.save();
    const newLang = user.language === 'ta' ? ta : en;
    await wa.sendText(from, user.language === 'ta' ? 'மொழி தமிழ் ஆக மாற்றப்பட்டது!' : 'Language changed to English!');
    await sendMainMenu(user, newLang);
    return;
  }

  // ── Greeting → show main menu ──
  const greetings = ['hi', 'hello', 'hey', 'start', 'vanigan'];
  if (greetings.includes(text.toLowerCase()) || user.currentState === 'choose_service') {
    if (greetings.includes(text.toLowerCase())) {
      user.currentState = 'choose_service';
      user.tempData = {};
      await user.save();
    }

    // In choose_service state, handle menu selection
    if (user.currentState === 'choose_service') {
      switch (text) {
        case '1':
          await startBusinessListFlow(user, lang);
          await trackAction(from, 'business_list', 'select_service', '1', { service: 'business_list' });
          return;
        case '2':
          await startOrganizerFlow(user, lang);
          await trackAction(from, 'organizer_district', 'select_service', '2', { service: 'organizer_list' });
          return;
        case '3':
          await startMemberFlow(user, lang);
          await trackAction(from, 'member_district', 'select_service', '3', { service: 'member_list' });
          return;
        case '4':
          await startAddBusinessFlow(user, lang);
          await trackAction(from, 'add_business_name', 'select_service', '4', { service: 'add_business' });
          return;
        case '5':
          await startSubscriptionFlow(user, lang);
          await trackAction(from, 'subscription_plans', 'select_service', '5', { service: 'subscription' });
          return;
        default:
          // Show main menu for greetings or unrecognized input in menu state
          await sendMainMenu(user, lang);
          await trackAction(from, 'choose_service', 'greeting', text, {});
          return;
      }
    }
  }

  // ── Route to specific handler based on currentState ──
  try {
    const state = user.currentState;

    if (state === 'business_list' || state === 'business_details') {
      await handleBusinessList(user, text, lang);
    } else if (state.startsWith('organizer_')) {
      await handleOrganizer(user, text, lang);
    } else if (state.startsWith('member_')) {
      await handleMember(user, text, lang);
    } else if (state.startsWith('add_business_')) {
      await handleAddBusiness(user, text, lang, message);
    } else if (state === 'subscription_plans' || state === 'waiting_for_payment') {
      await handleSubscription(user, text, lang);
    } else {
      // Unknown state → reset to menu
      user.currentState = 'choose_service';
      user.tempData = {};
      await user.save();
      await sendMainMenu(user, lang);
    }
  } catch (err) {
    console.error('Handler error:', err);
    await wa.sendText(from, lang.error);
  }
}

async function sendMainMenu(user, lang) {
  const num = user.whatsappNumber;
  const bannerUrl = 'https://raw.githubusercontent.com/tmisgowthaamand/Vanigan-WhatsApp/main/vanigan-frontend/public/banner.png';

  const introMessage = `${lang.welcome}\n\n${lang.mainMenu}`;

  try {
    await wa.sendImage(num, bannerUrl, introMessage);
  } catch {
    await wa.sendText(num, introMessage);
  }

  // Also send interactive list
  await wa.sendList(num, 'Vanigan Menu', 'Select a service:', 'Open Menu', [
    {
      title: 'Services',
      rows: [
        { id: '1', title: 'Business List', description: 'Browse approved businesses' },
        { id: '2', title: 'Organizer List', description: 'Find district organizers' },
        { id: '3', title: 'Member List', description: 'Browse community members' },
        { id: '4', title: 'Add Business', description: 'Register your business' },
        { id: '5', title: 'Subscription', description: 'View premium plans' }
      ]
    }
  ]);
}

// Re-enter a state and show its prompt
async function reEnterState(user, lang) {
  const state = user.currentState;
  const num = user.whatsappNumber;

  if (state === 'business_list') {
    await handleBusinessList(user, '1', lang);
  } else if (state === 'organizer_district') {
    await startOrganizerFlow(user, lang);
  } else if (state === 'organizer_assembly') {
    // Re-show assembly list for selected district
    const District = require('../models/District');
    const district = await District.findOne({ name: user.tempData.selectedDistrict }).lean();
    if (district) {
      let msg = lang.selectAssembly;
      district.assemblies.forEach((a, i) => { msg += `${i + 1}. ${a.name}\n`; });
      msg += lang.backToMenu;
      await wa.sendText(num, msg);
    }
  } else if (state === 'member_district') {
    await startMemberFlow(user, lang);
  } else if (state === 'member_assembly') {
    const District = require('../models/District');
    const district = await District.findOne({ name: user.tempData.selectedDistrict }).lean();
    if (district) {
      let msg = lang.selectAssembly;
      district.assemblies.forEach((a, i) => { msg += `${i + 1}. ${a.name}\n`; });
      msg += lang.backToMenu;
      await wa.sendText(num, msg);
    }
  } else if (state === 'add_business_name') {
    await wa.sendText(num, lang.addBusinessName + lang.backToMenu);
  } else if (state === 'add_business_address') {
    await wa.sendText(num, lang.addBusinessAddress + lang.backToMenu);
  } else if (state === 'add_business_district') {
    const District = require('../models/District');
    const districts = await District.find().sort({ name: 1 }).lean();
    let msg = lang.addBusinessDistrict;
    districts.forEach((d, i) => { msg += `${i + 1}. ${d.name}\n`; });
    msg += lang.backToMenu;
    await wa.sendText(num, msg);
  } else if (state === 'add_business_assembly') {
    const District = require('../models/District');
    const district = await District.findOne({ name: user.tempData.district }).lean();
    if (district) {
      let msg = lang.addBusinessAssembly;
      district.assemblies.forEach((a, i) => { msg += `${i + 1}. ${a.name}\n`; });
      msg += lang.backToMenu;
      await wa.sendText(num, msg);
    }
  } else if (state === 'add_business_contact') {
    await wa.sendText(num, lang.addBusinessContact + lang.backToMenu);
  } else if (state === 'add_business_photo') {
    await wa.sendText(num, lang.addBusinessPhoto + lang.backToMenu);
  } else if (state === 'subscription_plans') {
    await wa.sendText(num, lang.subscriptionPlans + lang.backToMenu);
  } else {
    await sendMainMenu(user, lang);
  }
}

module.exports = { handleMessage };
