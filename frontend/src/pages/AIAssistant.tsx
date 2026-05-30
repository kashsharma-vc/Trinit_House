import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2, Database, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { API_BASE_URL } from "@/lib/api";

type Message = {
  id: string;
  type: "user" | "bot";
  content: string;
  isAction?: boolean; // If true, indicates the bot performed an admin action
};

export default function AIAssistantPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() => {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    
    // Get the user's name (first_name, username, or default to Admin/User)
    const userName = user?.first_name || user?.username || (user?.is_superuser ? "Admin" : "User");
    
    const hour = new Date().getHours();
    let timeGreeting = "Good evening";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";

    return [
      {
        id: "1",
        type: "bot",
        content: `Namaste! ${timeGreeting} ${userName}! I am Trinity Assistant. How can I help?`,
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      
      const response = await fetch(`${API_BASE_URL}/operations/ai/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simple logic to detect if the AI executed a function (like "status: success")
        const isAction = data.reply.includes("status") && data.reply.includes("success");
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: data.reply || "Done.",
            isAction: isAction
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: `Error: ${data.error || "Failed to process request"}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "Network error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Command Center</h1>
            <p className="text-slate-500 font-medium">Full automation control and system insights.</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden bg-white shadow-xl shadow-slate-200/50 border-slate-200">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="font-bold text-white">Trinity AI</h3>
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Privileges Active
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded flex items-center gap-1">
                <Database className="w-3 h-3" /> Live Sync
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.type === "user" ? "bg-slate-200" : "bg-indigo-100"
                  }`}>
                    {message.type === "user" ? (
                      <User className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  
                  <div className={`px-5 py-3.5 rounded-2xl ${
                    message.type === "user"
                      ? "bg-slate-900 text-white rounded-tr-sm shadow-md"
                      : message.isAction 
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-tl-sm shadow-sm"
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm"
                  }`}>
                    {message.isAction && (
                      <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                        <ShieldCheck className="w-4 h-4" /> Action Executed Successfully
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                      {message.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="px-5 py-3.5 rounded-2xl bg-white border border-slate-100 rounded-tl-sm shadow-sm flex items-center gap-2 text-slate-500 font-medium text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    Processing request & analyzing data...
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me to summarize dashboards, update inventory, or manage service requests..."
                className="flex-1 h-12 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
            <div className="text-center mt-3">
              <p className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Powered by Gemini
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
