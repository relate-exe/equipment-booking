const mongoose = require('mongoose');
const { CONDITIONS } = require('./Equipment');

const bookingSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    purpose: { type: String, default: '', trim: true, maxlength: 200 },
    status: { type: String, enum: ['booked', 'returned', 'cancelled'], default: 'booked' },
    returnCondition: { type: String, enum: [...CONDITIONS, null], default: null },
    returnNotes: { type: String, default: '', trim: true, maxlength: 300 },
    returnedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bookingSchema.path('end').validate(function (v) { return !this.start || v > this.start; }, 'End must be after start');
bookingSchema.index({ equipment: 1, start: 1, end: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
