import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  documentId: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

export const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
