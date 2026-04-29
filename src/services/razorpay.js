const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
}

const PLANS = {
  monthly: { name: 'Monthly Plan', amount: 1000, period: 'monthly' },   // ₹10 in paise (test)
  yearly:  { name: 'Yearly Plan',  amount: 2000, period: 'yearly' },    // ₹20 in paise (test)
  lifetime:{ name: 'Lifetime Plan', amount: 3000, period: 'lifetime' }  // ₹30 in paise (test)
};

async function createPaymentLink(plan, whatsappNumber, userId) {
  const planInfo = PLANS[plan];
  if (!planInfo) throw new Error('Invalid plan');

  const rz = getRazorpay();

  const paymentLink = await rz.paymentLink.create({
    amount: planInfo.amount,
    currency: 'INR',
    description: `Vanigan ${planInfo.name}`,
    customer: {
      contact: `+${whatsappNumber}`
    },
    notify: { sms: false, email: false },
    callback_url: `${process.env.BASE_URL || 'https://localhost:3000'}/razorpay/callback`,
    callback_method: 'get',
    notes: {
      plan: plan,
      whatsappNumber: whatsappNumber,
      userId: userId
    }
  });

  // Save initial pending payment record
  try {
    await Payment.create({
      whatsappNumber,
      userId: userId,
      plan: plan,
      amount: planInfo.amount / 100,
      currency: 'INR',
      razorpayOrderId: paymentLink.id,
      razorpayPaymentLinkId: paymentLink.id,
      razorpayPaymentLinkUrl: paymentLink.short_url,
      status: 'created'
    });
  } catch (err) {
    console.error('Failed to create pending payment record:', err.message);
  }

  return {
    paymentLinkId: paymentLink.id,
    paymentLinkUrl: paymentLink.short_url,
    amount: planInfo.amount / 100,
    plan: plan,
    planName: planInfo.name
  };
}

function verifyWebhookSignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return expectedSignature === signature;
}

module.exports = { createPaymentLink, verifyWebhookSignature, PLANS, getRazorpay };
