const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  whatsappNumber: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plan: { type: String, enum: ['monthly', 'yearly', 'lifetime'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  razorpayPaymentLinkId: { type: String },
  razorpayPaymentLinkUrl: { type: String },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
