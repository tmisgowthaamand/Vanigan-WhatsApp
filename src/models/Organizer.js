const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: { type: String, required: true },
  assembly: { type: String, required: true },
  contact: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  position: { type: String, default: '' },
  whatsappNumber: { type: String, default: '' }
}, { timestamps: true });

organizerSchema.index({ district: 1, assembly: 1 });

module.exports = mongoose.model('Organizer', organizerSchema);
