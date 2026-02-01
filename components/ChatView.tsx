import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Bot, User, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { MODELS } from '../constants';
import ReactMarkdown from 'react-markdown';

const ChatView: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix for API usage later, but keep full string for display
        const base64Data = base64String.split(',')[1];
        setSelectedImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    const currentImage = selectedImage; // store ref for API call
    clearImage();
    setIsLoading(true);

    try {
      // Add placeholder for model response
      const responseId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: responseId, role: 'model', text: '' }]);

      const stream = await streamChatResponse(
        MODELS.CHAT,
        newMessage.text,
        currentImage ? { inlineData: { data: currentImage.data, mimeType: currentImage.mimeType } } : undefined
      );

      let fullText = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { ...msg, text: fullText } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Sorry, I encountered an error processing your request.",
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
            <Bot className="w-16 h-16 mb-4" />
            <p className="text-lg">Ask Driver Co-Pilot</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-700 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="User upload" 
                  className="max-w-xs rounded-lg border border-slate-700 mb-2" 
                />
              )}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : msg.isError 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-tl-sm'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-sm'
                }`}
              >
                {msg.role === 'model' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          {selectedImage && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Selected" className="w-10 h-10 object-cover rounded" />
              <span className="text-xs text-slate-400">Image attached</span>
              <button 
                type="button" 
                onClick={clearImage}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl transition-colors ${
                selectedImage 
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title="Upload image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-slate-800 text-slate-200 placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all border border-transparent focus:border-emerald-500/30"
            />
            
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatView;