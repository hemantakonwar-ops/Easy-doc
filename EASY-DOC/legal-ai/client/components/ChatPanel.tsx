'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils/cn';
import { sendChatMessage } from '../features/chat/chatService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  documentId?: string;
  className?: string;
}

export default function ChatPanel({ documentId, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Legal Assistant. Ask me anything about this document.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(input, documentId);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer || 'I apologize, but I could not process your question at this time.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)]', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--vscode-border)] flex items-center justify-between bg-[var(--vscode-activity)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--vscode-accent)]" />
          <h2 className="text-sm font-semibold text-[var(--vscode-text)]">AI Legal Assistant</h2>
        </div>
        <button className="text-[var(--vscode-text-muted)] hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                'w-8 h-8 flex items-center justify-center shrink-0',
                message.role === 'user'
                  ? 'bg-[var(--vscode-accent)] text-white'
                  : 'bg-[var(--vscode-hover)] text-[var(--vscode-text)]'
              )}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[85%] p-3 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'bg-[var(--vscode-accent)] text-white'
                  : 'bg-[var(--vscode-hover)] text-[var(--vscode-text)]'
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-[var(--vscode-hover)] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[var(--vscode-text)]" />
            </div>
            <div className="bg-[var(--vscode-hover)] p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--vscode-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[var(--vscode-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[var(--vscode-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-[var(--vscode-border)] bg-[var(--vscode-activity)]">
          <div className="flex flex-wrap gap-2">
            {[
              'What happens if the other party breaches the agreement?',
              'Is there any payment obligation in this agreement?',
            ].map((question) => (
              <button
                key={question}
                onClick={() => {
                  setInput(question);
                }}
                className="px-3 py-1.5 text-xs bg-[var(--vscode-hover)] border border-[var(--vscode-border)] text-[var(--vscode-text)] hover:border-[var(--vscode-text-muted)] transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[var(--vscode-border)] bg-[var(--vscode-activity)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything about this document..."
            className="flex-1 px-3 py-2 bg-[var(--vscode-input)] border border-[var(--vscode-border)] text-[var(--vscode-text)] text-sm focus:outline-none focus:border-[var(--vscode-accent)]"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-[var(--vscode-accent)] text-white hover:bg-[var(--vscode-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
