const mongoose = require('mongoose');

const CATEGORIES = ['camera', 'laptop', 'tool', 'audio-video', 'meeting', 'other'];
const CONDITIONS = ['excellent', 'good', 'fair', 'damaged'];

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    description: { type: String, default: '', trim: true, maxlength: 300 },
    // Latest recorded condition. It is updated every time an item is returned.
    condition: { type: String, enum: CONDITIONS, default: 'good' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
