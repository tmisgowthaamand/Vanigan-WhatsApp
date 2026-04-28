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
        
        // Update payment record to failed
        const orderId = payload.payment_link ? payload.payment_link.entity.id : paymentEntity.order_id;
        if (orderId) {
          await Payment.findOneAndUpdate({ razorpayOrderId: orderId }, { status: 'failed' });
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
  const { razorpay_payment_link_status } = req.query;
  
  // The bot's phone number without + or spaces
  const botNumber = process.env.BOT_PHONE_NUMBER || '15551596475';
  
  let text = 'Paid successfully';
  if (razorpay_payment_link_status !== 'paid') {
    text = `Payment status: ${razorpay_payment_link_status || 'unknown'}`;
  }
  
  const encodedText = encodeURIComponent(text);
  const waMeUrl = `https://wa.me/${botNumber}?text=${encodedText}`;
  const deepLink = `whatsapp://send?phone=${botNumber}&text=${encodedText}`;

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Redirecting to WhatsApp...</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0fdf4; color: #166534; text-align: center; padding: 20px; }
          .loader { border: 4px solid #bbf7d0; border-top: 4px solid #22c55e; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .btn { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: 600; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h2>Redirecting you back to WhatsApp...</h2>
        <p>If you are not redirected automatically within a few seconds, please click the button below.</p>
        <a href="${waMeUrl}" class="btn">Return to WhatsApp</a>
        <script>
          setTimeout(function() {
            // Try to open WhatsApp app directly via deep link
            window.location.href = "${deepLink}";
            
            // Fallback to wa.me if the deep link fails
            setTimeout(function() {
              window.location.href = "${waMeUrl}";
            }, 1000);
          }, 100);
        </script>
      </body>
    </html>
  `);
});

module.exports = router;
