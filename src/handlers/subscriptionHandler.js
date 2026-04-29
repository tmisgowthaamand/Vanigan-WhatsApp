const wa = require('../services/whatsapp');
const { createPaymentLink, PLANS } = require('../services/razorpay');
const { trackAction } = require('../services/leadTracker');
const Payment = require('../models/Payment');

async function handleSubscription(user, text, lang) {
  const t = lang;
  const num = user.whatsappNumber;

  switch (user.currentState) {
    case 'subscription_plans': {
      let plan = null;
      if (text.startsWith('plan_')) {
        plan = text.replace('plan_', '');
      } else if (text === '1') plan = 'monthly';
      else if (text === '2') plan = 'yearly';
      else if (text === '3') plan = 'lifetime';
      else {
        await wa.sendText(num, t.invalidInput);
        await wa.sendButtons(num, 'Navigate:', [
          { id: '0', title: 'Back' },
          { id: '9', title: 'Main Menu' }
        ]);
        return;
      }

      try {
        // Check for existing pending payment link for this user + plan
        const existingPayment = await Payment.findOne({
          whatsappNumber: num,
          plan: plan,
          status: 'created',
          razorpayPaymentLinkUrl: { $exists: true, $ne: null }
        }).sort({ createdAt: -1 });

        let paymentLinkId, paymentLinkUrl, amount;

        if (existingPayment) {
          // Reuse existing payment link instead of creating a new one
          paymentLinkId = existingPayment.razorpayPaymentLinkId || existingPayment.razorpayOrderId;
          paymentLinkUrl = existingPayment.razorpayPaymentLinkUrl;
          amount = existingPayment.amount;
        } else {
          // Create new payment link only if no pending one exists
          const result = await createPaymentLink(plan, num, user._id.toString());
          paymentLinkId = result.paymentLinkId;
          paymentLinkUrl = result.paymentLinkUrl;
          amount = result.amount;
        }

        // Store payment info in user
        user.tempData.selectedPlan = plan;
        user.tempData.paymentLinkId = paymentLinkId;
        user.tempData.paymentLinkUrl = paymentLinkUrl;
        user.subscription = {
          ...user.subscription,
          plan: plan,
          status: 'pending',
          razorpayOrderId: paymentLinkId
        };
        user.currentState = 'waiting_for_payment';
        await user.save();

        const planInfo = PLANS[plan];
        const msg = t.paymentLinkMsg
          .replace('{plan}', planInfo.name)
          .replace('{amount}', amount)
          .replace('{paymentLink}', paymentLinkUrl);

        await wa.sendText(num, msg);
        await trackAction(num, 'waiting_for_payment', 'payment_link_sent', plan, {
          plan, amount, paymentLinkId
        });
      } catch (err) {
        console.error('Razorpay error:', err.message);
        await wa.sendText(num, t.error);
      }
      break;
    }

    case 'waiting_for_payment': {
      // Resend the existing payment link instead of just a message
      const paymentLinkUrl = user.tempData.paymentLinkUrl;
      if (paymentLinkUrl) {
        const planInfo = PLANS[user.tempData.selectedPlan];
        const existingAmount = planInfo ? planInfo.amount / 100 : '';
        const msg = t.paymentLinkMsg
          .replace('{plan}', planInfo ? planInfo.name : user.tempData.selectedPlan)
          .replace('{amount}', existingAmount)
          .replace('{paymentLink}', paymentLinkUrl);
        await wa.sendText(num, msg);
      } else {
        await wa.sendText(num, t.waitingPayment);
      }
      await wa.sendButtons(num, 'Navigate:', [
        { id: '0', title: 'Back' },
        { id: '9', title: 'Main Menu' }
      ]);
      await trackAction(num, 'waiting_for_payment', 'user_message_while_waiting', text, {});
      break;
    }
  }
}

async function startSubscriptionFlow(user, lang) {
  user.currentState = 'subscription_plans';
  user.tempData = {};
  user.selectedService = 'subscription';
  await user.save();

  const sections = [{
    title: 'Premium Plans',
    rows: [
      { id: 'plan_monthly', title: 'Monthly Plan', description: 'Rs.10 (test)' },
      { id: 'plan_yearly', title: 'Yearly Plan', description: 'Rs.20 (test)' },
      { id: 'plan_lifetime', title: 'Lifetime Plan', description: 'Rs.30 (test)' }
    ]
  }];

  await wa.sendList(user.whatsappNumber, 'Subscription Plans', 'Choose a premium plan to unlock full access:', 'View Plans', sections);
  
  await wa.sendButtons(user.whatsappNumber, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
  
  await trackAction(user.whatsappNumber, 'subscription_plans', 'started', '', {});
}

module.exports = { handleSubscription, startSubscriptionFlow };
