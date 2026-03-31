import { ArrowLeft, Mic, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentTimestamp } from '../lib/dateUtils';

const GREETING_ID = 'init-greeting';

export function Chat() {
  const { selectedDocumentType, userProfile, getChatHistory, addChatMessage, setCurrentScreen } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(getChatHistory(selectedDocumentType));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = getChatHistory(selectedDocumentType);
    const hasGreeting = history.some(msg => msg.id === GREETING_ID);

    if (history.length === 0 && !hasGreeting) {
      const greetingMessage = {
        id: GREETING_ID,
        role: 'assistant' as const,
        content: `Hi ${userProfile.name}. I can help you create a ${selectedDocumentType}. To get started, I'll need the relevant details.`,
        timestamp: getCurrentTimestamp()
      };
      addChatMessage(selectedDocumentType, greetingMessage);
      setMessages([greetingMessage]);
    } else {
      setMessages(history);
    }
  }, [selectedDocumentType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: `user-${getCurrentTimestamp()}`,
      role: 'user' as const,
      content: inputValue,
      timestamp: getCurrentTimestamp()
    };

    addChatMessage(selectedDocumentType, userMessage);

    setTimeout(() => {
      const assistantMessage = {
        id: `assistant-${getCurrentTimestamp()}`,
        role: 'assistant' as const,
        content: `I've received your message: "${inputValue}". This is a simulated response for demonstration purposes.`,
        timestamp: getCurrentTimestamp()
      };
      addChatMessage(selectedDocumentType, assistantMessage);
      setMessages(getChatHistory(selectedDocumentType));
    }, 500);

    setMessages(getChatHistory(selectedDocumentType));
    setInputValue('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ai-generator')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedDocumentType} Chat</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 h-12 px-4 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
              inputValue.trim()
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" strokeWidth={2} />
          </button>

          <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <Mic className="w-5 h-5 text-gray-600" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
