const mongoose = require('mongoose');

const didSchema = new mongoose.Schema({
  did: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
  },
  serviceEndpoint: {
    type: String,
  },
  verificationMethods: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  services: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  active: {
    type: Boolean,
    default: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// --- Indexes ---

// Primary lookup by DID string
didSchema.index({ did: 1 }, { unique: true });

// Owner's DIDs (most common list query)
didSchema.index({ owner: 1, created: -1 });

// Active DIDs by owner (filtered list)
didSchema.index({ owner: 1, active: 1 });

// Active status filter (global active DID queries)
didSchema.index({ active: 1, created: -1 });

module.exports = mongoose.model('DID', didSchema);
