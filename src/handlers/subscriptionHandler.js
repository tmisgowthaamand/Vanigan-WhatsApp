const wa = require('../services/whatsapp');
const { createPaymentLink, PLANS } = require('../services/razorpay');
const { trackAction } = require('../services/leadTracker');

async function handleSubscription(user, text, lang) {
  const t = lang;
  const num = user.whatsappNumber;

  switch (user.currentState) {
    case 'subscription_plans': {
      let plan = null;
      if (text === '1') plan = 'monthly';
      else if (text === '2') plan = 'yearly';
      else if (text === '3') plan = 'lifetime';
      else {
        await wa.sendText(num, t.invalidInput + '\n\n' + t.subscriptionPlans);
        return;
      }

      try {
        const result = await createPaymentLink(plan, num, user._id.toString());

        // Store payment info in user
        user.tempData.selectedPlan = plan;
        user.tempData.paymentLinkId = result.paymentLinkId;
        user.subscription = {
          ...user.subscription,
          plan: plan,
          status: 'pending',
          razorpayOrderId: result.paymentLinkId
        };
        user.currentState = 'waiting_for_payment';
        await user.save();

        const planInfo = PLANS[plan];
        const msg = t.paymentLinkMsg
          .replace('{plan}', planInfo.name)
          .replace('{amount}', result.amount)
          .replace('{paymentLink}', result.paymentLinkUrl);

        await wa.sendText(num, msg);
        await trackAction(num, 'waiting_for_payment', 'payment_link_sent', plan, {
          plan, amount: result.amount, paymentLinkId: result.paymentLinkId
        });
      } catch (err) {
        console.error('Razorpay error:', err.message);
        await wa.sendText(num, t.error);
      }
      break;
    }

    case 'waiting_for_payment': {
      await wa.sendText(num, t.waitingPayment);
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

  await wa.sendText(user.whatsappNumber, lang.subscriptionPlans);
  await wa.sendButtons(user.whatsappNumber, 'Navigate:', [
    { id: '0', title: 'Back' },
    { id: '9', title: 'Main Menu' }
  ]);
  await trackAction(user.whatsappNumber, 'subscription_plans', 'started', '', {});
}

module.exports = { handleSubscription, startSubscriptionFlow };
