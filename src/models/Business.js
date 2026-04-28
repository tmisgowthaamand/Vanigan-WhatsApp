const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  address: { type: String, default: '' },
  district: { type: String, required: true },
  assembly: { type: String, required: true },
  photoUrl: { type: String, default: '' },
  contact: { type: String, default: '' },
  ownerWhatsapp: { type: String, default: '' },
  category: { type: String, default: '' },
  description: { type: String, default: '' },
  mapLink: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

businessSchema.index({ district: 1, assembly: 1 });
businessSchema.index({ status: 1 });

module.exports = mongoose.model('Business', businessSchema);
