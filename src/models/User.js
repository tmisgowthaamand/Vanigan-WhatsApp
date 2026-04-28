const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  whatsappNumber: { type: String, unique: true, required: true, index: true },
  name: { type: String, default: '' },
  language: { type: String, enum: ['en', 'ta'], default: 'en' },
  currentState: { type: String, default: 'choose_service' },
  selectedService: { type: String, default: '' },
  tempData: { type: mongoose.Schema.Types.Mixed, default: {} },
  businessProfile: {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    businessName: { type: String }
  },
  subscription: {
    plan: { type: String, enum: ['monthly', 'yearly', 'lifetime', ''], default: '' },
    status: { type: String, enum: ['active', 'expired', 'pending', 'none'], default: 'none' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySubscriptionId: { type: String },
    startDate: { type: Date },
    endDate: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
