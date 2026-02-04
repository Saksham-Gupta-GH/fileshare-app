const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'file'], required: true },
  content: { type: String }, // Text content or file path
  originalName: { type: String }, // Original file name
  mimeType: { type: String }, // MIME type
  size: { type: Number },
  senderId: { type: String }, // Anonymous ID
  senderName: { type: String }, // Display Name
  createdAt: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }, // TTL handled by cron job for file cleanup
  messages: [messageSchema]
});

module.exports = mongoose.model('Room', roomSchema);
