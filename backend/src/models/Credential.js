const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  issuer: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  credentialType: {
    type: String,
    required: true,
  },
  claims: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  issued: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expires: {
    type: Date,
    default: null,
  },
  dataHash: {
    type: String,
  },
  revoked: {
    type: Boolean,
    default: false,
  },
  credentialSchema: {
    type: String,
  },
  proof: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

// --- Indexes ---

// Primary lookup by credential ID
credentialSchema.index({ id: 1 }, { unique: true });

// Most common query: credentials by issuer, filtered/sorted by issued date
credentialSchema.index({ issuer: 1, issued: -1 });

// Credentials by subject (holder lookup)
credentialSchema.index({ subject: 1, issued: -1 });

// Filter by type (analytics + search)
credentialSchema.index({ credentialType: 1, issued: -1 });

// Revocation status filter (frequently used in verification)
credentialSchema.index({ revoked: 1, issued: -1 });

// Expiry queries (find expired / active credentials)
credentialSchema.index({ expires: 1 });

// Compound: issuer + type (issuer analytics breakdown)
credentialSchema.index({ issuer: 1, credentialType: 1, issued: -1 });

// Compound: subject + revoked (subject's active credentials)
credentialSchema.index({ subject: 1, revoked: 1 });

module.exports = mongoose.model('Credential', credentialSchema);
