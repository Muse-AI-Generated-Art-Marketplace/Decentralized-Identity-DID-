const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    type: String
  },
  ipAddress: {
    type: String
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index
  },
  isValid: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Active sessions by user (auth validation)
sessionSchema.index({ userId: 1, isValid: 1 });

module.exports = mongoose.model('Session', sessionSchema);
