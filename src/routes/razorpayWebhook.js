const express = require('express');
const router = express.Router();
const { verifyWebhookSignature, getRazorpay, PLANS } = require('../services/razorpay');
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

        // Update payment record
        await Payment.findOneAndUpdate(
          { razorpayOrderId: paymentLinkEntity.id },
          {
            whatsappNumber,
            userId: user._id,
            plan,
            amount: paymentEntity.amount / 100,
            currency: paymentEntity.currency,
            razorpayPaymentId: paymentEntity.id,
            status: 'paid'
          },
          { upsert: true }
        );

        // Send success confirmation message via WhatsApp
        const lang = user.language === 'ta' ? ta : en;
        const planNames = { monthly: 'Monthly', yearly: 'Yearly', lifetime: 'Lifetime' };
        const amountPaid = paymentEntity.amount / 100;
        const msg = lang.paymentSuccess
          .replace('{plan}', planNames[plan] || plan)
          .replace('{amount}', amountPaid)
          .replace('{paymentId}', paymentEntity.id)
          .replace('{startDate}', now.toLocaleDateString('en-IN'))
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
          // Don't reset user state — payment link is still active for retry
          const lang = user.language === 'ta' ? ta : en;

          // Resend the existing payment link so user can retry
          const paymentLinkUrl = user.tempData?.paymentLinkUrl;
          if (paymentLinkUrl) {
            await wa.sendText(whatsappNumber, `${lang.paymentFailed}\n\nYou can retry using the same link:\n${paymentLinkUrl}`);
          } else {
            await wa.sendText(whatsappNumber, lang.paymentFailed);
          }
          await trackAction(whatsappNumber, 'waiting_for_payment', 'payment_failed', '', {});
        }
        
        // Do NOT mark payment record as failed — the payment link is still active for retry
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
  const { razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_status } = req.query;
  
  const botNumber = process.env.BOT_PHONE_NUMBER || '15551596475';
  const waMeUrl = `https://wa.me/${botNumber}`;
  const deepLink = `whatsapp://send?phone=${botNumber}`;

  let statusTitle = 'Payment Processing...';
  let statusMsg = 'Your payment is being verified.';
  let bgColor = '#fffbeb';
  let textColor = '#92400e';

  // If payment is successful, verify and update records
  if (razorpay_payment_link_status === 'paid' && razorpay_payment_link_id) {
    try {
      // Find the payment record by razorpayOrderId (which stores the payment link ID)
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_payment_link_id });

      if (payment && payment.status !== 'paid') {
        const whatsappNumber = payment.whatsappNumber;
        const plan = payment.plan;

        // Update payment record to paid
        payment.status = 'paid';
        if (razorpay_payment_id) payment.razorpayPaymentId = razorpay_payment_id;
        await payment.save();

        // Update user subscription to active
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
            razorpayOrderId: razorpay_payment_link_id,
            razorpayPaymentId: razorpay_payment_id || '',
            startDate: now,
            endDate: endDate
          };
          user.currentState = 'choose_service';
          user.tempData = {};
          await user.save();

          // Send confirmation message via WhatsApp
          const lang = user.language === 'ta' ? ta : en;
          const planNames = { monthly: 'Monthly', yearly: 'Yearly', lifetime: 'Lifetime' };
          const amountPaid = payment.amount;
          const msg = lang.paymentSuccess
            .replace('{plan}', planNames[plan] || plan)
            .replace('{amount}', amountPaid)
            .replace('{paymentId}', razorpay_payment_id || razorpay_payment_link_id)
            .replace('{startDate}', now.toLocaleDateString('en-IN'))
            .replace('{endDate}', endDate.toLocaleDateString('en-IN'));

          await wa.sendText(whatsappNumber, msg);
          await trackAction(whatsappNumber, 'choose_service', 'payment_success', '', {
            plan, amount: amountPaid, paymentId: razorpay_payment_id
          });
        }
      }

      statusTitle = 'Payment Successful!';
      statusMsg = 'Your subscription is now active. You can return to WhatsApp.';
      bgColor = '#f0fdf4';
      textColor = '#166534';
    } catch (err) {
      console.error('Callback payment update error:', err);
      statusTitle = 'Payment Received';
      statusMsg = 'Your payment was received. Please return to WhatsApp.';
      bgColor = '#f0fdf4';
      textColor = '#166534';
    }
  } else if (razorpay_payment_link_status && razorpay_payment_link_status !== 'paid') {
    statusTitle = 'Payment Not Completed';
    statusMsg = `Status: ${razorpay_payment_link_status}. Please try again.`;
    bgColor = '#fef2f2';
    textColor = '#991b1b';
  }

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${statusTitle}</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: ${bgColor}; color: ${textColor}; text-align: center; padding: 20px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          .btn { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: 600; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="icon">${razorpay_payment_link_status === 'paid' ? '✅' : '⏳'}</div>
        <h2>${statusTitle}</h2>
        <p>${statusMsg}</p>
        <a href="${waMeUrl}" class="btn">Return to WhatsApp</a>
        <script>
          setTimeout(function() {
            window.location.href = "${deepLink}";
            setTimeout(function() {
              window.location.href = "${waMeUrl}";
            }, 1500);
          }, 2000);
        </script>
      </body>
    </html>
  `);
});

module.exports = router;
