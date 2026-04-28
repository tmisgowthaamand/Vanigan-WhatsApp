const express = require('express');
const router = express.Router();
const { verifyWebhookSignature } = require('../services/razorpay');
const User = require('../models/User');
const Payment = require('../models/Payment');
const wa = require('../services/whatsapp');
const { trackAction } = require('../services/leadTracker');
const en = require('../i18n/en');
const ta = require('../i18n/ta');

// Razorpay Webhook - payment confirmation
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = verifyWebhookSignature(req.body, signature);

    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment_link.paid') {
      const paymentLinkEntity = payload.payment_link.entity;
      const paymentEntity = payload.payment.entity;
      const notes = paymentLinkEntity.notes || {};

      const whatsappNumber = notes.whatsappNumber;
      const plan = notes.plan;

      if (!whatsappNumber) {
        console.error('No whatsappNumber in payment notes');
        return res.status(200).json({ status: 'ok' });
      }

      // Update user subscription
      const user = await User.findOne({ whatsappNumber });
      if (user) {
        const now = new Date();
        let endDate = new Date();

        if (plan === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (plan === 'lifetime') {
          endDate.setFullYear(endDate.getFullYear() + 100);
        }

        user.subscription = {
          plan,
          status: 'active',
          razorpayOrderId: paymentLinkEntity.id,
          razorpayPaymentId: paymentEntity.id,
          startDate: now,
          endDate: endDate
        };
        user.currentState = 'choose_service';
        user.tempData = {};
        await user.save();

        // Save payment record
        await Payment.create({
          whatsappNumber,
          userId: user._id,
          plan,
          amount: paymentEntity.amount / 100,
          currency: paymentEntity.currency,
          razorpayOrderId: paymentLinkEntity.id,
          razorpayPaymentId: paymentEntity.id,
          status: 'paid'
        });

        // Send success message via WhatsApp
        const lang = user.language === 'ta' ? ta : en;
        const planNames = { monthly: 'Monthly', yearly: 'Yearly', lifetime: 'Lifetime' };
        const msg = lang.paymentSuccess
          .replace('{plan}', planNames[plan] || plan)
          .replace('{endDate}', endDate.toLocaleDateString('en-IN'));

        await wa.sendText(whatsappNumber, msg);
        await trackAction(whatsappNumber, 'choose_service', 'payment_success', '', {
          plan, amount: paymentEntity.amount / 100, paymentId: paymentEntity.id
        });
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const whatsappNumber = notes.whatsappNumber;

      if (whatsappNumber) {
        const user = await User.findOne({ whatsappNumber });
        if (user) {
          user.subscription.status = 'none';
          user.currentState = 'choose_service';
          await user.save();

          const lang = user.language === 'ta' ? ta : en;
          await wa.sendText(whatsappNumber, lang.paymentFailed);
          await trackAction(whatsappNumber, 'choose_service', 'payment_failed', '', {});
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return res.status(200).json({ status: 'error' });
  }
});

// Razorpay callback (redirect after payment)
router.get('/callback', async (req, res) => {
  const { razorpay_payment_link_id, razorpay_payment_link_status } = req.query;
  if (razorpay_payment_link_status === 'paid') {
    return res.send('<html><body><h2>Payment Successful! You can close this window and check WhatsApp.</h2></body></html>');
  }
  return res.send('<html><body><h2>Payment status: ' + (razorpay_payment_link_status || 'unknown') + '</h2></body></html>');
});

module.exports = router;
