"use client";

import { useState, FormEvent } from 'react';
import { sendChatMessage } from './chatService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  documentId?: string;
}

export default function Chatbot({ documentId }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(input, documentId);
      const assistantMsg: Message = { role: 'assistant', content: res.answer };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded h-96 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-2 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the document..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </form>
    </div>
  );
}
