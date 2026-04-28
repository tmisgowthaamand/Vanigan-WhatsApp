const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameTamil: { type: String, default: '' },
  code: { type: String, default: '' },
  assemblies: [{
    name: { type: String, required: true },
    nameTamil: { type: String, default: '' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('District', districtSchema);
