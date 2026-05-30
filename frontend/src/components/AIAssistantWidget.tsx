import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "ai"; content: string }[]>(() => {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    
    const userName = user?.first_name || user?.username || (user?.is_superuser ? "Admin" : "User");
    
    const hour = new Date().getHours();
    let timeGreeting = "Good evening";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";

    return [
      { 
        role: "ai", 
        content: `Namaste! ${timeGreeting} ${userName}! I am Trinity Assistant. How can I help?`
      }
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog, isLoading]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMsg = message;
    setMessage("");
    setChatLog(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/operations/ai/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!res.ok) throw new Error("Failed to communicate with AI");
      
      const data = await res.json();
      setChatLog(prev => [...prev, { role: "ai", content: data.reply || data.error }]);
    } catch (error: any) {
      setChatLog(prev => [...prev, { role: "ai", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (The "Ball") */}
      <motion.button
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-primary to-primary/90 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-indigo-500/50 transition-shadow focus:outline-none focus:ring-4 focus:ring-indigo-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={false}
        animate={{
          scale: isOpen ? 0 : 1,
          opacity: isOpen ? 0 : 1,
        }}
      >
        <Sparkles className="w-8 h-8" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-primary/20 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/90 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <h3 className="font-bold text-lg">TRINITY ASSISTANCE </h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1 rounded-full hover:bg-primary-foreground/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-primary/5  space-y-4">
              {chatLog.map((chat, idx) => (
                <div key={idx} className={cn("flex w-full", chat.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl p-3 shadow-sm",
                    chat.role === "user" 
                      ? "bg-primary text-white rounded-tr-sm" 
                      : "bg-primary/5 border border-primary/20 text-primary rounded-tl-sm whitespace-pre-wrap"
                  )}>
                    {chat.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-primary/60 rounded-full"/>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 bg-primary/60 rounded-full"/>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 bg-primary/60 rounded-full"/>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-primary/5 border-t border-primary/20 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask me to automate something..."
                className="flex-1 bg-primary/10 border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full px-4 py-2 text-sm transition-all outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button 
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-primary hover:bg-primary/90  shrink-0"
              >
                <Send className="w-4 h-4 text-white -ml-0.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
