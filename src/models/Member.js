const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: { type: String, required: true },
  assembly: { type: String, required: true },
  contact: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  position: { type: String, default: '' },
  businessName: { type: String, default: '' },
  whatsappNumber: { type: String, default: '' }
}, { timestamps: true });

memberSchema.index({ district: 1, assembly: 1 });

module.exports = mongoose.model('Member', memberSchema);
