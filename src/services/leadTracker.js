const Lead = require('../models/Lead');

async function trackAction(whatsappNumber, state, action, input = '', data = {}) {
  try {
    let lead = await Lead.findOne({ whatsappNumber });

    if (!lead) {
      lead = new Lead({
        whatsappNumber,
        firstContactAt: new Date(),
        actions: []
      });
    }

    lead.actions.push({
      state,
      action,
      input,
      data,
      timestamp: new Date()
    });

    lead.totalInteractions = lead.actions.length;
    lead.lastState = state;
    lead.lastActivityAt = new Date();

    await lead.save();
    return lead;
  } catch (err) {
    console.error('Lead tracking error:', err.message);
  }
}

async function getLeadSummary(whatsappNumber) {
  try {
    return await Lead.findOne({ whatsappNumber }).lean();
  } catch (err) {
    console.error('Get lead error:', err.message);
    return null;
  }
}

module.exports = { trackAction, getLeadSummary };
