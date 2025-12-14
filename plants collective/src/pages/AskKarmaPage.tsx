import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/App";
import { plantsAI, type Message as AIMessage } from "@/services/karmaAIService";
import { useToast } from "@/hooks/use-toast";

interface DisplayMessage {
  id: string;
  content: string;
  is_user_message: boolean;
  created_at: string;
}

const AskKarmaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome on mount
  useEffect(() => {
    showWelcomeMessage();
  }, []);

  const showWelcomeMessage = () => {
    const welcomeMsg: DisplayMessage = {
      id: 'welcome',
      content: `Hi ${user?.name || 'there'}! 👋

I'm Plants Collective AI, your personal skincare and wellness assistant. I'm here to help you with:

• Personalized skincare advice
• Hair care recommendations
• Product ingredient analysis
• Beauty and wellness tips
• Answers to all your beauty questions

Feel free to ask me anything!`,
      is_user_message: false,
      created_at: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !user?.id) return;

    const userMessageContent = inputText;
    setInputText("");
    setIsLoading(true);

    try {
      // Add user message to UI immediately
      const tempUserMessage: DisplayMessage = {
        id: `temp-${Date.now()}`,
        content: userMessageContent,
        is_user_message: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev.filter(m => m.id !== 'welcome'), tempUserMessage]);

      // Build user context
      const userContext = {
        name: user.name,
        gender: user.gender,
        age: user.birthdate ? new Date().getFullYear() - new Date(user.birthdate).getFullYear() : undefined
      };

      // Generate AI response
      let aiResponse;
      try {
        aiResponse = await plantsAI.generateResponse(
          userMessageContent,
          [],
          userContext
        );

        if (!aiResponse) {
          throw new Error('AI service returned null response');
        }
      } catch (aiError: any) {
        console.error('AI generation error:', aiError);
        throw new Error(`Failed to generate AI response: ${aiError.message || 'Unknown error'}`);
      }

      // Add AI message to UI (no persistence)
      const aiMsg: DisplayMessage = {
        id: `ai-${Date.now()}`,
        content: aiResponse.text,
        is_user_message: false,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove temporary user message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      
      let errorContent = "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";
      let errorDescription = "Failed to send message. Please try again.";
      
      // Provide more specific error messages
      if (error.message?.includes('conversation') || error.message?.includes('Database connection')) {
        errorDescription = error.message || "Failed to create conversation. Please check your connection and try again.";
      } else if (error.message?.includes('generate') || error.message?.includes('AI')) {
        errorDescription = "Failed to generate AI response. The AI service may be temporarily unavailable.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorDescription = "Network error. Please check your internet connection and try again.";
      } else {
        errorDescription = error.message || "An error occurred. Please try again.";
      }
      
      const errorMsg: DisplayMessage = {
        id: `error-${Date.now()}`,
        content: errorContent,
        is_user_message: false,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      toast({
        title: "Error",
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Clean up any potential formatting issues
    let cleanContent = content
      .replace(/\*\*\s*[{\[\(]/g, '') // Remove broken markdown
      .replace(/[}\]\)]\s*\*\*/g, '') // Remove broken markdown
      .replace(/\*\*\*+/g, '') // Remove multiple asterisks
      .replace(/\n{3,}/g, '\n\n'); // Max 2 line breaks
    
    // Split by double newlines for paragraphs
    const paragraphs = cleanContent.split('\n\n');
    
    return paragraphs.map((para, idx) => {
      const trimmedPara = para.trim();
      if (!trimmedPara) return null;
      
      // Check if it's a bullet list
      if (trimmedPara.includes('•') || trimmedPara.includes('- ') || trimmedPara.match(/^\d+\./m)) {
        const lines = trimmedPara.split('\n').filter(line => line.trim());
        return (
          <div key={idx} className="mb-3 space-y-1">
            {lines.map((line, lineIdx) => {
              const cleanLine = line.trim();
              if (!cleanLine) return null;
              return (
                <div key={lineIdx} className="flex items-start gap-2">
                  {cleanLine.startsWith('•') || cleanLine.startsWith('-') ? (
                    <>
                      <span className="text-green-600 font-bold mt-0.5">•</span>
                      <span className="flex-1">{cleanLine.replace(/^[•\-]\s*/, '')}</span>
                    </>
                  ) : cleanLine.match(/^\d+\./) ? (
                    <span className="flex-1">{cleanLine}</span>
                  ) : (
                    <span className="flex-1">{cleanLine}</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={idx} className="mb-3 last:mb-0 leading-relaxed">
          {trimmedPara}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 flex-shrink-0 safe-area-top nav-safe-area">
        <div className="max-w-5xl mx-auto px-4 py-4 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              aria-label="Go back"
              title="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-gray-800">Plants Collective AI</h1>
              <p className="text-sm text-gray-500">Your AI Beauty Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 gesture-safe-bottom android-safe-container max-w-5xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.is_user_message
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm leading-relaxed">
                {message.is_user_message ? (
                  <p>{message.content}</p>
                ) : (
                  formatMessageContent(message.content)
                )}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.is_user_message ? 'text-green-100' : 'text-gray-500'
                }`}
              >
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Plants Collective AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-end gap-3 max-w-4xl mx-auto w-full">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about skincare, hair care, or wellness..."
              className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            title="Send message"
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Plants Collective AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default AskKarmaPage;
