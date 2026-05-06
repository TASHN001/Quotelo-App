import { ChevronLeft, Mic, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentTimestamp } from '../lib/dateUtils';
import { ds } from '../lib/designSystem';

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
    <div className={`min-h-screen ${ds.bg} flex flex-col`}>
      {/* Sub-screen header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-[#f2f2f7]">
        <button onClick={() => setCurrentScreen('ai-generator')} className={ds.headerIconBtn}>
          <ChevronLeft className="w-4 h-4 text-[#3c3c43]" />
        </button>
        <h1 className={`${ds.headline} text-black flex-1 text-center`}>{selectedDocumentType} Chat</h1>
        <div className="w-8" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((message) => (
          message.role === 'assistant' ? (
            <div key={message.id} className="max-w-[80%]">
              <p className={`${ds.caption} text-[#f97316] mb-1 ml-1`}>Quotelo AI</p>
              <div className="bg-white rounded-xl rounded-bl-[4px] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <p className={`${ds.callout} text-black leading-relaxed`}>{message.content}</p>
              </div>
            </div>
          ) : (
            <div key={message.id} className="max-w-[80%] self-end">
              <div className="bg-[#007aff] rounded-xl rounded-br-[4px] px-4 py-3 shadow-[0_4px_12px_rgba(0,122,255,0.25)]">
                <p className={`${ds.callout} text-white leading-relaxed`}>{message.content}</p>
              </div>
            </div>
          )
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 pb-8 pt-3 flex flex-col gap-3">
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-3 px-4 py-2.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 text-[15px] text-black placeholder:text-[#c7c7cc] focus:outline-none bg-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${ds.press} ${ds.transition} flex-shrink-0 ${
              inputValue.trim()
                ? `bg-[#f97316] ${ds.shadowOrange}`
                : 'bg-[#e5e5ea]'
            }`}
          >
            <Send className={`w-4 h-4 ${inputValue.trim() ? 'text-white' : 'text-[#c7c7cc]'}`} />
          </button>
          <button
            className={`w-9 h-9 bg-[#f97316] rounded-full flex items-center justify-center ${ds.shadowOrange} ${ds.press} ${ds.transition} flex-shrink-0`}
          >
            <Mic className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
