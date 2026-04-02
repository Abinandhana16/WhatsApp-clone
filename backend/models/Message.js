const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: false },
  type: { type: String, enum: ['text', 'voice', 'image', 'file', 'call'], default: 'text' },
  audioData: { type: String, required: false },
  transcript: { type: String, required: false },
  fileUrl: { type: String, required: false }, // Base64 or URL
  fileName: { type: String, required: false },
  fileType: { type: String, required: false },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  deletedForEveryone: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track 'Delete for me'
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
