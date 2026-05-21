import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true
  },
  messages: [chatMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
chatHistorySchema.index({ documentId: 1 });

// Update timestamp on save
chatHistorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;
