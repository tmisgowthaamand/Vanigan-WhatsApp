const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  whatsappNumber: { type: String, required: true, index: true },
  userName: { type: String, default: '' },
  actions: [{
    state: { type: String },
    action: { type: String },
    input: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  }],
  totalInteractions: { type: Number, default: 0 },
  lastState: { type: String, default: 'choose_service' },
  firstContactAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

leadSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
