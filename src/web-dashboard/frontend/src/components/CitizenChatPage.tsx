import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Send, Bot, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  type: 'user' | 'assistant';
}

const CitizenChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    { id: '1', text: 'What to do during an earthquake?', icon: '🌍' },
    { id: '2', text: 'How to prepare for a cyclone?', icon: '🌪️' },
    { id: '3', text: 'Emergency supplies checklist', icon: '🎒' },
    { id: '4', text: 'What to do during flooding?', icon: '🌊' },
    { id: '5', text: 'Evacuation procedures', icon: '🚪' },
    { id: '6', text: 'How to help others safely?', icon: '🤝' },
  ];

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: 'welcome',
        query: '',
        response: 'Hello! I\'m your AI Safety Assistant. I can help you with disaster preparedness, emergency procedures, and safety guidelines. How can I assist you today?',
        timestamp: new Date().toISOString(),
        type: 'assistant',
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || message;
    
    if (!textToSend.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      query: textToSend,
      response: '',
      timestamp: new Date().toISOString(),
      type: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/chat`,
        {
          message: textToSend,
        }
      );

      if (response.data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          query: textToSend,
          response: response.data.data.response,
          timestamp: new Date().toISOString(),
          type: 'assistant',
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        query: textToSend,
        response: 'I apologize, but I\'m having trouble connecting right now. For immediate emergencies, please call 119. For general safety information, try asking about earthquake safety, flood preparedness, or evacuation procedures.',
        timestamp: new Date().toISOString(),
        type: 'assistant',
      };

      setMessages((prev) => [...prev, fallbackMessage]);
      toast.error('Failed to get response. Showing fallback message.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/citizen')}
                className="p-2 hover:bg-green-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <Bot className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">AI Safety Assistant</h1>
                  <p className="text-green-100 text-sm">Ask me anything about disaster safety</p>
                </div>
              </div>
            </div>
            <img 
              src="/favicon.png" 
              alt="ResQ Hub Logo" 
              className="h-10 w-10"
            />
          </div>
        </div>
      </header>

      {/* Quick Questions */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-gray-600 mb-3 font-semibold">Quick Questions:</p>
          <div className="flex overflow-x-auto space-x-3 pb-2">
            {quickQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuickQuestion(q.text)}
                className="flex-shrink-0 bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                disabled={loading}
              >
                <span className="mr-2">{q.icon}</span>
                {q.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {msg.type === 'assistant' && (
                      <Bot className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {msg.type === 'user' && msg.query && (
                        <p className="whitespace-pre-wrap">{msg.query}</p>
                      )}
                      {msg.type === 'assistant' && msg.response && (
                        <p className="whitespace-pre-wrap">{msg.response}</p>
                      )}
                    </div>
                    {msg.type === 'user' && (
                      <User className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-green-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-end space-x-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about disaster safety, emergency procedures, or preparedness..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !message.trim()}
              className={`p-4 rounded-xl transition-colors ${
                loading || !message.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Send className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenChatPage;
