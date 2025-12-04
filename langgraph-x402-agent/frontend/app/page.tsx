'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  transaction?: {
    hash: string;
    network: string;
    explorerUrl: string;
    cost?: number;
    tool?: string;
  };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI agent powered by x402 micropayments. I can help you with sentiment analysis, translation, code review, company research, and more. Try asking me to analyze sentiment or translate text!'
    }
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        transaction: data.transaction
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🤖 LangGraph x402 Agent</h1>
        <p>AI-powered assistant with cryptocurrency micropayments</p>
      </div>

      <div className="wallet-info">
        <h3>💼 Payment Receiver</h3>
        <div className="wallet-address">0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6</div>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-label">
                {message.role === 'user' ? '👤 You' : '🤖 Agent'}
              </div>
              <div className="message-content">
                {message.content}

                {message.transaction && (
                  <div className="transaction-box">
                    <h4>💳 Payment Transaction</h4>
                    <div className="tx-info">
                      {message.transaction.tool && (
                        <div className="tx-row">
                          <span className="tx-label">Tool:</span>
                          <span className="tx-value">
                            {message.transaction.tool}
                            {message.transaction.cost && (
                              <span className="cost-badge">${message.transaction.cost}</span>
                            )}
                          </span>
                        </div>
                      )}
                      <div className="tx-row">
                        <span className="tx-label">Network:</span>
                        <span className="tx-value">{message.transaction.network}</span>
                      </div>
                      <div className="tx-row">
                        <span className="tx-label">Hash:</span>
                        <span className="tx-value">{message.transaction.hash}</span>
                      </div>
                      <a
                        href={message.transaction.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                      >
                        View on Explorer →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="message-label">🤖 Agent</div>
              <div className="message-content">
                <div className="loading">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
